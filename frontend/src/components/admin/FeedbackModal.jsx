import React, { useState } from 'react';
import { Send, X, Loader, Sparkles, AlertCircle, CheckCircle } from 'lucide-react';
import axios from 'axios';

const FeedbackModal = ({ isOpen, onClose, screen, unitIndex, screenIndex, courseId, onFeedbackApplied }) => {
  const [feedback, setFeedback] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!feedback.trim()) {
      setError('Please enter your feedback');
      return;
    }
    
    setLoading(true);
    setError('');
    
    try {
      const token = localStorage.getItem('token');
      const response = await axios.post(
        `http://localhost:5000/api/ai/apply-feedback/${courseId}`,
        {
          unitIndex: unitIndex,
          screenIndex: screenIndex,
          feedback: feedback,
          screenContent: screen,
          unitTitle: screen?.unitTitle || 'Unit',
          screenTitle: screen?.title || 'Screen',
          screenType: screen?.type || 'content'
        },
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          timeout: 60000
        }
      );
      
      setSuccess(true);
      setTimeout(() => {
        if (onFeedbackApplied) {
          onFeedbackApplied(response.data.modifiedScreen, unitIndex, screenIndex);
        }
        onClose();
        setFeedback('');
        setSuccess(false);
      }, 1500);
      
    } catch (err) {
      console.error('Feedback error:', err);
      setError(err.response?.data?.message || 'Failed to apply feedback. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Pre-written feedback templates
  const feedbackTemplates = [
    { text: "Make the explanation simpler and more beginner-friendly", icon: "📖", description: "Simplify complex concepts" },
    { text: "Add more real-world examples to illustrate the concept", icon: "🌍", description: "Add practical examples" },
    { text: "Include a step-by-step breakdown of the process", icon: "📝", description: "Step-by-step guide" },
    { text: "Fix grammatical errors and improve clarity", icon: "✏️", description: "Improve grammar and clarity" },
    { text: "Add a comparison table to differentiate key concepts", icon: "📊", description: "Comparison table" },
    { text: "Make the questions more challenging and thought-provoking", icon: "🎯", description: "Better questions" },
    { text: "Add hints or tips to help learners understand better", icon: "💡", description: "Add helpful tips" },
    { text: "Break down long paragraphs into bullet points", icon: "•", description: "Use bullet points" },
    { text: "Add a summary at the end of the screen", icon: "📌", description: "Add summary" },
    { text: "Include a common misconception and explain why it's wrong", icon: "⚠️", description: "Address misconceptions" },
    { text: "Make the tone more engaging and conversational", icon: "💬", description: "Engaging tone" },
    { text: "Add visual descriptions or diagrams explanation", icon: "🎨", description: "Visual explanations" }
  ];

  const applyTemplate = (templateText) => {
    setFeedback(templateText);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex justify-between items-center mb-4">
            <div className="flex items-center">
              <Sparkles className="w-6 h-6 text-purple-600 mr-2" />
              <h2 className="text-2xl font-bold text-gray-900">AI Feedback Assistant</h2>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600"
              disabled={loading}
            >
              <X className="w-6 h-6" />
            </button>
          </div>
          
          <div className="mb-4">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-4">
              <h3 className="font-semibold text-blue-900 mb-1">Current Screen</h3>
              <p className="text-sm text-blue-800">
                <span className="font-medium">Unit:</span> {screen?.unitTitle || 'Unit ' + (unitIndex + 1)}
              </p>
              <p className="text-sm text-blue-800">
                <span className="font-medium">Screen:</span> {screen?.title || 'Untitled'}
              </p>
              <p className="text-sm text-blue-800">
                <span className="font-medium">Type:</span> {screen?.type || 'content'}
              </p>
              {screen?.description && (
                <div className="mt-2 p-2 bg-white rounded border border-blue-200">
                  <p className="text-xs text-gray-600 font-medium mb-1">Current Content Preview:</p>
                  <p className="text-xs text-gray-700 line-clamp-3">{screen.description.substring(0, 150)}...</p>
                </div>
              )}
            </div>
            
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Your Feedback / Instructions
            </label>
            <textarea
              value={feedback}
              onChange={(e) => setFeedback(e.target.value)}
              placeholder="Example: Make the explanation more beginner-friendly and add a real-world example about binary trees. Also, add a step-by-step breakdown of how tree traversal works."
              rows="5"
              className="input-field"
              disabled={loading}
            />
          </div>
          
          {/* Feedback Templates */}
          <div className="mb-4">
            <p className="text-sm font-medium text-gray-700 mb-2">Quick Templates:</p>
            <div className="flex flex-wrap gap-2 max-h-32 overflow-y-auto">
              {feedbackTemplates.map((template, idx) => (
                <button
                  key={idx}
                  onClick={() => applyTemplate(template.text)}
                  className="text-xs bg-gray-100 hover:bg-gray-200 text-gray-700 px-2 py-1 rounded-full transition-colors flex items-center"
                  disabled={loading}
                  title={template.description}
                >
                  <span className="mr-1">{template.icon}</span>
                  {template.text.substring(0, 40)}...
                </button>
              ))}
            </div>
          </div>
          
          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-start text-red-700">
              <AlertCircle className="w-4 h-4 mr-2 flex-shrink-0 mt-0.5" />
              <span className="text-sm">{error}</span>
            </div>
          )}
          
          {success && (
            <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg flex items-center text-green-700">
              <CheckCircle className="w-4 h-4 mr-2" />
              <span className="text-sm">Feedback applied successfully! The screen has been updated.</span>
            </div>
          )}
          
          <div className="flex justify-end space-x-3">
            <button
              onClick={onClose}
              className="btn-secondary"
              disabled={loading}
            >
              Cancel
            </button>
            <button
              onClick={handleSubmit}
              disabled={loading || !feedback.trim()}
              className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg flex items-center"
            >
              {loading ? (
                <>
                  <Loader className="w-4 h-4 mr-2 animate-spin" />
                  Applying...
                </>
              ) : (
                <>
                  <Send className="w-4 h-4 mr-2" />
                  Apply Feedback
                </>
              )}
            </button>
          </div>
          
          <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
            <p className="text-xs text-yellow-800">
              💡 <span className="font-semibold">Tip:</span> Be specific about what you want changed. 
              The AI will ONLY modify the content based on your instructions while keeping the structure intact.
              For example: "Add an analogy comparing trees to family trees" or "Simplify the explanation for beginners".
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FeedbackModal;