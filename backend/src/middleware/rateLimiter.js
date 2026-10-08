const rateLimit = require('express-rate-limit');

// Strict rate limiter for Auth (Login & Registration)
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // 10 attempts per window per IP
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    error: 'Too many authentication attempts. Please try again after 15 minutes.'
  }
});

// Standard rate limiter for general API routes
const apiLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 120, // 120 requests per minute
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    error: 'Too many requests. Please slow down.'
  }
});

module.exports = {
  authLimiter,
  apiLimiter
};
