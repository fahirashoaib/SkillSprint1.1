import mongoose from 'mongoose';

const questionSchema = new mongoose.Schema({
  questionId: String,
  question: String,
  type: String, // 'mcq', 'coding', 'text', 'input-text'
  options: [String],
  correctAnswer: mongoose.Schema.Types.Mixed,
  explanation: String,
  xp: Number
});

const screenSchema = new mongoose.Schema({
  screenId: String,
  title: String,
  description: String,
  type: String, // 'content', 'concept-check', 'mcq', 'coding'
  questions: [questionSchema], // For concept-check screens
  codeExample: String,
  // For backward compatibility with single question screens
  question: String,
  options: [String],
  correctAnswer: mongoose.Schema.Types.Mixed,
  explanation: String,
  xp: Number
});

const unitSchema = new mongoose.Schema({
  unitId: String,
  title: String,
  duration: Number,
  totalXP: Number,
  displayMessage: String,
  screens: [screenSchema],
  keyTakeaways: [String]
});

const courseSchema = new mongoose.Schema({
  courseId: String,
  title: String,
  category: String,
  difficulty: String,
  totalDuration: Number,
  totalXP: Number,
  learningObjectives: [String],
  units: [unitSchema],
  prerequisites: {
    enabled: {
      type: Boolean,
      default: false
    },
    linkType: {
      type: String,
      enum: ['soft', 'hard'],
      default: 'soft'
    },
    requirements: [{
      type: {
        type: String,
        enum: ['course', 'unit', 'xp', 'document', 'test'],
        required: true
      },
      courseId: {// For course completion
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Course'
      },
      unitId: String,// For unit completion
      unitTitle: String,
      minXp: Number,// For XP threshold
      documentIds: [{// For document study
        type: mongoose.Schema.Types.ObjectId,
        ref: 'DocumentUpload'
      }],
      testId: {// For placement test
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Test'
      },
      passingScore: {
        type: Number,
        default: 80
      }
    }],
    requirementMode: {
      type: String,
      enum: ['any', 'all'],
      default: 'all'
    },
    allowBypassTest: {
      type: Boolean,
      default: false
    }
  },
  status: {
    type: String,
    enum: ['draft', 'published', 'archived'],
    default: 'draft' // Keep existing courses as published
  },
  generatedFrom: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'DocumentUpload'
  },
  generatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  aiGenerated: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true
});

export default mongoose.model('Course', courseSchema);