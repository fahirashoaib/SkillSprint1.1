import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import dotenv from 'dotenv';

import adminRoutes from './routes/admin.js';
import courseRoutes from './routes/courses.js';
import userRoutes from './routes/users.js';
import progressRoutes from './routes/progress.js';
import uploadRoutes from './routes/upload.js';

const app = express();
dotenv.config();

// Middleware
app.use(cors({
  origin: 'http://localhost:3000',
  credentials: true
}));
app.use(express.json());

// Routes
app.use('/api/users', userRoutes);
app.use('/api/courses', courseRoutes);
app.use('/api/progress', progressRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/upload', uploadRoutes);

// Environment Variable Checks
if (!process.env.JWT_SECRET || !process.env.JWT_EXPIRES_IN) {
  console.error('CRITICAL: JWT_SECRET and JWT_EXPIRES_IN must be set!');
  process.exit(1);
}

// MongoDB Connection
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/SkillSprint01')
  .then(() => console.log('Connected to MongoDB'))
  .catch(err => {
    console.error('MongoDB connection error:', err);
    process.exit(1);
  });

const PORT = process.env.PORT;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});

// Add this at the bottom of server.js
process.on('uncaughtException', (err) => {
  console.error('UNCAUGHT EXCEPTION! Shutting down...');
  console.error(err.name, err.message);
  process.exit(1);
});

process.on('unhandledRejection', (err) => {
  console.error('UNHANDLED REJECTION! Shutting down...');
  console.error(err.name, err.message);
  app.close(() => {
    process.exit(1);
  });
});

// # Run this in your terminal to generate a random secret
//node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"

// add rate limitation
// email format validation
// fix weak passwords

/*
Add XP validation in progress.js

Improve password security in User.js

Add input validation for all routes

Implement rate limiting

Add proper error handling for MongoDB operations
*/