import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const userSchema = new mongoose.Schema({
  username: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    minlength: 3,
    maxlength: 30
  },
  email: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    lowercase: true
  },
  password: {
    type: String,
    required: true,
    minlength: 8
  },
  role: {
    type: String,
    enum: ['learner', 'admin'],
    default: 'learner'
  },
  xp: {
    type: Number,
    default: 0
  },
  streak: {
    type: Number,
    default: 0
  },
  lastActive: {
    type: Date,
    default: null
  },
  completedCourses: [{
    courseId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Course'
    },
    completedAt: {
      type: Date,
      default: Date.now
    }
  }],
  currentProgress: [{
    courseId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Course'
    },
    unitId: String,
    screenId: String,
    completed: {
      type: Boolean,
      default: false
    },
    xpEarned: {
      type: Number,
      default: 0
    }
  }]
}, {
  timestamps: true
});

// Add password hashing middleware
userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 12);
  next();
});

userSchema.methods.correctPassword = async function (candidatePassword, userPassword) {
  return await bcrypt.compare(candidatePassword, userPassword);
};

// Add this to distinguish admin from learners
userSchema.virtual('isLearner').get(function () {
  return this.role === 'learner';
});

userSchema.virtual('isAdmin').get(function () {
  return this.role === 'admin';
});

export default mongoose.model('User', userSchema);