const express = require('express');
const router = express.Router();
const { sendOTP, verifyOTP } = require('../controllers/otp.controller');

// @route   POST /api/otp/send
// @desc    Send OTP to email
// @access  Public
router.post('/send', sendOTP);

// @route   POST /api/otp/verify
// @desc    Verify OTP code
// @access  Public
router.post('/verify', verifyOTP);

module.exports = router;
