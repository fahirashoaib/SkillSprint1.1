import express from 'express';
import Course from '../models/Course.js';
import { protect, admin } from '../middleware/auth.js';
const router = express.Router();

// Get all courses
router.get('/', async (req, res) => {
  try {
    const courses = await Course.find();
    res.json(courses);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get single course
router.get('/:id', async (req, res) => {
  try {
    const course = await Course.findById(req.params.id);
    if (!course) {
      return res.status(404).json({ message: 'Course not found' });
    }
    res.json(course);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Create course (admin only)
router.post('/',protect, admin, async (req, res) => {
  try {
    if (!req.body.courseId || !req.body.title) {
      return res.status(400).json({ message: 'Missing required fields' });
    }
    const course = new Course(req.body);
    await course.save();
    res.status(201).json(course);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Update course prerequisites (admin only)
router.put('/:courseId/prerequisites', protect, admin, async (req, res) => {
  try {
    const course = await Course.findById(req.params.courseId);
    if (!course) {
      return res.status(404).json({ message: 'Course not found' });
    }

    course.prerequisites = req.body;
    await course.save();

    res.json({ message: 'Prerequisites updated successfully', prerequisites: course.prerequisites });
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

export default router;