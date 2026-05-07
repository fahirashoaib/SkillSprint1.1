import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { documentAPI, aiAPI } from '../../services/api';
import LoadingSpinner from '../LoadingSpinner';
import { FileText, Upload, CheckCircle, Clock, AlertCircle, Play, Zap } from 'lucide-react';
import CourseGenerator from './CourseGenerator';

const DocumentsList = () => {
    const [documents, setDocuments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [processing, setProcessing] = useState({});
    const [showUpload, setShowUpload] = useState(false);
    const [file, setFile] = useState(null);
    const [uploading, setUploading] = useState(false);
    const [showStepGenerator, setShowStepGenerator] = useState(false);
    const [selectedDocument, setSelectedDocument] = useState(null);

    const navigate = useNavigate();

    useEffect(() => {
        loadDocuments();
    }, []);

    const loadDocuments = async () => {
        setLoading(true);
        try {
            const response = await documentAPI.getAll();
            setDocuments(response.data);
        } catch (error) {
            console.error('Failed to load documents:', error);
            alert('Failed to load documents');
        } finally {
            setLoading(false);
        }
    };

    const handleFileChange = (e) => {
        setFile(e.target.files[0]);
    };

    const handleUpload = async () => {
        if (!file) return;

        setUploading(true);
        const formData = new FormData();
        formData.append('file', file);

        try {
            await documentAPI.upload(formData);
            alert('Document uploaded successfully!');
            setFile(null);
            setShowUpload(false);
            loadDocuments();
        } catch (error) {
            console.error('Upload error:', error);
            alert('Upload failed: ' + (error.response?.data?.message || 'Unknown error'));
        } finally {
            setUploading(false);
        }
    };

    const handleProcess = async (docId) => {
        setProcessing(prev => ({ ...prev, [docId]: true }));
        try {
            await documentAPI.process(docId);
            alert('Document processed successfully!');
            loadDocuments();
        } catch (error) {
            console.error('Process error:', error);
            alert('Processing failed: ' + (error.response?.data?.message || error.message));
        } finally {
            setProcessing(prev => ({ ...prev, [docId]: false }));
        }
    };

    const handleStartStepGeneration = (doc) => {
        // Check if course exists and is completed (either draft or published)
        if (doc.generatedCourseId && doc.generationStatus === 'completed') {
            navigate(`/admin/review-course/${doc.generatedCourseId}`);
            return;
        }

        // Check if document is processed
        if (doc.embeddingStatus !== 'completed') {
            alert('Please process the document first before generating a course.');
            return;
        }

        setSelectedDocument(doc);
        setShowStepGenerator(true);
    };

    const getStatusBadge = (doc) => {
        if (doc.embeddingStatus === 'completed') {
            return (
                <span className="inline-flex items-center px-2 py-1 text-xs font-medium text-green-800 bg-green-100 rounded-full">
                    <CheckCircle className="w-3 h-3 mr-1" /> Processed
                </span>
            );
        } else if (doc.embeddingStatus === 'processing') {
            return (
                <span className="inline-flex items-center px-2 py-1 text-xs font-medium text-yellow-800 bg-yellow-100 rounded-full">
                    <Clock className="w-3 h-3 mr-1 animate-spin" /> Processing
                </span>
            );
        } else {
            return (
                <span className="inline-flex items-center px-2 py-1 text-xs font-medium text-gray-800 bg-gray-100 rounded-full">
                    <AlertCircle className="w-3 h-3 mr-1" /> Pending
                </span>
            );
        }
    };

    const getGenerationStatusBadge = (doc) => {
        const statusConfig = {
            'not_started': { text: 'Not Started', color: 'gray' },
            'overview_generated': { text: 'Overview Ready', color: 'blue' },
            'units_generated': { text: 'Units Ready', color: 'yellow' },
            'unit_content_generating': { text: 'In Progress', color: 'orange' },
            'completed': { text: 'Course Generated', color: 'green' },
            'failed': { text: 'Failed', color: 'red' }
        };

        const config = statusConfig[doc.generationStatus] || statusConfig['not_started'];
        const colorMap = {
            gray: 'bg-gray-100 text-gray-800',
            blue: 'bg-blue-100 text-blue-800',
            yellow: 'bg-yellow-100 text-yellow-800',
            orange: 'bg-orange-100 text-orange-800',
            green: 'bg-green-100 text-green-800',
            red: 'bg-red-100 text-red-800'
        };

        return (
            <span className={`inline-flex items-center px-2 py-1 text-xs font-medium rounded-full ${colorMap[config.color]}`}>
                {config.text}
            </span>
        );
    };

    const getButtonText = (doc) => {
        // Only show "View Course" if a course has actually been generated and saved
        if (doc.generatedCourseId && doc.generationStatus === 'completed') {
            return 'View Course';
        }
        // If generation is in progress or partially complete
        if (doc.generationStatus === 'overview_generated' ||
            doc.generationStatus === 'units_generated' ||
            doc.generationStatus === 'unit_content_generating') {
            return 'Resume Generation';
        }
        // If no generation started
        return 'Start Generation';
    };

    return (
        <div className="card">
            <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-bold text-gray-900">Course Source Documents</h3>
                <button
                    onClick={() => setShowUpload(!showUpload)}
                    className="btn-primary flex items-center"
                >
                    <Upload className="w-4 h-4 mr-2" />
                    Upload Document
                </button>
            </div>

            {showUpload && (
                <div className="mb-6 p-4 border-2 border-dashed border-gray-300 rounded-lg bg-gray-50">
                    <input
                        type="file"
                        onChange={handleFileChange}
                        accept=".pdf,.docx,.txt,.md"
                        className="mb-4 w-full"
                    />
                    <div className="flex space-x-3">
                        <button
                            onClick={handleUpload}
                            disabled={!file || uploading}
                            className="btn-primary"
                        >
                            {uploading ? 'Uploading...' : 'Upload'}
                        </button>
                        <button
                            onClick={() => setShowUpload(false)}
                            className="btn-secondary"
                        >
                            Cancel
                        </button>
                    </div>
                </div>
            )}

            {loading ? (
                <div className="flex justify-center py-8">
                    <LoadingSpinner />
                </div>
            ) : documents.length === 0 ? (
                <div className="text-center py-12 bg-gray-50 rounded-lg">
                    <FileText className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-600 mb-2">No documents uploaded yet</p>
                    <p className="text-sm text-gray-500 mb-4">Upload a PDF, DOCX, or TXT file to get started</p>
                    <button
                        onClick={() => setShowUpload(true)}
                        className="btn-primary inline-flex items-center"
                    >
                        <Upload className="w-4 h-4 mr-2" />
                        Upload Your First Document
                    </button>
                </div>
            ) : (
                <div className="space-y-4">
                    {documents.map(doc => (
                        <div key={doc._id} className="border border-gray-200 rounded-lg p-4 hover:border-blue-300 transition-colors">
                            <div className="flex items-start justify-between">
                                <div className="flex items-start space-x-3">
                                    <FileText className="w-5 h-5 text-blue-600 mt-1" />
                                    <div>
                                        <p className="font-medium text-gray-900">{doc.originalName}</p>
                                        <div className="flex items-center space-x-3 mt-1 text-sm text-gray-500">
                                            <span>{(doc.fileSize / 1024).toFixed(1)} KB</span>
                                            <span>•</span>
                                            <span>{doc.fileType.toUpperCase()}</span>
                                            <span>•</span>
                                            <span>{new Date(doc.createdAt).toLocaleDateString()}</span>
                                        </div>
                                        {doc.extractedText && (
                                            <p className="text-xs text-gray-500 mt-1">
                                                {doc.extractedText.length} characters extracted
                                            </p>
                                        )}
                                    </div>
                                </div>
                                <div className="flex items-center space-x-2">
                                    {getStatusBadge(doc)}
                                    {getGenerationStatusBadge(doc)}
                                </div>
                            </div>

                            <div className="flex items-center space-x-3 mt-4 pt-3 border-t border-gray-100">
                                <button
                                    onClick={() => handleProcess(doc._id)}
                                    disabled={processing[doc._id] || doc.embeddingStatus === 'completed' || doc.embeddingStatus === 'processing'}
                                    className={`flex items-center px-3 py-1.5 rounded text-sm font-medium transition-colors ${doc.embeddingStatus === 'completed'
                                            ? 'bg-green-100 text-green-700 cursor-not-allowed'
                                            : doc.embeddingStatus === 'processing'
                                                ? 'bg-yellow-100 text-yellow-700 cursor-not-allowed'
                                                : 'bg-blue-100 text-blue-700 hover:bg-blue-200'
                                        }`}
                                >
                                    {processing[doc._id] ? (
                                        <Clock className="w-4 h-4 mr-1 animate-spin" />
                                    ) : (
                                        <Play className="w-4 h-4 mr-1" />
                                    )}
                                    {processing[doc._id] ? 'Processing...' :
                                        doc.embeddingStatus === 'completed' ? 'Processed' :
                                            doc.embeddingStatus === 'processing' ? 'Processing' : 'Process'}
                                </button>

                                <button
                                    onClick={() => handleStartStepGeneration(doc)}
                                    disabled={doc.embeddingStatus !== 'completed' && doc.generationStatus !== 'completed'}
                                    className={`flex items-center px-3 py-1.5 rounded text-sm font-medium transition-colors ${doc.embeddingStatus !== 'completed' && doc.generationStatus !== 'completed'
                                            ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                                            : 'bg-purple-100 text-purple-700 hover:bg-purple-200'
                                        }`}
                                >
                                    <Zap className="w-4 h-4 mr-1" />
                                    {getButtonText(doc)}
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {showStepGenerator && selectedDocument && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
                    <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
                        <div className="p-6">
                            <div className="flex justify-between items-center mb-4">
                                <h2 className="text-2xl font-bold text-gray-900">
                                    {selectedDocument.generationStatus === 'completed' ? 'View Course' :
                                        selectedDocument.generationStatus === 'not_started' ? 'Generate Course' :
                                            'Resume Course Generation'}: {selectedDocument.originalName}
                                </h2>
                                <button
                                    onClick={() => {
                                        setShowStepGenerator(false);
                                        setSelectedDocument(null);
                                    }}
                                    className="text-gray-400 hover:text-gray-600"
                                >
                                    ✕
                                </button>
                            </div>
                            <CourseGenerator
                                documentId={selectedDocument._id}
                                documentName={selectedDocument.originalName}
                                onClose={() => {
                                    setShowStepGenerator(false);
                                    setSelectedDocument(null);
                                    loadDocuments();
                                }}
                            />
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default DocumentsList;