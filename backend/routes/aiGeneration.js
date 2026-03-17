import express from 'express';
import { protect, admin } from '../middleware/auth.js';
import Course from '../models/Course.js';
import DocumentUpload from '../models/DocumentUpload.js';
import axios from 'axios';
import FormData from 'form-data';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const router = express.Router();

// Store generation progress in memory
const generationSessions = {};

// Helper function to normalize file path
const normalizeFilePath = (filePath) => {
  return filePath.replace(/\\/g, '/');
};

// Helper function to check if Python service is running
const checkPythonService = async () => {
  try {
    await axios.get('http://localhost:8000/health', { timeout: 2000 });
    return true;
  } catch (error) {
    console.error('Python service check failed:', error.message);
    return false;
  }
};

// Step 1: Generate Overview
router.post('/step/overview/:documentId', protect, admin, async (req, res) => {
  let document;
  try {
    const isPythonRunning = await checkPythonService();
    if (!isPythonRunning) {
      return res.status(503).json({
        message: 'AI service is not running. Please start the Python server on port 8000.'
      });
    }

    document = await DocumentUpload.findById(req.params.documentId);
    if (!document) {
      return res.status(404).json({ message: 'Document not found' });
    }

    let filePath = document.filePath;
    if (!fs.existsSync(filePath)) {
      const absolutePath = path.join(process.cwd(), filePath);
      if (!fs.existsSync(absolutePath)) {
        return res.status(404).json({ message: 'File not found on server' });
      }
      filePath = absolutePath;
    }

    filePath = normalizeFilePath(filePath);
    console.log('Sending to Python service:', filePath);

    const sessionId = Date.now().toString();
    generationSessions[sessionId] = {
      documentId: document._id,
      documentPath: filePath,
      documentName: document.originalName,
      step: 'overview',
      data: {
        overview: null,
        units: [],
        unitContents: []
      },
      createdAt: new Date()
    };

    const formData = new FormData();
    formData.append('file', fs.createReadStream(filePath));
    formData.append('step', 'overview');

    const pythonResponse = await axios.post(
      'http://localhost:8000/generate-step',
      formData,
      {
        headers: {
          ...formData.getHeaders(),
          'Accept': 'application/json'
        },
        timeout: 60000,
        maxContentLength: Infinity,
        maxBodyLength: Infinity
      }
    );

    if (pythonResponse.data.error) {
      return res.status(500).json({ message: pythonResponse.data.error });
    }

    if (!pythonResponse.data.overview) {
      return res.status(500).json({ message: 'Invalid response from AI service' });
    }

    generationSessions[sessionId].data.overview = pythonResponse.data.overview;

    res.json({
      sessionId,
      overview: pythonResponse.data.overview,
      message: 'Overview generated successfully'
    });

  } catch (error) {
    console.error('Overview generation error:', {
      message: error.message,
      code: error.code,
      response: error.response?.data,
      status: error.response?.status
    });

    if (error.code === 'ECONNREFUSED') {
      return res.status(503).json({
        message: 'AI service not running. Please start the Python server on port 8000.'
      });
    }
    if (error.code === 'ECONNABORTED') {
      return res.status(504).json({
        message: 'AI service timeout. Please try again.'
      });
    }
    res.status(500).json({ message: error.message });
  }
});

// Step 2: Generate Units - FIXED VERSION
router.post('/step/units/:sessionId', protect, admin, async (req, res) => {
  try {
    const { sessionId } = req.params;
    const { overview } = req.body;

    const session = generationSessions[sessionId];
    if (!session) {
      return res.status(404).json({ message: 'Session not found or expired' });
    }

    // Store the overview in session
    session.data.overview = overview;
    session.step = 'units';

    const document = await DocumentUpload.findById(session.documentId);
    if (!document) {
      return res.status(404).json({ message: 'Document not found' });
    }

    let filePath = session.documentPath;
    if (!fs.existsSync(filePath)) {
      const absolutePath = path.join(process.cwd(), filePath);
      if (!fs.existsSync(absolutePath)) {
        return res.status(404).json({ message: 'File not found on server' });
      }
      filePath = absolutePath;
    }

    const formData = new FormData();
    formData.append('file', fs.createReadStream(filePath));
    formData.append('step', 'units');
    
    // CRITICAL: Send overview as JSON string if it's an array
    const overviewValue = Array.isArray(overview) ? JSON.stringify(overview) : overview;
    formData.append('overview', overviewValue);

    console.log('Sending units request with overview:', overviewValue.substring(0, 100));

    const pythonResponse = await axios.post(
      'http://localhost:8000/generate-step',
      formData,
      {
        headers: formData.getHeaders(),
        timeout: 60000
      }
    );

    if (pythonResponse.data.error) {
      return res.status(500).json({ message: pythonResponse.data.error });
    }

    // Store units in session
    session.data.units = pythonResponse.data.units;
    
    // Initialize unitContents array with correct length
    session.data.unitContents = new Array(pythonResponse.data.units.length).fill(null);

    console.log(`Generated ${pythonResponse.data.units.length} units`);

    res.json({
      sessionId,
      units: pythonResponse.data.units,
      message: 'Units generated successfully'
    });

  } catch (error) {
    console.error('Units generation error:', error.message);
    res.status(500).json({ message: error.message });
  }
});

