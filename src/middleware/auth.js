/**
 * Authentication Middleware
 * Phase 1: Foundation and Authentication
 */

/**
 * Check if user is authenticated
 * Redirects to login if not authenticated
 */
const requireAuth = (req, res, next) => {
  if (req.session && req.session.user) {
    req.user = req.session.user;
    return next();
  }
  
  // Return 401 for API requests, redirect for page requests
  if (req.headers.accept && req.headers.accept.includes('application/json')) {
    return res.status(401).json({
      success: false,
      error: { code: 'NOT_AUTHENTICATED', message: 'Please login first' }
    });
  }
  
  res.redirect('/login');
};

/**
 * Check if user is admin
 * Returns 403 if not admin
 */
const requireAdmin = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      error: { code: 'NOT_AUTHENTICATED', message: 'Please login first' }
    });
  }
  
  if (req.user.role !== 'admin') {
    return res.status(403).json({
      success: false,
      error: { code: 'FORBIDDEN', message: 'Admin access required' }
    });
  }
  
  next();
};

/**
 * Check if user is player (not admin)
 */
const requirePlayer = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      error: { code: 'NOT_AUTHENTICATED', message: 'Please login first' }
    });
  }
  
  if (req.user.role !== 'player') {
    return res.status(403).json({
      success: false,
      error: { code: 'FORBIDDEN', message: 'Player access required' }
    });
  }
  
  next();
};

/**
 * Attach user to request if logged in
 */
const attachUser = (req, res, next) => {
  if (req.session && req.session.user) {
    req.user = req.session.user;
  }
  next();
};

module.exports = {
  requireAuth,
  requireAdmin,
  requirePlayer,
  attachUser,
};
