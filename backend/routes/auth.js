import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { pool } from '../config/database.js';
import { sendOtpEmail } from '../config/email.js';

const router = express.Router();

// Simple OTP storage (in production, use Redis)
const otpStore = new Map();
const signupDataStore = new Map();

const generateOtp = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

const storeOtp = (email, otp) => {
  const expiresAt = Date.now() + 10 * 60 * 1000;
  otpStore.set(email, { otp, expiresAt });
  setTimeout(() => otpStore.delete(email), 10 * 60 * 1000);
};

const verifyOtp = (email, otp) => {
  const stored = otpStore.get(email);
  if (!stored) return { isValid: false, message: 'OTP not found or expired' };
  if (Date.now() > stored.expiresAt) {
    otpStore.delete(email);
    return { isValid: false, message: 'OTP has expired' };
  }
  if (stored.otp !== otp) return { isValid: false, message: 'Invalid OTP' };
  otpStore.delete(email);
  return { isValid: true, message: 'OTP verified successfully' };
};

// Send OTP for sign in
router.post('/send-signin-otp', async (req, res) => {
  try {
    const { email, password } = req.body;

    const [users] = await pool.execute(
      'SELECT * FROM users WHERE email = ?',
      [email]
    );

    if (users.length === 0) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    const user = users[0];
    const isValidPassword = await bcrypt.compare(password, user.password);
    
    if (!isValidPassword) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    const otp = generateOtp();
    storeOtp(email, otp);

    const emailSent = await sendOtpEmail(email, otp);
    
    if (!emailSent) {
      return res.status(500).json({ error: 'Failed to send verification email' });
    }

    res.json({ 
      message: 'Verification code sent to your email',
      email: email 
    });
  } catch (error) {
    console.error('Send signin OTP error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Verify OTP and sign in
router.post('/verify-signin-otp', async (req, res) => {
  try {
    const { email, otp } = req.body;

    const verification = verifyOtp(email, otp);
    
    if (!verification.isValid) {
      return res.status(400).json({ error: verification.message });
    }

    const [users] = await pool.execute(
      'SELECT * FROM users WHERE email = ?',
      [email]
    );

    if (users.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    const user = users[0];
    const token = jwt.sign(
      { userId: user.id, email: user.email, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );

    const { password: _, ...userWithoutPassword } = user;
    
    res.json({
      message: 'Sign in successful',
      user: userWithoutPassword,
      token
    });
  } catch (error) {
    console.error('Verify signin OTP error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Send OTP for sign up
router.post('/send-signup-otp', async (req, res) => {
  try {
    const { email, password, name, role = 'user' } = req.body;

    const [existingUsers] = await pool.execute(
      'SELECT id FROM users WHERE email = ?',
      [email]
    );

    if (existingUsers.length > 0) {
      return res.status(400).json({ error: 'Email already registered' });
    }

    if (password.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters' });
    }

    const otp = generateOtp();
    storeOtp(email, otp);

    // Store signup data temporarily
    const signupData = { email, password, name, role };
    signupDataStore.set(email, signupData);

    const emailSent = await sendOtpEmail(email, otp);
    
    if (!emailSent) {
      signupDataStore.delete(email);
      return res.status(500).json({ error: 'Failed to send verification email' });
    }

    res.json({ 
      message: 'Verification code sent to your email',
      email: email 
    });
  } catch (error) {
    console.error('Send signup OTP error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Verify OTP and complete sign up
router.post('/verify-signup-otp', async (req, res) => {
  try {
    const { email, otp } = req.body;

    const verification = verifyOtp(email, otp);
    
    if (!verification.isValid) {
      return res.status(400).json({ error: verification.message });
    }

    const signupData = signupDataStore.get(email);
    
    if (!signupData) {
      return res.status(400).json({ error: 'Signup session expired. Please start over.' });
    }

    const hashedPassword = await bcrypt.hash(signupData.password, 10);

    const [result] = await pool.execute(
      'INSERT INTO users (email, password, name, role) VALUES (?, ?, ?, ?)',
      [signupData.email, hashedPassword, signupData.name, signupData.role]
    );

    const [users] = await pool.execute(
      'SELECT id, email, name, role, profile_picture, created_at FROM users WHERE id = ?',
      [result.insertId]
    );

    const user = users[0];
    const token = jwt.sign(
      { userId: user.id, email: user.email, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );

    signupDataStore.delete(email);

    res.status(201).json({
      message: 'Account created successfully',
      user,
      token
    });
  } catch (error) {
    console.error('Verify signup OTP error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;