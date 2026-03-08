import express from 'express';
import User from '../models/User.js';
import Course from '../models/Course.js';
import { protect } from '../middleware/auth.js';
const router = express.Router();

// Update user progress
router.post('/:userId', protect, async (req, res) => {
  try {
    // add authorization check
    if (req.user._id.toString() !== req.params.userId && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Not authorized to update this user' });
    }
    const { courseId, unitId, screenId, completed, xpEarned } = req.body;

    if (xpEarned && (xpEarned < 0 || xpEarned > 100)) {
      return res.status(400).json({ 
        message: 'XP must be between 0 and 100' 
      });
    }

    const user = await User.findById(req.params.userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Update XP
    if (xpEarned && xpEarned > 0) {
      // Validate XP is reasonable (prevent cheating)
      if (xpEarned <= 100) { // Set reasonable max per update
        user.xp += xpEarned; // update XP
      }
    }

    // Update progress
    const progressIndex = user.currentProgress.findIndex(
      p => p.courseId.toString() === courseId.toString() && p.unitId === unitId && p.screenId === screenId
    );

    if (progressIndex === -1) {
      user.currentProgress.push({
        courseId,
        unitId,
        screenId,
        completed: completed || true
      });
    } else {
      user.currentProgress[progressIndex].completed = completed || true;
    }

    await user.save();

    res.json({
      message: 'Progress updated successfully',
      xp: user.xp,
      progress: user.currentProgress
    });
  } catch (error) {
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
    if (!courseId) {
      return res.status(400).json({ message: 'Course ID is required' });
    }
    const user = await User.findById(req.params.userId);

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Check if course already completed
    const alreadyCompleted = user.completedCourses.find(
      c => c.courseId.toString() === courseId.toString()
    );

    if (!alreadyCompleted) {
      user.completedCourses.push({ courseId: courseId, completedAt: new Date() });
      await user.save();
      res.json({
        message: 'Course marked as completed',
        completed: true
      });
    }
    else {
      res.json({
        message: 'Course was already completed',
        completed: false
      });
    }
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

export default router;