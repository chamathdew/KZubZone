const rateLimit = require('express-rate-limit');
const helmet = require('helmet');

// Rate limiting for standard API endpoints
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per window
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    message: 'Too many requests from this IP, please try again after 15 minutes'
  }
});

// Stricter rate limiting for authentication routes
const authLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 15, // Limit each IP to 15 authentication attempts per hour
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    message: 'Too many login attempts from this IP, please try again after an hour'
  }
});

// MongoDB Query Sanitizer middleware to prevent NoSQL injection
const mongoSanitize = (req, res, next) => {
  const sanitize = (obj) => {
    if (obj && typeof obj === 'object') {
      for (const key in obj) {
        if (key.startsWith('$')) {
          delete obj[key];
        } else {
          sanitize(obj[key]);
        }
      }
    }
  };
  sanitize(req.body);
  sanitize(req.query);
  sanitize(req.params);
  next();
};

// XSS Protection Headers (using helmet or manual configuration)
const xssProtection = (req, res, next) => {
  res.setHeader('X-XSS-Protection', '1; mode=block');
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'SAMEORIGIN');
  res.setHeader('Content-Security-Policy', "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com; img-src 'self' data: https:; media-src 'self' https:; connect-src 'self' https://api.themoviedb.org https:;");
  next();
};

module.exports = {
  apiLimiter,
  authLimiter,
  mongoSanitize,
  xssProtection,
  helmetGuard: helmet()
};
