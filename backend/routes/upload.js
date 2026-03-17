import express from 'express';
import multer from 'multer';
import { protect, admin } from '../middleware/auth.js';
import DocumentUpload from '../models/DocumentUpload.js';
import { extractText} from '../services/documentProcessor.js';
import fs from 'fs';

const router = express.Router();

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
    limits: { fileSize: 10 * 1024 * 1024 }
});

const getFileType = (mimetype) => {
    const mimeMap = {
        'text/plain': 'txt',
        'application/pdf': 'pdf',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document': 'docx',
        'text/markdown': 'md',
    };
    return mimeMap[mimetype] || mimetype.split('/')[1];
};

// Upload document
router.post('/document', protect, admin, upload.single('file'), async (req, res) => {
    try {
        const { originalname, filename, size, mimetype } = req.file;
        const fileType = getFileType(mimetype);
        
        const document = new DocumentUpload({
            filename,
            originalName: originalname,
            fileType,
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

// Get all documents
router.get('/documents', protect, admin, async (req, res) => {
    try {
        const documents = await DocumentUpload.find()
            .sort({ createdAt: -1 })
            .select('-extractedText');
        res.json(documents);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Process document
router.post('/document/:id/process', protect, admin, async (req, res) => {
    let document;
    try {
        document = await DocumentUpload.findById(req.params.id);
        if (!document) {
            return res.status(404).json({ message: 'Document not found' });
        }

        if (!fs.existsSync(document.filePath)) {
            return res.status(404).json({ message: 'File not found on server' });
        }

        document.embeddingStatus = 'processing';
        await document.save();

        const extractedText = await extractText(document.filePath, document.fileType);
        
        document.extractedText = extractedText;
        document.embeddingStatus = 'completed';
        await document.save();

        res.json({
            message: 'Document processed successfully',
            textLength: extractedText.length
        });
    } catch (error) {
        console.error('Processing error:', error);
        if (document) {
            document.embeddingStatus = 'failed';
            await document.save();
        }
        res.status(500).json({ message: error.message });
    }
});

export default router;