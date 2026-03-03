import express from 'express';
import User from '../models/User.js';
import jwt from 'jsonwebtoken';
import { protect, admin } from '../middleware/auth.js';
const router = express.Router();

// Register user
router.post('/register', async (req, res) => {
  try {
    const { username, email, password } = req.body;

    // Check if user exists
    const existingUser = await User.findOne({
      $or: [{ email }, { username }]
    });

    if (existingUser) {
      return res.status(400).json({
        message: 'User with this email or username already exists'
      });
    }

    // Create new user (password will be hashed later)
    const user = new User({
      username,
      email,
      password // This will be hashed when we add bcrypt
    });

    await user.save();

    res.status(201).json({
      message: 'User created successfully',
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        xp: user.xp
      }
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Login user
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    // Find user
    const user = await User.findOne({ email });
    if (!user || !(await user.correctPassword(password, user.password))) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    const token = jwt.sign(
      { id: user._id },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN }
    );

    res.json({
      message: 'Login successful',
      token,
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        xp: user.xp,
        role: user.role
      }
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Add admin-only route
router.get('/', protect, admin, async (req, res) => {
  try {
    const users = await User.find().select('-password');
    res.json(users);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get user profile
// Get user profile - FIXED VERSION
router.get('/:id', protect, async (req, res) => {
  try {
    // Add authorization - users can only view their own profile unless admin
    if (req.user._id.toString() !== req.params.id && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Not authorized to view this profile' });
    }

    const user = await User.findById(req.params.id)
      .populate('completedCourses.courseId')
      .select('-password');

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Format response to match frontend expectations
    const profileData = {
      id: user._id,
      username: user.username,
      email: user.email,
      role: user.role,
      xp: user.xp || 0,
      completedCourses: user.completedCourses || [],
      currentProgress: user.currentProgress || [],
      createdAt: user.createdAt
    };

    res.json(profileData);
  } catch (error) {
    console.error('Profile fetch error:', error);
    res.status(500).json({ 
      message: 'Error fetching user profile', 
      error: error.message 
    });
  }
});

export default router;