// Step 3: Generate Unit Content - FIXED VERSION
router.post('/step/unit-content/:sessionId/:unitIndex', protect, admin, async (req, res) => {
  try {
    const { sessionId, unitIndex } = req.params;
    const { unitTitle, unitDescription } = req.body;

    const session = generationSessions[sessionId];
    if (!session) {
      return res.status(404).json({ message: 'Session not found or expired' });
    }

    // Check if units exist
    if (!session.data.units || session.data.units.length === 0) {
      return res.status(400).json({ message: 'No units found. Please generate units first.' });
    }

    const index = parseInt(unitIndex);
    if (isNaN(index) || index >= session.data.units.length) {
      return res.status(400).json({ message: 'Invalid unit index' });
    }

    const document = await DocumentUpload.findById(session.documentId);
    if (!document) {
      return res.status(404).json({ message: 'Document not found' });
    }

    let filePath = session.documentPath;
    if (!fs.existsSync(filePath)) {
      const absolutePath = path.join(process.cwd(), filePath);
      if (!fs.existsSync(absolutePath)) {
        return res.status(404).json({ message: 'File not found on server' });
      }
      filePath = absolutePath;
    }

    const formData = new FormData();
    formData.append('file', fs.createReadStream(filePath));
    formData.append('step', 'unit-content');
    formData.append('unitIndex', unitIndex);
    formData.append('unitTitle', unitTitle);
    formData.append('unitDescription', unitDescription || '');
    
    // CRITICAL: Send overview as JSON string if it's an array
    const overviewValue = Array.isArray(session.data.overview) 
      ? JSON.stringify(session.data.overview) 
      : session.data.overview;
    formData.append('overview', overviewValue);

    console.log(`Generating content for unit ${parseInt(unitIndex) + 1}: ${unitTitle}`);

    const pythonResponse = await axios.post(
      'http://localhost:8000/generate-step',
      formData,
      {
        headers: formData.getHeaders(),
        timeout: 90000
      }
    );

    if (pythonResponse.data.error) {
      return res.status(500).json({ message: pythonResponse.data.error });
    }

    // Store unit content
    if (!session.data.unitContents) {
      session.data.unitContents = [];
    }
    session.data.unitContents[index] = pythonResponse.data.unit;

    console.log(`Unit content generated successfully for unit ${index + 1}`);

    res.json({
      sessionId,
      unit: pythonResponse.data.unit,
      meta: pythonResponse.data.meta || null,
      message: `Unit ${index + 1} content generated`
    });

  } catch (error) {
    console.error('Unit content generation error:', error.message);
    res.status(500).json({ message: error.message });
  }
});

// Rest of your helper functions and routes remain the same...
const calculateTotalDuration = (unitContents) => {
  if (!unitContents || !Array.isArray(unitContents)) return 0;
  return unitContents.reduce((total, unit) => {
    return total + calculateUnitDuration(unit);
  }, 0);
};

const calculateTotalXP = (unitContents) => {
  if (!unitContents || !Array.isArray(unitContents)) return 0;
  return unitContents.reduce((total, unit) => {
    return total + calculateUnitXP(unit);
  }, 0);
};

const calculateUnitDuration = (unitContent) => {
  if (!unitContent || !unitContent.screens) return 30;
  return unitContent.screens.length * 2;
};

const calculateUnitXP = (unitContent) => {
  if (!unitContent || !unitContent.screens) return 25;

  let totalXP = 0;
  unitContent.screens.forEach(screen => {
    if (screen.type === 'concept-check' && screen.questions) {
      screen.questions.forEach(q => {
        totalXP += q.xp || 5;
      });
    } else if (screen.type === 'coding') {
      totalXP += screen.xp || 10;
    }
  });
  return totalXP || 25;
};

