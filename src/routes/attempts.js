/**
 * Attempt Routes
 * Phase 2: Quiz Engine
 */

const express = require('express');
const { query } = require('../config/db');
const { requireAuth } = require('../middleware/auth');
const router = express.Router();

/**
 * POST /api/attempts
 * Submit a quiz attempt
 */
router.post('/', requireAuth, async (req, res) => {
  try {
    const { quiz_id, answers, time_taken } = req.body;
    
    // Validate
    if (!quiz_id || !answers || !Array.isArray(answers)) {
      return res.status(400).json({
        success: false,
        error: { code: 'VALIDATION_ERROR', message: 'Missing quiz_id or answers' }
      });
    }
    
    // Verify quiz exists and is published
    const quizResult = await query(
      `SELECT id, title FROM quizzes 
       WHERE id = $1 AND is_published = true`,
      [quiz_id]
    );
    
    if (quizResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Quiz not found or not published' }
      });
    }
    
    // Get all questions for this quiz
    const questionsResult = await query(
      `SELECT id, correct_answer_index, points 
       FROM questions 
       WHERE quiz_id = $1 
       ORDER BY position`,
      [quiz_id]
    );
    
    const questions = questionsResult.rows;
    
    if (questions.length === 0) {
      return res.status(400).json({
        success: false,
        error: { code: 'VALIDATION_ERROR', message: 'Quiz has no questions' }
      });
    }
    
    // Validate answers array matches questions
    if (answers.length !== questions.length) {
      return res.status(400).json({
        success: false,
        error: { code: 'VALIDATION_ERROR', message: `Expected ${questions.length} answers, got ${answers.length}` }
      });
    }
    
    // Validate all answers are provided (no null/undefined)
    if (answers.some(a => a === null || a === undefined)) {
      return res.status(400).json({
        success: false,
        error: { code: 'VALIDATION_ERROR', message: 'All questions must be answered to submit' }
      });
    }
    
    // Calculate score
    let score = 0;
    let totalPossible = 0;
    
    for (let i = 0; i < questions.length; i++) {
      const question = questions[i];
      const userAnswer = answers[i];
      
      totalPossible += question.points;
      
      // Check if answer is correct
      if (userAnswer === question.correct_answer_index) {
        score += question.points;
      }
    }
    
    // Calculate percentage
    const percentage = parseFloat(((score / totalPossible) * 100).toFixed(2));
    
    // Save attempt
    const result = await query(
      `INSERT INTO attempts (user_id, quiz_id, score, total_questions, percentage, time_taken) 
       VALUES ($1, $2, $3, $4, $5, $6) 
       RETURNING id, user_id, quiz_id, score, total_questions, percentage, completed_at, time_taken`,
      [req.user.id, quiz_id, score, questions.length, percentage, time_taken || null]
    );
    
    const attempt = result.rows[0];
    
    // Calculate correct count based on points
    // Assuming each question is worth 1 point by default
    const pointsPerQuestion = questions.length > 0 ? Math.min(...questions.map(q => q.points)) : 1;
    const correctCount = Math.round(score / pointsPerQuestion);
    const incorrectCount = questions.length - correctCount;
    
    res.json({
      success: true,
      message: 'Quiz attempt submitted successfully',
      data: {
        attempt,
        score,
        total_questions: questions.length,
        percentage,
        correct_count: correctCount,
        incorrect_count: incorrectCount
      }
    });
  } catch (error) {
    console.error('Submit attempt error:', error);
    res.status(500).json({
      success: false,
      error: { code: 'INTERNAL_ERROR', message: 'Failed to submit attempt' }
    });
  }
});

/**
 * GET /api/attempts/me
 * Get current user's attempt history
 */
router.get('/me', requireAuth, async (req, res) => {
  try {
    const result = await query(
      `SELECT a.id, a.quiz_id, a.score, a.total_questions, a.percentage, a.completed_at, a.time_taken,
              q.title as quiz_title, q.category as quiz_category
       FROM attempts a
       JOIN quizzes q ON a.quiz_id = q.id
       WHERE a.user_id = $1 
       ORDER BY a.completed_at DESC`,
      [req.user.id]
    );
    
    res.json({
      success: true,
      data: { attempts: result.rows }
    });
  } catch (error) {
    console.error('Get my attempts error:', error);
    res.status(500).json({
      success: false,
      error: { code: 'INTERNAL_ERROR', message: 'Failed to get attempts' }
    });
  }
});

/**
 * GET /api/attempts/quiz/:quizId
 * Get attempts for a specific quiz (admin only)
 */
router.get('/quiz/:quizId', requireAuth, async (req, res) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({
      success: false,
      error: { code: 'FORBIDDEN', message: 'Admin access required' }
    });
  }
  
  try {
    const result = await query(
      `SELECT a.id, a.user_id, a.score, a.total_questions, a.percentage, a.completed_at, a.time_taken,
              u.username, u.role
       FROM attempts a
       JOIN users u ON a.user_id = u.id
       WHERE a.quiz_id = $1 
       ORDER BY a.completed_at DESC`,
      [req.params.quizId]
    );
    
    res.json({
      success: true,
      data: { attempts: result.rows }
    });
  } catch (error) {
    console.error('Get quiz attempts error:', error);
    res.status(500).json({
      success: false,
      error: { code: 'INTERNAL_ERROR', message: 'Failed to get attempts' }
    });
  }
});

/**
 * GET /api/attempts/user/:userId
 * Get attempts for a specific user (admin only)
 */
router.get('/user/:userId', requireAuth, async (req, res) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({
      success: false,
      error: { code: 'FORBIDDEN', message: 'Admin access required' }
    });
  }
  
  try {
    const result = await query(
      `SELECT a.id, a.quiz_id, a.score, a.total_questions, a.percentage, a.completed_at, a.time_taken,
              q.title as quiz_title
       FROM attempts a
       JOIN quizzes q ON a.quiz_id = q.id
       WHERE a.user_id = $1 
       ORDER BY a.completed_at DESC`,
      [req.params.userId]
    );
    
    res.json({
      success: true,
      data: { attempts: result.rows }
    });
  } catch (error) {
    console.error('Get user attempts error:', error);
    res.status(500).json({
      success: false,
      error: { code: 'INTERNAL_ERROR', message: 'Failed to get attempts' }
    });
  }
});

module.exports = router;
