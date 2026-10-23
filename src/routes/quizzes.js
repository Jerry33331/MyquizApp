/**
 * Quiz Routes
 * Phase 2: Quiz Engine
 */

const express = require('express');
const { query } = require('../config/db');
const { requireAuth } = require('../middleware/auth');
const router = express.Router();

/**
 * GET /api/quizzes
 * Get all published quizzes (for players)
 */
router.get('/', async (req, res) => {
  try {
    const result = await query(
      `SELECT id, title, description, category, difficulty, time_limit 
       FROM quizzes 
       WHERE is_published = true 
       ORDER BY category, title`
    );
    
    // Count questions for each quiz
    const quizzesWithCounts = await Promise.all(
      result.rows.map(async (quiz) => {
        const countResult = await query(
          'SELECT COUNT(*) FROM questions WHERE quiz_id = $1',
          [quiz.id]
        );
        return {
          ...quiz,
          question_count: parseInt(countResult.rows[0].count, 10),
        };
      })
    );
    
    res.json({
      success: true,
      data: { quizzes: quizzesWithCounts }
    });
  } catch (error) {
    console.error('Get quizzes error:', error);
    res.status(500).json({
      success: false,
      error: { code: 'INTERNAL_ERROR', message: 'Failed to get quizzes' }
    });
  }
});

/**
 * GET /api/quizzes/all
 * Get all quizzes including unpublished (admin only)
 */
router.get('/all', requireAuth, async (req, res) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({
      success: false,
      error: { code: 'FORBIDDEN', message: 'Admin access required' }
    });
  }
  
  try {
    const result = await query(
      `SELECT id, title, description, category, difficulty, time_limit, is_published 
       FROM quizzes 
       ORDER BY category, title`
    );
    
    const quizzesWithCounts = await Promise.all(
      result.rows.map(async (quiz) => {
        const countResult = await query(
          'SELECT COUNT(*) FROM questions WHERE quiz_id = $1',
          [quiz.id]
        );
        return {
          ...quiz,
          question_count: parseInt(countResult.rows[0].count, 10),
        };
      })
    );
    
    res.json({
      success: true,
      data: { quizzes: quizzesWithCounts }
    });
  } catch (error) {
    console.error('Get all quizzes error:', error);
    res.status(500).json({
      success: false,
      error: { code: 'INTERNAL_ERROR', message: 'Failed to get quizzes' }
    });
  }
});

/**
 * GET /api/quizzes/:id
 * Get a specific quiz with its questions (for taking the quiz)
 */
router.get('/:id', requireAuth, async (req, res) => {
  try {
    const quizResult = await query(
      `SELECT id, title, description, category, difficulty, time_limit 
       FROM quizzes 
       WHERE id = $1 AND is_published = true`,
      [req.params.id]
    );
    
    if (quizResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Quiz not found or not published' }
      });
    }
    
    const quiz = quizResult.rows[0];
    
    // Get questions for this quiz
    const questionsResult = await query(
      `SELECT id, quiz_id, question_text, choices, correct_answer_index, points, position, movie_reference, image_url 
       FROM questions 
       WHERE quiz_id = $1 
       ORDER BY position`,
      [quiz.id]
    );
    
    // Parse choices from JSONB
    const questions = questionsResult.rows.map(q => ({
      ...q,
      choices: Array.isArray(q.choices) ? q.choices : []
    }));
    
    res.json({
      success: true,
      data: { quiz, questions }
    });
  } catch (error) {
    console.error('Get quiz error:', error);
    res.status(500).json({
      success: false,
      error: { code: 'INTERNAL_ERROR', message: 'Failed to get quiz' }
    });
  }
});

/**
 * POST /api/quizzes
 * Create a new quiz (admin only)
 */