const extractKeyTakeaways = (unitContent) => {
  if (!unitContent || !unitContent.screens) {
    return [`Master ${unitContent?.title || 'this unit'}`];
  }

  const takeawaysScreen = unitContent.screens.find(
    screen => screen.title?.toLowerCase().includes('takeaway')
  );

  if (takeawaysScreen?.description) {
    const lines = takeawaysScreen.description.split('\n');
    const takeaways = lines
      .filter(line => line.trim().startsWith('•') || line.trim().startsWith('-') || line.trim().match(/^\d+\./))
      .map(line => line.replace(/^[•\- \d\.]+/, '').trim())
      .filter(t => t.length > 0);

    if (takeaways.length > 0) return takeaways;
  }

  return [
    `Understand core concepts of ${unitContent?.title || 'this unit'}`,
    'Apply the knowledge in practical scenarios',
    'Complete the exercises to reinforce learning'
  ];
};

// Step 4: Save Course
router.post('/step/save/:sessionId', protect, admin, async (req, res) => {
  try {
    const { sessionId } = req.params;
    const { title, category, difficulty } = req.body;

    const session = generationSessions[sessionId];
    if (!session) {
      return res.status(404).json({ message: 'Session not found or expired' });
    }

    // Validate session data
    if (!session.data.overview) {
      return res.status(400).json({ message: 'Missing course overview' });
    }
    if (!session.data.units || !Array.isArray(session.data.units)) {
      return res.status(400).json({ message: 'Missing course units' });
    }

    const courseData = {
      title: title || session.documentName.replace(/\.[^/.]+$/, ""),
      category: category || 'General',
      difficulty: difficulty || 'Beginner',
      totalDuration: calculateTotalDuration(session.data.unitContents),
      totalXP: calculateTotalXP(session.data.unitContents),
      learningObjectives: Array.isArray(session.data.overview) ? session.data.overview : [session.data.overview],
      units: session.data.units?.map((unit, uIdx) => {
        const unitContent = session.data.unitContents?.[uIdx];
        return {
          unitId: `unit-${uIdx + 1}`,
          title: unit.title,
          duration: calculateUnitDuration(unitContent),
          totalXP: calculateUnitXP(unitContent),
          displayMessage: unit.description || `Ready to master ${unit.title}? Start now!`,
          screens: unitContent?.screens?.map((screen, lIdx) => {
            const screenObj = {
              screenId: `screen-${uIdx + 1}-${lIdx + 1}`,
              title: screen.title,
              description: screen.description || screen.content || '',
              type: screen.type || 'content',
              xp: screen.xp || 0
            };

            if (screen.type === 'concept-check' && screen.questions) {
              screenObj.questions = screen.questions.map((q, qIdx) => ({
                questionId: `q-${uIdx + 1}-${lIdx + 1}-${qIdx + 1}`,
                type: q.type || 'mcq',
                question: q.question,
                options: q.options || [],
                correctAnswer: q.correctAnswer,
                explanation: q.explanation || '',
                xp: q.xp || 5
              }));
            } else if (screen.type === 'coding') {
              screenObj.codeExample = screen.codeExample || '';
              screenObj.question = screen.question || '';
              screenObj.correctAnswer = screen.correctAnswer || '';
              screenObj.explanation = screen.explanation || '';
            }

            return screenObj;
          }) || [],
          keyTakeaways: extractKeyTakeaways(unitContent)
        };
      }) || [],
      status: 'draft',
      generatedFrom: session.documentId,
      generatedBy: req.user._id,
      aiGenerated: true
    };

    let course;
    if (session.draftCourseId) {
      course = await Course.findByIdAndUpdate(session.draftCourseId, courseData, {
        new: true,
        runValidators: true
      });
    } else {
      course = new Course(courseData);
      await course.save();
    }

    // Final save ends the generation session
    delete generationSessions[sessionId];

    res.json({
      message: 'Course saved successfully',
      courseId: course._id
    });

  } catch (error) {
    console.error('Save course error:', error.message);
    res.status(500).json({ message: error.message });
  }
});

