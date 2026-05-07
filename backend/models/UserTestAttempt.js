import mongoose from 'mongoose';

const userTestAttemptSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  testId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Test',
    required: true
  },
  score: {
    type: Number,
    default: 0
  },
  passed: {
    type: Boolean,
    default: false
  },
  answers: [{
    questionId: String,
    answer: mongoose.Schema.Types.Mixed,
    correct: Boolean,
    pointsEarned: Number
  }],
  completedAt: {
    type: Date,
    default: Date.now
  }
});

export default mongoose.model('UserTestAttempt', userTestAttemptSchema);