/**
 * Authentication Routes
 * Phase 1: Foundation and Authentication
 */

const express = require('express');
const bcrypt = require('bcryptjs');
const { body, validationResult } = require('express-validator');
const { query } = require('../config/db');
const router = express.Router();

/**
 * POST /api/auth/register
 * Register a new user
 */
router.post('/register', [
  body('username').trim().isLength({ min: 3, max: 50 }).escape(),
  body('email').trim().isEmail().normalizeEmail(),
  body('password').isLength({ min: 8 }),
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      error: { code: 'VALIDATION_ERROR', message: errors.array()[0].msg }
    });
  }
  
  const { username, email, password } = req.body;
  
  try {
    // Check if username exists
    const usernameCheck = await query(
      'SELECT id FROM users WHERE username = $1',
      [username]
    );
    if (usernameCheck.rows.length > 0) {
      return res.status(409).json({
        success: false,
        error: { code: 'CONFLICT', message: 'Username already exists' }
      });
    }
    
    // Check if email exists
    const emailCheck = await query(
      'SELECT id FROM users WHERE email = $1',
      [email]
    );
    if (emailCheck.rows.length > 0) {
      return res.status(409).json({
        success: false,
        error: { code: 'CONFLICT', message: 'Email already exists' }
      });
    }
    
    // Hash password
    const saltRounds = 10;
    const passwordHash = await bcrypt.hash(password, saltRounds);
    
    // Insert user (role defaults to 'player', trigger will make first user admin)
    const result = await query(
      'INSERT INTO users (username, email, password_hash, role) VALUES ($1, $2, $3, $4) RETURNING id, username, email, role, created_at',
      [username, email, passwordHash, 'player']
    );
    
    const user = result.rows[0];
    
    // Create session
    req.session.user = user;
    
    res.json({
      success: true,
      message: 'Registration successful',
      data: { user }
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({
      success: false,
      error: { code: 'INTERNAL_ERROR', message: 'Registration failed' }
    });
  }
});

/**
 * POST /api/auth/login
 * Login user
 */
router.post('/login', [
  body('email').trim().isEmail().normalizeEmail(),
  body('password').exists(),
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      error: { code: 'VALIDATION_ERROR', message: errors.array()[0].msg }
    });
  }
  
  const { email, password } = req.body;
  
  try {
    // Find user by email
    const result = await query(
      'SELECT id, username, email, password_hash, role FROM users WHERE email = $1',
      [email]
    );
    
    if (result.rows.length === 0) {
      // Generic error message (don't reveal if user exists)
      return res.status(401).json({
        success: false,
        error: { code: 'AUTHENTICATION_ERROR', message: 'Invalid email or password' }
      });
    }
    
    const user = result.rows[0];
    
    // Compare passwords
    const passwordMatch = await bcrypt.compare(password, user.password_hash);
    
    if (!passwordMatch) {
      return res.status(401).json({
        success: false,
        error: { code: 'AUTHENTICATION_ERROR', message: 'Invalid email or password' }
      });
    }
    
    // Create session
    req.session.user = user;
    
    res.json({
      success: true,
      message: 'Login successful',
      data: { user }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      success: false,
      error: { code: 'INTERNAL_ERROR', message: 'Login failed' }
    });
  }
});

/**
 * POST /api/auth/logout
 * Logout user
 */
router.post('/logout', (req, res) => {
  req.session.destroy(err => {
    if (err) {
      console.error('Logout error:', err);
      return res.status(500).json({
        success: false,
        error: { code: 'INTERNAL_ERROR', message: 'Logout failed' }
      });
    }
    
    res.clearCookie('myquizapp_sid');
    res.json({
      success: true,
      message: 'Logged out successfully'
    });
  });
});

/**
 * GET /api/auth/me
 * Get current user info
 */
router.get('/me', (req, res) => {
  if (!req.session || !req.session.user) {
    return res.status(401).json({
      success: false,
      error: { code: 'NOT_AUTHENTICATED', message: 'Not logged in' }
    });
  }
  
  res.json({
    success: true,
    data: { user: req.session.user }
  });
});

module.exports = router;
