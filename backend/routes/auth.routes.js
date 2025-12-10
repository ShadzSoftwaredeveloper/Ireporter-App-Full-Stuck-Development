const express = require('express');
const router = express.Router();
const { signup, signin, verifyOTPAndLogin, getMe, updateProfile } = require('../controllers/auth.controller');
const { verifyToken } = require('../middleware/auth.middleware');

// Public routes
router.post('/signup', signup);
router.post('/signin', signin);
router.post('/verify-otp', verifyOTPAndLogin);

// Protected routes
router.get('/me', verifyToken, getMe);
router.put('/profile', verifyToken, updateProfile);

module.exports = router;
