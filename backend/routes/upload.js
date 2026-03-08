import express from 'express';
import multer from 'multer'; // For handling file uploads
import { protect, admin } from '../middleware/auth.js';
import DocumentUpload from '../models/DocumentUpload.js';
import { extractText, chunkText } from '../services/documentProcessor.js';
import DocumentChunk from '../models/DocumentChunk.js';


const router = express.Router();

// Configure multer for file upload
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'uploads/');
    },
    filename: (req, file, cb) => {
        cb(null, Date.now() + '-' + file.originalname);
    }
});

const upload = multer({
    storage,
    limits: { fileSize: 10 * 1024 * 1024 } // 10MB limit
});

const getFileType = (mimetype) => {
    const mimeMap = {
        'text/plain': 'txt',
        'application/pdf': 'pdf',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document': 'docx',
        'text/markdown': 'md',
        'application/msword': 'docx',
    };

    return mimeMap[mimetype] || mimetype.split('/')[1];
};

// Upload document
router.post('/document', protect, admin, upload.single('file'), async (req, res) => {
    try {
        const { originalname, filename, size, mimetype } = req.file;

        // Map mime type to your allowed enum values
        const fileType = getFileType(mimetype);
        // Save to database
        const document = new DocumentUpload({
            filename,
            originalName: originalname,
            fileType: fileType,  // Now it will be 'txt' instead of 'plain'
            fileSize: size,
            filePath: req.file.path,
            uploadedBy: req.user._id,
            extractedText: '',
            embeddingStatus: 'pending'
        });

        await document.save();

        res.json({
            message: 'Document uploaded successfully',
            document: {
                id: document._id,
                name: document.originalName,
                status: document.embeddingStatus
            }
        });
    } catch (error) {
        console.error('Upload error:', error);
        res.status(500).json({ message: error.message });
    }
});

// Get all uploaded documents
router.get('/documents', protect, admin, async (req, res) => {
    try {
        console.log('Fetching documents for user:', req.user._id);
        const documents = await DocumentUpload.find()
            .sort({ createdAt: -1 })
            .select('-extractedText');

        console.log('Found documents:', documents.length);
        console.log('Documents data:', documents);

        res.json(documents);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});


// Process document after upload
router.post('/document/:id/process', protect, admin, async (req, res) => {
    try {
        const document = await DocumentUpload.findById(req.params.id);
        if (!document) {
            return res.status(404).json({ message: 'Document not found' });
        }

        // Update status
        document.embeddingStatus = 'processing';
        await document.save();

        // Extract text
        const extractedText = await extractText(document.filePath, document.fileType);
        document.extractedText = extractedText;

        document.embeddingStatus = 'completed';
        await document.save();

        res.json({
            message: 'Document processed successfully',
            chunks: chunks.length
        });
    } catch (error) {
        console.error('Processing error:', error);
        document.embeddingStatus = 'failed';
        await document.save();
        res.status(500).json({ message: error.message });
    }
});

export default router;