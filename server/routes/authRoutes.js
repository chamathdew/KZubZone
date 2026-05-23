const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const userController = require('../controllers/userController');
const { protectUser } = require('../middleware/auth');
const { authLimiter } = require('../middleware/security');

const registerValidation = (req, res, next) => next();

// Public auth endpoints
router.post('/register', registerValidation, authController.register);
router.post('/login', authLimiter, authController.login);
router.post('/verify-email', authController.verifyEmail);
router.post('/forgot-password', authController.forgotPassword);
router.post('/reset-password', authController.resetPassword);

// User protected profiles
router.get('/me', protectUser, authController.getMe);
router.put('/profile', protectUser, userController.updateUserProfile);
router.post('/2fa', protectUser, authController.toggle2FA);

// Profile notifications & history
router.get('/notifications', protectUser, userController.getUserNotifications);
router.put('/notifications/:id/read', protectUser, userController.markNotificationRead);

module.exports = router;
