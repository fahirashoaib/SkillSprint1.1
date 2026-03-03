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
  units: [unitSchema]
}, {
  timestamps: true
});

export default mongoose.model('Course', courseSchema);