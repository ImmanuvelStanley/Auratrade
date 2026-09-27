const jwt = require('jsonwebtoken');
const config = require('../config');
const store = require('../models/store');

async function requireAuth(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ success: false, error: 'Authentication required. No token provided.' });
  }

  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, config.jwtSecret);
    const user = await store.findUserById(decoded.userId);
    if (!user) {
      return res.status(401).json({ success: false, error: 'User account not found or token expired.' });
    }
    req.user = { id: user.id, email: user.email, name: user.name };
    next();
  } catch (err) {
    return res.status(401).json({ success: false, error: 'Invalid or expired authentication token.' });
  }
}

async function optionalAuth(req, res, next) {
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.split(' ')[1];
    try {
      const decoded = jwt.verify(token, config.jwtSecret);
      const user = await store.findUserById(decoded.userId);
      if (user) {
        req.user = { id: user.id, email: user.email, name: user.name };
      }
    } catch (err) {}
  }
  next();
}

module.exports = { requireAuth, optionalAuth };