// Step 4a: Save progress (auto-save) WITHOUT ending the session
router.post('/step/save-progress/:sessionId', protect, admin, async (req, res) => {
  try {
    const { sessionId } = req.params;
    const { title, category, difficulty } = req.body;

    const session = generationSessions[sessionId];
    if (!session) {
      return res.status(404).json({ message: 'Session not found or expired' });
    }

    const courseData = {
      title: title || session.documentName.replace(/\.[^/.]+$/, ""),
      category: category || 'General',
      difficulty: difficulty || 'Beginner',
      totalDuration: calculateTotalDuration(session.data.unitContents),
      totalXP: calculateTotalXP(session.data.unitContents),
      learningObjectives: session.data.overview
        ? (Array.isArray(session.data.overview) ? session.data.overview : [session.data.overview])
        : [],
      units: session.data.units?.map((unit, uIdx) => {
        const unitContent = session.data.unitContents?.[uIdx];
        return {
          unitId: `unit-${uIdx + 1}`,
          title: unit.title,
          duration: calculateUnitDuration(unitContent),
          totalXP: calculateUnitXP(unitContent),
          displayMessage: unit.description || `Ready to master ${unit.title}? Start now!`,
          screens: unitContent?.screens?.map((screen, lIdx) => {
            const screenObj = {
              screenId: `screen-${uIdx + 1}-${lIdx + 1}`,
              title: screen.title,
              description: screen.description || screen.content || '',
              type: screen.type || 'content',
              xp: screen.xp || 0
            };

            if (screen.type === 'concept-check' && screen.questions) {
              screenObj.questions = screen.questions.map((q, qIdx) => ({
                questionId: `q-${uIdx + 1}-${lIdx + 1}-${qIdx + 1}`,
                type: q.type || 'mcq',
                question: q.question,
                options: q.options || [],
                correctAnswer: q.correctAnswer,
                explanation: q.explanation || '',
                xp: q.xp || 5
              }));
            } else if (screen.type === 'coding') {
              screenObj.codeExample = screen.codeExample || '';
              screenObj.question = screen.question || '';
              screenObj.correctAnswer = screen.correctAnswer || '';
              screenObj.explanation = screen.explanation || '';
            }

            return screenObj;
          }) || [],
          keyTakeaways: extractKeyTakeaways(unitContent)
        };
      }) || [],
      status: 'draft',
      generatedFrom: session.documentId,
      generatedBy: req.user._id,
      aiGenerated: true
    };

    let draft;
    if (session.draftCourseId) {
      draft = await Course.findByIdAndUpdate(session.draftCourseId, courseData, {
        new: true,
        runValidators: true
      });
    } else {
      draft = new Course(courseData);
      await draft.save();
      session.draftCourseId = draft._id;
    }

    res.json({
      message: 'Progress saved',
      courseId: draft._id
    });
  } catch (error) {
    console.error('Save progress error:', error.message);
    res.status(500).json({ message: error.message });
  }
});

// Get all drafts
router.get('/drafts', protect, admin, async (req, res) => {
  try {
    const drafts = await Course.find({ status: 'draft' })
      .populate('generatedFrom', 'originalName')
      .populate('generatedBy', 'username')
      .sort('-createdAt');
    res.json(drafts);
  } catch (error) {
    console.error('Get drafts error:', error.message);
    res.status(500).json({ message: error.message });
  }
});

// Get single draft
router.get('/drafts/:courseId', protect, admin, async (req, res) => {
  try {
    const draft = await Course.findOne({ _id: req.params.courseId, status: 'draft' })
      .populate('generatedFrom', 'originalName')
      .populate('generatedBy', 'username');
    if (!draft) {
      return res.status(404).json({ message: 'Draft not found' });
    }
    res.json(draft);
  } catch (error) {
    console.error('Get draft error:', error.message);
    res.status(500).json({ message: error.message });
  }
});

// Update draft
router.put('/drafts/:courseId', protect, admin, async (req, res) => {
  try {
    const draft = await Course.findOneAndUpdate(
      { _id: req.params.courseId, status: 'draft' },
      req.body,
      { new: true, runValidators: true }
    );
    if (!draft) {
      return res.status(404).json({ message: 'Draft not found' });
    }
    res.json(draft);
  } catch (error) {
    console.error('Update draft error:', error.message);
    res.status(500).json({ message: error.message });
  }
});

// Publish draft
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
    console.error('Publish error:', error.message);
    res.status(500).json({ message: error.message });
  }
});

// Delete draft
router.delete('/drafts/:courseId', protect, admin, async (req, res) => {
  try {
    const result = await Course.findOneAndDelete({ _id: req.params.courseId, status: 'draft' });
    if (!result) {
      return res.status(404).json({ message: 'Draft not found' });
    }
    res.json({ message: 'Draft deleted successfully' });
  } catch (error) {
    console.error('Delete draft error:', error.message);
    res.status(500).json({ message: error.message });
  }
});

// Clean up old sessions
setInterval(() => {
  const oneHourAgo = Date.now() - 60 * 60 * 1000;
  Object.keys(generationSessions).forEach(sessionId => {
    if (generationSessions[sessionId].createdAt < oneHourAgo) {
      delete generationSessions[sessionId];
      console.log(`Cleaned up expired session: ${sessionId}`);
    }
  });
}, 30 * 60 * 1000);

export default router;