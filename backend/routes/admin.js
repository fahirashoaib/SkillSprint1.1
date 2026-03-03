import express from 'express';
import { protect, admin } from '../middleware/auth.js';
import Course from '../models/Course.js';
import User from '../models/User.js';

const router = express.Router();

// Admin dashboard stats
router.get('/stats', protect, admin, async (req, res) => {
  try {
    const totalUsers = await User.countDocuments();
    const totalLearners = await User.countDocuments({ role: 'learner' });
    const totalAdmins = await User.countDocuments({ role: 'admin' });
    const totalCourses = await Course.countDocuments();
    
    res.json({
      users: {
        total: totalUsers,
        learners: totalLearners,
        admins: totalAdmins
      },
      courses: totalCourses,
      revenue: 0
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get users with pagination
router.get('/users', protect, admin, async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 10;
    const users = await User.find()
      .select('-password')
      .sort({ createdAt: -1 })
      .limit(limit);
    
    res.json(users);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get user details (admin view)
router.get('/users/:id', protect, admin, async (req, res) => {
  try {
    const user = await User.findById(req.params.id)
      .select('-password')
      .populate('completedCourses.courseId')
      .populate('currentProgress.courseId');

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json(user);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Delete user
router.delete('/users/:id', protect, admin, async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    // Prevent admin from deleting themselves
    if (user._id.toString() === req.user._id.toString()) {
      return res.status(400).json({ message: 'Cannot delete your own account' });
    }
    
    await User.findByIdAndDelete(req.params.id);
    res.json({ message: 'User deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get courses with stats
router.get('/courses', protect, admin, async (req, res) => {
  try {
    const courses = await Course.find().sort({ createdAt: -1 });
    
    // Add basic stats to each course
    const coursesWithStats = await Promise.all(
      courses.map(async (course) => {
        const completions = await User.countDocuments({
          'completedCourses.courseId': course._id
        });
        
        const inProgress = await User.countDocuments({
          'currentProgress.courseId': course._id
        });

        return {
          ...course.toObject(),
          completions,
          inProgress
        };
      })
    );

    res.json(coursesWithStats);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

export default router;