import express from 'express';
import User from '../models/User.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

// Get leaderboard (top 20 by XP)
router.get('/', protect, async (req, res) => {
  try {
    // Get top 20 users sorted by XP descending
    const topUsers = await User.find({ role: 'learner' })
      .select('username xp completedCourses')
      .sort({ xp: -1 })
      .limit(20);

    // Calculate additional stats
    const leaderboard = topUsers.map((user, index) => ({
      rank: index + 1,
      username: user.username,
      xp: user.xp,
      completedCourses: user.completedCourses?.length || 0,
      // Simple level based on XP
      level: user.xp < 500 ? 'Novice' : user.xp < 1500 ? 'Explorer' : 'Master',
      nextLevelXp: user.xp < 500 ? 500 : user.xp < 1500 ? 1500 : null,
    }));

    // Find current user's rank (if logged in)
    let userRank = null;
    if (req.user) {
      const allUsers = await User.find({ role: 'learner' }).sort({ xp: -1 }).select('_id');
      const userIndex = allUsers.findIndex(u => u._id.toString() === req.user._id.toString());
      userRank = userIndex !== -1 ? userIndex + 1 : null;
    }

    res.json({ leaderboard, userRank });
  } catch (error) {
    console.error('Leaderboard error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

export default router;