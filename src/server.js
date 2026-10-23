/**
 * MyQuizApp - Express Server
 * Phase 2: Quiz Engine
 */

const express = require('express');
const session = require('express-session');
const path = require('path');
const dotenv = require('dotenv');
const rateLimit = require('express-rate-limit');
const { pool } = require('./config/db');

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// ===== App Settings =====
// Trust proxy for Replit (which sets X-Forwarded-For header)
app.set('trust proxy', true);

// ===== Middleware =====
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, '../public')));

// Session configuration
app.use(session({
  secret: process.env.SESSION_SECRET || 'change-in-production',
  resave: false,
  saveUninitialized: false,
  cookie: {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 24 * 60 * 60 * 1000,
  },
  name: 'myquizapp_sid',
}));

// Rate limiting for auth endpoints
const authLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 5,
  message: {
    success: false,
    error: { code: 'RATE_LIMIT', message: 'Too many attempts. Try again later.' }
  },
  standardHeaders: true,
  legacyHeaders: false,
});

app.use('/api/auth/', authLimiter);

// ===== Routes =====

// Health check
app.get('/api/health', async (req, res) => {
  try {
    const client = await pool.connect();
    const result = await client.query('SELECT NOW()');
    client.release();
    res.json({
      success: true,
      message: 'Server and database healthy',
      timestamp: result.rows[0].now,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: { code: 'DB_ERROR', message: 'Database connection failed' }
    });
  }
});

// Auth routes
const authRoutes = require('./routes/auth');
app.use('/api/auth', authRoutes);

// Quiz routes
const quizRoutes = require('./routes/quizzes');
app.use('/api/quizzes', quizRoutes);

// Question routes
const questionRoutes = require('./routes/questions');
app.use('/api/questions', questionRoutes);

// Attempt routes
const attemptRoutes = require('./routes/attempts');
app.use('/api/attempts', attemptRoutes);

// Leaderboard routes
const leaderboardRoutes = require('./routes/leaderboard');
app.use('/api/leaderboard', leaderboardRoutes);

// ===== Error Handling =====
app.use('/api/*', (req, res) => {
  res.status(404).json({
    success: false,
    error: { code: 'NOT_FOUND', message: 'Endpoint not found' }
  });
});

app.use((err, req, res, next) => {
  console.error('Server error:', err);
  res.status(500).json({
    success: false,
    error: { code: 'INTERNAL_ERROR', message: 'Internal server error' }
  });
});

// ===== Serve Frontend =====
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../public/index.html'));
});

// ===== Start Server =====
app.listen(PORT, () => {
  console.log(`MyQuizApp Phase 2 Server running on port ${PORT}`);
  console.log(`Health check: http://localhost:${PORT}/api/health`);
});

module.exports = app;
