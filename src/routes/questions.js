/**
 * Question Routes
 * Phase 2: Quiz Engine
 */

const express = require('express');
const { query } = require('../config/db');
const { requireAuth, requireAdmin } = require('../middleware/auth');
const router = express.Router();

/**
 * GET /api/questions/quiz/:quizId
 * Get all questions for a specific quiz
 */
router.get('/quiz/:quizId', requireAuth, async (req, res) => {
  try {
    // Verify quiz exists and is published
    const quizResult = await query(
      'SELECT id FROM quizzes WHERE id = $1 AND is_published = true',
      [req.params.quizId]
    );
    
    if (quizResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Quiz not found or not published' }
      });
    }
    
    const result = await query(
      `SELECT id, quiz_id, question_text, choices, correct_answer_index, points, position, movie_reference, image_url 
       FROM questions 
       WHERE quiz_id = $1 
       ORDER BY position`,
      [req.params.quizId]
    );
    
    const questions = result.rows.map(q => ({
      ...q,
      choices: Array.isArray(q.choices) ? q.choices : []
    }));
    
    res.json({
      success: true,
      data: { questions }
    });
  } catch (error) {
    console.error('Get questions error:', error);
    res.status(500).json({
      success: false,
      error: { code: 'INTERNAL_ERROR', message: 'Failed to get questions' }
    });
  }
});

/**
 * POST /api/questions
 * Create a new question (admin only)
 */
router.post('/', requireAdmin, async (req, res) => {
  try {
    const { quiz_id, question_text, choices, correct_answer_index, points = 1, position, movie_reference = '', image_url = '' } = req.body;
    
    // Validate
    if (!quiz_id || !question_text || !choices || correct_answer_index === undefined) {
      return res.status(400).json({
        success: false,
        error: { code: 'VALIDATION_ERROR', message: 'Missing required fields' }
      });
    }
    
    if (!Array.isArray(choices) || choices.length !== 4) {
      return res.status(400).json({
        success: false,
        error: { code: 'VALIDATION_ERROR', message: 'Exactly 4 choices required' }
      });
    }
    
    if (correct_answer_index < 0 || correct_answer_index > 3) {
      return res.status(400).json({
        success: false,
        error: { code: 'VALIDATION_ERROR', message: 'Correct answer index must be 0-3' }
      });
    }
    
    // Verify quiz exists
    const quizResult = await query(
      'SELECT id FROM quizzes WHERE id = $1',
      [quiz_id]
    );
    
    if (quizResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Quiz not found' }
      });
    }
    
    // Get next position if not provided
    let finalPosition = position;
    if (finalPosition === undefined) {
      const countResult = await query(
        'SELECT COUNT(*) FROM questions WHERE quiz_id = $1',
        [quiz_id]
      );
      finalPosition = parseInt(countResult.rows[0].count, 10);
    }
    
    const result = await query(
      `INSERT INTO questions (quiz_id, question_text, choices, correct_answer_index, points, position, movie_reference, image_url) 
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8) 
       RETURNING id, quiz_id, question_text, choices, correct_answer_index, points, position, movie_reference, image_url`,
      [quiz_id, question_text, JSON.stringify(choices), correct_answer_index, points, finalPosition, movie_reference, image_url]
    );
    
    const question = result.rows[0];
    question.choices = Array.isArray(question.choices) ? question.choices : [];
    
    res.json({
      success: true,
      message: 'Question created successfully',
      data: { question }
    });
  } catch (error) {
    console.error('Create question error:', error);
    res.status(500).json({
      success: false,
      error: { code: 'INTERNAL_ERROR', message: 'Failed to create question' }
    });
  }
});

/**
 * PUT /api/questions/:id
 * Update a question (admin only)
 */
router.put('/:id', requireAdmin, async (req, res) => {
  try {
    const { quiz_id, question_text, choices, correct_answer_index, points, position, movie_reference, image_url } = req.body;
    
    // Validate
    if (choices && (!Array.isArray(choices) || choices.length !== 4)) {
      return res.status(400).json({
        success: false,
        error: { code: 'VALIDATION_ERROR', message: 'Exactly 4 choices required' }
      });
    }
    
    if (correct_answer_index !== undefined && (correct_answer_index < 0 || correct_answer_index > 3)) {
      return res.status(400).json({
        success: false,
        error: { code: 'VALIDATION_ERROR', message: 'Correct answer index must be 0-3' }
      });
    }
    
    // Build update query
    const updates = [];
    const values = [];
    let paramIndex = 1;
    
    if (quiz_id !== undefined) {
      updates.push(`quiz_id = $${paramIndex}`);
      values.push(quiz_id);
      paramIndex++;
    }
    if (question_text !== undefined) {
      updates.push(`question_text = $${paramIndex}`);
      values.push(question_text);
      paramIndex++;
    }
    if (choices !== undefined) {
      updates.push(`choices = $${paramIndex}`);
      values.push(JSON.stringify(choices));
      paramIndex++;
    }
    if (correct_answer_index !== undefined) {
      updates.push(`correct_answer_index = $${paramIndex}`);
      values.push(correct_answer_index);
      paramIndex++;
    }
    if (points !== undefined) {
      updates.push(`points = $${paramIndex}`);
      values.push(points);
      paramIndex++;
    }
    if (position !== undefined) {
      updates.push(`position = $${paramIndex}`);
      values.push(position);
      paramIndex++;
    }
    if (movie_reference !== undefined) {
      updates.push(`movie_reference = $${paramIndex}`);
      values.push(movie_reference);
      paramIndex++;
    }
    if (image_url !== undefined) {
      updates.push(`image_url = $${paramIndex}`);
      values.push(image_url);
      paramIndex++;
    }
    
    values.push(req.params.id);
    
    const result = await query(
      `UPDATE questions SET ${updates.join(', ')} WHERE id = $${paramIndex} RETURNING *`,
      values
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Question not found' }
      });
    }
    
    const question = result.rows[0];
    question.choices = Array.isArray(question.choices) ? question.choices : [];
    
    res.json({
      success: true,
      message: 'Question updated successfully',
      data: { question }
    });
  } catch (error) {
    console.error('Update question error:', error);
    res.status(500).json({
      success: false,
      error: { code: 'INTERNAL_ERROR', message: 'Failed to update question' }
    });
  }
});

/**
 * DELETE /api/questions/:id
 * Delete a question (admin only)
 */
router.delete('/:id', requireAdmin, async (req, res) => {
  try {
    const result = await query(
      'DELETE FROM questions WHERE id = $1 RETURNING id',
      [req.params.id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Question not found' }
      });
    }
    
    res.json({
      success: true,
      message: 'Question deleted successfully'
    });
  } catch (error) {
    console.error('Delete question error:', error);
    res.status(500).json({
      success: false,
      error: { code: 'INTERNAL_ERROR', message: 'Failed to delete question' }
    });
  }
});

module.exports = router;
