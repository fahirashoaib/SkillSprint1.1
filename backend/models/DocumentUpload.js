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
  },
  // Generation tracking fields
  generationStatus: {
    type: String,
    enum: ['not_started', 'overview_generated', 'units_generated', 'unit_content_generating', 'completed', 'failed'],
    default: 'not_started'
  },
  generationSessionId: {
    type: String,
    default: null
  },
  generatedCourseId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Course',
    default: null
  },
  generationProgress: {
    overview: { type: mongoose.Schema.Types.Mixed, default: null },
    units: { type: Array, default: [] },
    unitContents: { type: mongoose.Schema.Types.Mixed, default: {} },
    completedUnits: { type: [Number], default: [] },
    lastUpdated: { type: Date, default: Date.now }
  }
}, {
  timestamps: true
});

// Pre-save middleware to ensure generationProgress exists
documentUploadSchema.pre('save', function(next) {
  if (!this.generationProgress) {
    this.generationProgress = {
      overview: null,
      units: [],
      unitContents: {},
      completedUnits: [],
      lastUpdated: new Date()
    };
  }
  next();
});

export default mongoose.model('DocumentUpload', documentUploadSchema);