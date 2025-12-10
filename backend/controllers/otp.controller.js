const otpService = require('../services/otps');
const userService = require('../services/users');
const emailService = require('../services/emailService');
const jwt = require('jsonwebtoken');

// Generate a random OTP code
const generateOTP = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

// @route   POST /api/otp/send
// @desc    Send OTP to email
// @access  Public
const sendOTP = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({
        status: 'error',
        message: 'Email is required'
      });
    }

    // Check if user exists
    const user = await userService.findByEmail(email);
    if (!user) {
      return res.status(404).json({
        status: 'error',
        message: 'User not found'
      });
    }

    // Generate OTP
    const code = generateOTP();
    const expiresIn = 10 * 60 * 1000; // 10 minutes

    // Save OTP to database
    await otpService.create(email, code, expiresIn);

    // Send OTP via email
    try {
      const transporter = emailService.createTransporter();
      await transporter.sendMail({
        from: process.env.EMAIL_USER,
        to: email,
        subject: 'Your iReporter OTP Code',
        html: `
          <h2>OTP Verification</h2>
          <p>Your one-time password is:</p>
          <h1 style="letter-spacing: 5px; font-weight: bold;">${code}</h1>
          <p>This code will expire in 10 minutes.</p>
          <p>Do not share this code with anyone.</p>
        `
      });
    } catch (emailErr) {
      console.error('Failed to send OTP email:', emailErr);
      return res.status(500).json({
        status: 'error',
        message: 'Failed to send OTP email'
      });
    }

    res.status(200).json({
      status: 'success',
      message: 'OTP sent to email',
      data: {
        email,
        expiresIn
      }
    });
  } catch (error) {
    console.error('Send OTP error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Error sending OTP',
      error: error.message
    });
  }
};

// @route   POST /api/otp/verify
// @desc    Verify OTP code
// @access  Public
const verifyOTP = async (req, res) => {
  try {
    const { email, code } = req.body;

    if (!email || !code) {
      return res.status(400).json({
        status: 'error',
        message: 'Email and OTP code are required'
      });
    }

    // Verify OTP
    const isValid = await otpService.verify(email, code);
    if (!isValid) {
      return res.status(401).json({
        status: 'error',
        message: 'Invalid or expired OTP'
      });
    }

    // Get user
    const user = await userService.findByEmail(email);
    if (!user) {
      return res.status(404).json({
        status: 'error',
        message: 'User not found'
      });
    }

    // Delete OTP after successful verification
    await otpService.deleteByEmail(email);

    // Generate JWT token
    const token = jwt.sign(
      { id: user.id },
      process.env.JWT_SECRET || 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934c',
      { expiresIn: process.env.JWT_EXPIRE || '7d' }
    );

    const { password: _pwd, ...userResponse } = user;

    res.json({
      status: 'success',
      message: 'OTP verified successfully',
      data: {
        user: userResponse,
        token
      }
    });
  } catch (error) {
    console.error('Verify OTP error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Error verifying OTP',
      error: error.message
    });
  }
};

module.exports = { sendOTP, verifyOTP };
