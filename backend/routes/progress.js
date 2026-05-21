import express from 'express';
import User from '../models/User.js';
import { updateStreak } from '../utils/streak.js';
import { protect } from '../middleware/auth.js';
const router = express.Router();

// Update user progress
router.post('/:userId', protect, async (req, res) => {
  try {
    if (req.user._id.toString() !== req.params.userId && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Not authorized to update this user' });
    }

    const { courseId, unitId, screenId, completed, xpEarned } = req.body;

    const user = await User.findById(req.params.userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Update user's total XP
    if (xpEarned && xpEarned > 0) {
      user.xp = (user.xp || 0) + xpEarned;
      console.log(`Added ${xpEarned} XP to user. New total: ${user.xp}`);
    }

    // Check if this progress already exists
    const existingProgressIndex = user.currentProgress.findIndex(
      p => p.courseId.toString() === courseId.toString() && p.screenId === screenId
    );

    if (existingProgressIndex !== -1) {
      user.currentProgress[existingProgressIndex].completed = completed || true;
      if (xpEarned > 0) {
        user.currentProgress[existingProgressIndex].xpEarned = xpEarned;
      }
    } else {
      user.currentProgress.push({
        courseId,
        unitId,
        screenId,
        completed: completed || true,
        xpEarned: xpEarned || 0
      });
    }

    // Update streak when screen is completed
    if (completed) {
      updateStreak(user);
    }

    await user.save();

    const updatedUser = await User.findById(req.params.userId)
      .populate('currentProgress.courseId', 'title')
      .select('-password');

    res.json({
      message: 'Progress updated successfully',
      xp: user.xp,
      progress: user.currentProgress,
      user: updatedUser,
      streak: user.streak
    });

  } catch (error) {
    console.error('Progress update error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Mark course as completed
router.post('/:userId/complete-course', protect, async (req, res) => {
  try {
    if (req.user._id.toString() !== req.params.userId && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Not authorized' });
    }

    const { courseId } = req.body;
    const user = await User.findById(req.params.userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const alreadyCompleted = user.completedCourses.find(
      c => c.courseId.toString() === courseId.toString()
    );

    if (!alreadyCompleted) {
      user.completedCourses.push({ courseId, completedAt: new Date() });
      await user.save();
      res.json({ message: 'Course marked as completed', completed: true });
    } else {
      res.json({ message: 'Course was already completed', completed: false });
    }
  } catch (error) {
    console.error('Complete course error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

export default router;