// backend/models/UserDocumentView.js
import mongoose from 'mongoose';

const userDocumentViewSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  documentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'DocumentUpload',
    required: true
  },
  viewedAt: {
    type: Date,
    default: Date.now
  },
  completed: {
    type: Boolean,
    default: true
  }
});

export default mongoose.model('UserDocumentView', userDocumentViewSchema);