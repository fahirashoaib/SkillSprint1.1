import express from 'express';
import { protect, admin } from '../middleware/auth.js';
import Course from '../models/Course.js';
import DocumentUpload from '../models/DocumentUpload.js';
import axios from 'axios';
import FormData from 'form-data';
import fs from 'fs';

const router = express.Router();

// Generate course from uploaded document
router.post('/generate/:documentId', protect, admin, async (req, res) => {
  try {
    // 1. Get the document from database
    const document = await DocumentUpload.findById(req.params.documentId);
    if (!document) {
      return res.status(404).json({ message: 'Document not found' });
    }

    // 2. Check if text is extracted
    if (!document.extractedText) {
      return res.status(400).json({ 
        message: 'Please process the document first',
        nextStep: `/api/upload/document/${document._id}/process`
      });
    }

    // 3. Check if file exists
    if (!fs.existsSync(document.filePath)) {
      return res.status(400).json({ message: 'Document file not found on server' });
    }

    // 4. Send to Python service for AI generation
    const formData = new FormData();
    formData.append('file', fs.createReadStream(document.filePath));

    console.log('📤 Sending to Python service...');
    
    const pythonResponse = await axios.post(
      'http://localhost:8000/generate-course',
      formData,
      { 
        headers: formData.getHeaders(),
        timeout: 120000 // 2 minute timeout for AI
      }
    );

    console.log('✅ Received response from Python');

    // Check if Python returned an error
    if (pythonResponse.data.error) {
      return res.status(500).json({ message: pythonResponse.data.error });
    }

    // 5. Save as draft course
    // If Python returns full course, use it; otherwise use mock
    const courseData = pythonResponse.data.course || {
      title: document.originalName.replace(/\.[^/.]+$/, ""),
      overview: "AI-generated course overview",
      units: []
    };

    const draftCourse = new Course({
      title: courseData.title || document.originalName.replace(/\.[^/.]+$/, ""),
      overview: courseData.overview || "Course overview",
      units: courseData.units || [],
      category: req.body.category || "General",
      difficulty: req.body.difficulty || "Beginner",
      totalDuration: courseData.units?.reduce((acc, unit) => acc + (unit.duration || 0), 0) || 0,
      totalXP: courseData.units?.reduce((acc, unit) => acc + (unit.totalXP || 0), 0) || 0,
      learningObjectives: courseData.learningObjectives || [],
      status: 'draft',
      generatedFrom: document._id,
      generatedBy: req.user._id,
      aiGenerated: true
    });

    await draftCourse.save();

    res.json({
      message: 'Course generated successfully',
      courseId: draftCourse._id,
      course: draftCourse
    });

  } catch (error) {
    console.error('❌ Generation error:', error.message);
    
    // Handle specific errors
    if (error.code === 'ECONNREFUSED') {
      return res.status(503).json({ 
        message: 'Python service is not running. Please start it on port 8000.' 
      });
    }
    
    res.status(500).json({ message: error.message });
  }
});

// Get all generated drafts
router.get('/drafts', protect, admin, async (req, res) => {
  try {
    const drafts = await Course.find({ status: 'draft' })
      .populate('generatedFrom', 'originalName')
      .populate('generatedBy', 'username')
      .sort('-createdAt');
    
    res.json(drafts);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get single draft
router.get('/drafts/:courseId', protect, admin, async (req, res) => {
  try {
    const draft = await Course.findOne({ 
      _id: req.params.courseId, 
      status: 'draft' 
    })
    .populate('generatedFrom', 'originalName')
    .populate('generatedBy', 'username');
    
    if (!draft) {
      return res.status(404).json({ message: 'Draft not found' });
    }
    
    res.json(draft);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Update draft
router.put('/drafts/:courseId', protect, admin, async (req, res) => {
  try {
    const draft = await Course.findOneAndUpdate(
      { _id: req.params.courseId, status: 'draft' },
      req.body,
      { new: true }
    );
    
    if (!draft) {
      return res.status(404).json({ message: 'Draft not found' });
    }
    
    res.json(draft);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Publish a draft
router.post('/publish/:courseId', protect, admin, async (req, res) => {
  try {
    const course = await Course.findById(req.params.courseId);
    if (!course) {
      return res.status(404).json({ message: 'Course not found' });
    }
    
    course.status = 'published';
    await course.save();
    
    res.json({ message: 'Course published successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Delete draft
router.delete('/drafts/:courseId', protect, admin, async (req, res) => {
  try {
    await Course.findOneAndDelete({ 
      _id: req.params.courseId, 
      status: 'draft' 
    });
    
    res.json({ message: 'Draft deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

export default router;