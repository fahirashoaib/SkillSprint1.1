// backend/routes/prerequisites.js
import express from 'express';
import Course from '../models/Course.js';
import User from '../models/User.js';
import UserTestAttempt from '../models/UserTestAttempt.js';
import UserDocumentView from '../models/UserDocumentView.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

// Check if user meets prerequisites for a course
router.get('/check/:courseId', protect, async (req, res) => {
  try {
    const course = await Course.findById(req.params.courseId);
    if (!course) {
      return res.status(404).json({ message: 'Course not found' });
    }

    // If prerequisites not enabled, always allowed
    if (!course.prerequisites?.enabled) {
      return res.json({ 
        allowed: true, 
        hasPrerequisites: false,
        message: 'No prerequisites required'
      });
    }

    const user = await User.findById(req.user._id);
    const requirementsStatus = [];

    // Check each requirement
    for (const req of course.prerequisites.requirements) {
      let met = false;
      let details = {};

      switch (req.type) {
        case 'course':
          // Check if user completed the required course
          const courseCompleted = user.completedCourses.some(
            c => c.courseId.toString() === req.courseId.toString()
          );
          const requiredCourse = await Course.findById(req.courseId);
          met = courseCompleted;
          details = {
            courseTitle: requiredCourse?.title || 'Unknown Course',
            completed: met
          };
          break;

        case 'unit':
          // Check if user completed specific unit
          const unitCompleted = user.currentProgress.some(
            p => p.courseId.toString() === req.courseId?.toString() && 
                 p.unitId === req.unitId && 
                 p.completed === true
          );
          met = unitCompleted;
          details = {
            unitTitle: req.unitTitle,
            completed: met
          };
          break;

        case 'xp':
          // Check if user has enough total XP
          met = (user.xp || 0) >= req.minXp;
          details = {
            requiredXp: req.minXp,
            currentXp: user.xp || 0,
            completed: met
          };
          break;

        case 'document':
          // Check if user viewed all required documents
          const viewedDocs = await UserDocumentView.find({
            userId: user._id,
            documentId: { $in: req.documentIds },
            completed: true
          });
          met = viewedDocs.length === req.documentIds.length;
          details = {
            documentsViewed: viewedDocs.length,
            documentsRequired: req.documentIds.length,
            completed: met
          };
          break;

        case 'test':
          // Check if user passed the placement test
          const testAttempt = await UserTestAttempt.findOne({
            userId: user._id,
            testId: req.testId,
            passed: true
          }).sort({ completedAt: -1 });
          met = !!testAttempt;
          details = {
            passed: met,
            passingScore: req.passingScore
          };
          break;
      }

      requirementsStatus.push({
        type: req.type,
        met: met,
        details: details
      });
    }

    // Determine if all requirements are met
    const requirementMode = course.prerequisites.requirementMode || 'all';
    let allMet = false;
    
    if (requirementMode === 'all') {
      allMet = requirementsStatus.every(r => r.met === true);
    } else {
      allMet = requirementsStatus.some(r => r.met === true);
    }

    // Check if bypass test is available and user passed it
    let bypassAvailable = false;
    let bypassPassed = false;
    
    if (course.prerequisites.allowBypassTest && course.prerequisites.bypassTestId) {
      bypassAvailable = true;
      const bypassAttempt = await UserTestAttempt.findOne({
        userId: user._id,
        testId: course.prerequisites.bypassTestId,
        passed: true
      });
      bypassPassed = !!bypassAttempt;
    }

    res.json({
      allowed: allMet || bypassPassed,
      hasPrerequisites: true,
      linkType: course.prerequisites.linkType,
      requirementMode: course.prerequisites.requirementMode,
      requirements: requirementsStatus,
      bypassAvailable,
      bypassPassed,
      message: allMet || bypassPassed ? 'Prerequisites met' : 'Prerequisites not met'
    });

  } catch (error) {
    console.error('Prerequisite check error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get prerequisites details for a course (for displaying lock screen)
router.get('/details/:courseId', protect, async (req, res) => {
  try {
    const course = await Course.findById(req.params.courseId)
      .populate('prerequisites.requirements.courseId', 'title totalXP')
      .populate('prerequisites.requirements.documentIds', 'originalName fileType');
    
    if (!course) {
      return res.status(404).json({ message: 'Course not found' });
    }

    res.json({
      enabled: course.prerequisites?.enabled || false,
      linkType: course.prerequisites?.linkType || 'soft',
      requirements: course.prerequisites?.requirements || [],
      requirementMode: course.prerequisites?.requirementMode || 'all',
      allowBypassTest: course.prerequisites?.allowBypassTest || false,
      bypassTestId: course.prerequisites?.bypassTestId || null
    });
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

export default router;