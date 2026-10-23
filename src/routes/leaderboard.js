/**
 * Leaderboard Routes
 * Phase 2: Quiz Engine
 */

const express = require('express');
const { query } = require('../config/db');
const { requireAuth, requireAdmin } = require('../middleware/auth');
const router = express.Router();

/**
 * GET /api/leaderboard
 * Overall leaderboard - ranks users by total completed quiz attempts
 * Tie-breaker: username alphabetically
 */
router.get('/', requireAuth, async (req, res) => {
  try {
    const result = await query(
      `SELECT 
          u.id,
          u.username,
          COUNT(a.id) as total_completed_attempts
       FROM users u
       LEFT JOIN attempts a ON u.id = a.user_id
       GROUP BY u.id, u.username
       ORDER BY total_completed_attempts DESC, u.username ASC
       LIMIT 50`
    );
    
    // Add ranks
    const leaderboard = result.rows.map((row, index) => ({
      rank: index + 1,
      user_id: row.id,
      username: row.username,
      total_completed_attempts: parseInt(row.total_completed_attempts, 10)
    }));
    
    res.json({
      success: true,
      data: { leaderboard }
    });
  } catch (error) {
    console.error('Overall leaderboard error:', error);
    res.status(500).json({
      success: false,
      error: { code: 'INTERNAL_ERROR', message: 'Failed to get leaderboard' }
    });
  }
});

/**
 * GET /api/leaderboard/quiz/:quizId
 * Per-quiz leaderboard - ranks users by highest score, then by attempts count, then username
 * Shows each user's highest score and number of completed attempts for this quiz
 */
router.get('/quiz/:quizId', requireAuth, async (req, res) => {
  try {
    const quizId = req.params.quizId;
    
    // Verify quiz exists
    const quizResult = await query(
      'SELECT id, title FROM quizzes WHERE id = $1',
      [quizId]
    );
    
    if (quizResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Quiz not found' }
      });
    }
    
    // Get per-user stats for this quiz
    const result = await query(
      `SELECT 
          u.id,
          u.username,
          MAX(a.score) as highest_score,
          COUNT(a.id) as completed_attempts
       FROM users u
       LEFT JOIN attempts a ON u.id = a.user_id AND a.quiz_id = $1
       GROUP BY u.id, u.username
       ORDER BY highest_score DESC NULLS LAST, completed_attempts DESC, u.username ASC
       LIMIT 50`,
      [quizId]
    );
    
    // Add ranks
    const leaderboard = result.rows.map((row, index) => ({
      rank: index + 1,
      user_id: row.id,
      username: row.username,
      highest_score: row.highest_score !== null ? parseInt(row.highest_score, 10) : null,
      completed_attempts: parseInt(row.completed_attempts, 10)
    }));
    
    res.json({
      success: true,
      data: {
        quiz_id: parseInt(quizId, 10),
        quiz_title: quizResult.rows[0].title,
        leaderboard
      }
    });
  } catch (error) {
    console.error('Quiz leaderboard error:', error);
    res.status(500).json({
      success: false,
      error: { code: 'INTERNAL_ERROR', message: 'Failed to get quiz leaderboard' }
    });
  }
});

/**
 * POST /api/leaderboard/reset
 * Reset all leaderboard data (delete all attempts) - ADMIN ONLY
 */
router.post('/reset', requireAdmin, async (req, res) => {
  try {
    // Delete all attempts
    await query('DELETE FROM attempts');
    
    res.json({
      success: true,
      message: 'Leaderboard has been reset. All attempt data has been cleared.'
    });
  } catch (error) {
    console.error('Reset leaderboard error:', error);
    res.status(500).json({
      success: false,
      error: { code: 'INTERNAL_ERROR', message: 'Failed to reset leaderboard' }
    });
  }
});

/**
 * DELETE /api/leaderboard/reset
 * Alternative: Delete all attempts - ADMIN ONLY
 */
router.delete('/reset', requireAdmin, async (req, res) => {
  try {
    await query('DELETE FROM attempts');
    
    res.json({
      success: true,
      message: 'Leaderboard has been reset. All attempt data has been cleared.'
    });
  } catch (error) {
    console.error('Reset leaderboard error:', error);
    res.status(500).json({
      success: false,
      error: { code: 'INTERNAL_ERROR', message: 'Failed to reset leaderboard' }
    });
  }
});

module.exports = router;
