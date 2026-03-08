import mongoose from 'mongoose';

const documentUploadSchema = new mongoose.Schema({
  filename: {
    type: String,
    required: true
  },
  originalName: {
    type: String,
    required: true
  },
  fileType: {
    type: String,
    enum: ['pdf', 'docx', 'txt', 'md'],
    required: true
  },
  fileSize: Number,
  filePath: String,
  extractedText: {
    type: String,
    default: ''
  },
  chunkCount: {
    type: Number,
    default: 0
  },
  embeddingStatus: {
    type: String,
    enum: ['pending', 'processing', 'completed', 'failed'],
    default: 'pending'
  },
  uploadedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  metadata: {
    pageCount: Number,
    wordCount: Number,
    language: String
  }
}, {
  timestamps: true
});

export default mongoose.model('DocumentUpload', documentUploadSchema);