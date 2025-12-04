const express = require('express');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const auth = require('../middleware/auth');
const demoStorage = require('../utils/demoStorage');

const router = express.Router();

// Generate JWT token
const generateToken = (userId) => {
  return jwt.sign({ userId }, process.env.JWT_SECRET, { expiresIn: '7d' });
};

// @route   POST /api/auth/register
// @desc    Register a new user
// @access  Public
router.post('/register', async (req, res) => {
  try {
    const { username, email, password, university } = req.body;

    // Validation
    if (!username || !email || !password) {
      return res.status(400).json({ message: 'Please provide username, email, and password' });
    }

    if (password.length < 6) {
      return res.status(400).json({ message: 'Password must be at least 6 characters long' });
    }

    let user;
    
    // Use demo storage if in demo mode
    if (process.env.NODE_ENV === 'demo') {
      // Check if user already exists in demo storage
      const existingUserByEmail = await demoStorage.findUserByEmail(email);
      const existingUserByUsername = await demoStorage.findUserByUsername(username);

      if (existingUserByEmail || existingUserByUsername) {
        return res.status(400).json({ 
          message: existingUserByEmail ? 'Email already registered' : 'Username already taken'
        });
      }

      // Create user in demo storage
      user = await demoStorage.createUser({ username, email, password, university });
    } else {
      // Use MongoDB
      const existingUser = await User.findOne({
        $or: [{ email }, { username }]
      });

      if (existingUser) {
        return res.status(400).json({ 
          message: existingUser.email === email ? 'Email already registered' : 'Username already taken'
        });
      }

      // Create new user
      user = new User({
        username,
        email,
        passwordHash: password, // Will be hashed by pre-save middleware
        university: university || ''
      });

      await user.save();
    }

    // Generate token
    const token = generateToken(user._id);

    res.status(201).json({
      message: 'User registered successfully',
      token,
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        university: user.university
      }
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ message: 'Server error during registration' });
  }
});

// @route   POST /api/auth/login
// @desc    Login user
// @access  Public
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    // Validation
    if (!email || !password) {
      return res.status(400).json({ message: 'Please provide email and password' });
    }

    let user;
    let isMatch = false;

    // Use demo storage if in demo mode
    if (process.env.NODE_ENV === 'demo') {
      user = await demoStorage.findUserByEmail(email);
      if (user) {
        isMatch = await demoStorage.comparePassword(password, user.passwordHash);
      }
    } else {
      // Use MongoDB
      user = await User.findOne({ email });
      if (user) {
        isMatch = await user.comparePassword(password);
      }
    }

    if (!user || !isMatch) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    // Generate token
    const token = generateToken(user._id);

    res.json({
      message: 'Login successful',
      token,
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        university: user.university,
        skills: user.skills,
        savedCompanies: user.savedCompanies,
        profile: user.profile,
        role: user.role || 'user'
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Server error during login' });
  }
});

// @route   GET /api/auth/me
// @desc    Get current user
// @access  Private
router.get('/me', auth, async (req, res) => {
  try {
    res.json({
      user: {
        id: req.user._id,
        username: req.user.username,
        email: req.user.email,
        university: req.user.university,
        skills: req.user.skills || [],
        savedCompanies: req.user.savedCompanies || [],
        profile: req.user.profile || {},
        role: req.user.role || 'user'
      }
    });
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;