router.post('/', requireAuth, async (req, res) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({
      success: false,
      error: { code: 'FORBIDDEN', message: 'Admin access required' }
    });
  }
  
  try {
    const { title, description, category, difficulty = 'Medium', time_limit = 0, is_published = true } = req.body;
    
    // Validate category
    const validCategories = ['Action', 'Comedy', 'Horror', 'Animated', 'Superhero'];
    if (!validCategories.includes(category)) {
      return res.status(400).json({
        success: false,
        error: { code: 'VALIDATION_ERROR', message: 'Invalid category' }
      });
    }
    
    // Validate difficulty
    const validDifficulties = ['Easy', 'Medium', 'Hard'];
    if (!validDifficulties.includes(difficulty)) {
      return res.status(400).json({
        success: false,
        error: { code: 'VALIDATION_ERROR', message: 'Invalid difficulty' }
      });
    }
    
    const result = await query(
      `INSERT INTO quizzes (title, description, category, owner_id, difficulty, time_limit, is_published) 
       VALUES ($1, $2, $3, $4, $5, $6, $7) 
       RETURNING id, title, description, category, difficulty, time_limit, is_published`,
      [title, description, category, req.user.id, difficulty, time_limit, is_published]
    );
    
    res.json({
      success: true,
      message: 'Quiz created successfully',
      data: { quiz: result.rows[0] }
    });
  } catch (error) {
    console.error('Create quiz error:', error);
    res.status(500).json({
      success: false,
      error: { code: 'INTERNAL_ERROR', message: 'Failed to create quiz' }
    });
  }
});

/**
 * PUT /api/quizzes/:id
 * Update a quiz (admin only)
 */
router.put('/:id', requireAuth, async (req, res) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({
      success: false,
      error: { code: 'FORBIDDEN', message: 'Admin access required' }
    });
  }
  
  try {
    const { title, description, category, difficulty, time_limit, is_published } = req.body;
    
    const result = await query(
      `UPDATE quizzes SET title = COALESCE($1, title), description = COALESCE($2, description), 
       category = COALESCE($3, category), difficulty = COALESCE($4, difficulty), 
       time_limit = COALESCE($5, time_limit), is_published = COALESCE($6, is_published) 
       WHERE id = $7 
       RETURNING id, title, description, category, difficulty, time_limit, is_published`,
      [title, description, category, difficulty, time_limit, is_published, req.params.id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Quiz not found' }
      });
    }
    
    res.json({
      success: true,
      message: 'Quiz updated successfully',
      data: { quiz: result.rows[0] }
    });
  } catch (error) {
    console.error('Update quiz error:', error);
    res.status(500).json({
      success: false,
      error: { code: 'INTERNAL_ERROR', message: 'Failed to update quiz' }
    });
  }
});

/**
 * DELETE /api/quizzes/:id
 * Delete a quiz (admin only)
 */
router.delete('/:id', requireAuth, async (req, res) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({
      success: false,
      error: { code: 'FORBIDDEN', message: 'Admin access required' }
    });
  }
  
  try {
    const result = await query(
      'DELETE FROM quizzes WHERE id = $1 RETURNING id',
      [req.params.id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Quiz not found' }
      });
    }
    
    res.json({
      success: true,
      message: 'Quiz deleted successfully'
    });
  } catch (error) {
    console.error('Delete quiz error:', error);
    res.status(500).json({
      success: false,
      error: { code: 'INTERNAL_ERROR', message: 'Failed to delete quiz' }
    });
  }
});

/**
 * GET /api/quizzes/category/:category
 * Get quizzes by category
 */
router.get('/category/:category', async (req, res) => {
  try {
    const result = await query(
      `SELECT id, title, description, category, difficulty, time_limit 
       FROM quizzes 
       WHERE is_published = true AND category = $1 
       ORDER BY title`,
      [req.params.category]
    );
    
    const quizzesWithCounts = await Promise.all(
      result.rows.map(async (quiz) => {
        const countResult = await query(
          'SELECT COUNT(*) FROM questions WHERE quiz_id = $1',
          [quiz.id]
        );
        return {
          ...quiz,
          question_count: parseInt(countResult.rows[0].count, 10),
        };
      })
    );
    
    res.json({
      success: true,
      data: { quizzes: quizzesWithCounts }
    });
  } catch (error) {
    console.error('Get quizzes by category error:', error);
    res.status(500).json({
      success: false,
      error: { code: 'INTERNAL_ERROR', message: 'Failed to get quizzes' }
    });
  }
});

module.exports = router;
