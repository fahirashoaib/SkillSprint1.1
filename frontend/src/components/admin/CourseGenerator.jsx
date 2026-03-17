import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { documentAPI } from '../../services/api';
import axios from 'axios';
import LoadingSpinner from '../LoadingSpinner';
import { CheckCircle, XCircle, ArrowLeft, Save } from 'lucide-react';

const StepCourseGenerator = ({ documentId, documentName }) => {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState('overview'); // overview, units, unit-content, complete
  const [sessionId, setSessionId] = useState(null);
  const [overview, setOverview] = useState('');
  const [overviewApproved, setOverviewApproved] = useState(false);
  const [units, setUnits] = useState([]);
  const [approvedUnits, setApprovedUnits] = useState([]);
  const [currentUnitIndex, setCurrentUnitIndex] = useState(0);
  const [unitContents, setUnitContents] = useState({});
  const [unitContentMeta, setUnitContentMeta] = useState({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [loadingMessage, setLoadingMessage] = useState('');

  // Step 1: Generate Overview
  const generateOverview = async () => {
    setLoading(true);
    setLoadingMessage('Generating course overview…');
    setError('');
    try {
      console.log('Generating overview for document:', documentId);
      const token = localStorage.getItem('token');
      console.log('Using token:', token ? 'Token exists' : 'No token');

      const response = await axios.post(
        `http://localhost:5000/api/ai/step/overview/${documentId}`,
        {},
        {
          headers: {
            Authorization: `Bearer ${token}`
          },
          timeout: 60000 // 60 second timeout
        }
      );
      console.log('Overview response:', response.data);
      setSessionId(response.data.sessionId);
      setOverview(response.data.overview);
    } catch (err) {
      console.error('Generate overview error:', {
        message: err.message,
        response: err.response?.data,
        status: err.response?.status,
        config: err.config
      });

      if (err.code === 'ECONNABORTED') {
        setError('Request timeout - AI service might be slow');
      } else if (err.response?.status === 503) {
        setError('AI service not running. Please start the Python server on port 8000');
      } else {
        setError(err.response?.data?.message || 'Failed to generate overview');
      }
    } finally {
      setLoading(false);
      setLoadingMessage('');
    }
  };

  // Step 2: Generate Units (after overview)
  const generateUnits = async () => {
    setLoading(true);
    setLoadingMessage('Generating units…');
    setError('');
    try {
      const response = await axios.post(
        `http://localhost:5000/api/ai/step/units/${sessionId}`,
        { overview },
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('token')}`
          }
        }
      );
      setUnits(response.data.units);
      // Reset unit-generation progress if units change
      setApprovedUnits([]);
      setCurrentUnitIndex(0);
      setUnitContents({});
      setCurrentStep('units');
    } catch (err) {
      setError('Failed to generate units');
      console.error(err);
    } finally {
      setLoading(false);
      setLoadingMessage('');
    }
  };

  // Step 2: Approve Overview & Continue to Units
  const approveOverview = async () => {
    setOverviewApproved(true);
    await generateUnits();
  };

  // Step 3: Generate Content for a Unit
  const generateUnitContent = async (index) => {
    setLoading(true);
    setLoadingMessage(`Generating content for Unit ${index + 1}…`);
    setError('');
    try {
      const response = await axios.post(
        `http://localhost:5000/api/ai/step/unit-content/${sessionId}/${index}`,
        {
          unitTitle: units[index].title,
          unitDescription: units[index].description
        },
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('token')}`
          }
        }
      );
      setUnitContents(prev => ({
        ...prev,
        [index]: response.data.unit
      }));
      setUnitContentMeta(prev => ({
        ...prev,
        [index]: response.data.meta || null
      }));

      // Auto-save after each successful generation
      await autoSaveDraft();
    } catch (err) {
      setError(`Failed to generate content for unit ${index + 1}`);
      console.error(err);
    } finally {
      setLoading(false);
      setLoadingMessage('');
    }
  };

  // Step 4: Approve Unit
  const approveUnit = (index) => {
    setApprovedUnits(prev => [...prev, index]);
    if (index < units.length - 1) {
      setCurrentUnitIndex(index + 1);
    } else {
      setCurrentStep('complete');
    }
  };

  // Step 5: Save Complete Course
  const saveCourse = async () => {
    setLoading(true);
    setLoadingMessage('Saving course draft…');
    try {
      const response = await axios.post(
        `http://localhost:5000/api/ai/step/save/${sessionId}`,
        {
          title: documentName.replace(/\.[^/.]+$/, ""),
          category: 'General',
          difficulty: 'Beginner'
        },
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('token')}`
          }
        }
      );
      alert('Course saved successfully!');
      navigate(`/admin/review-course/${response.data.courseId}`);
    } catch (err) {
      setError('Failed to save course');
      console.error(err);
    } finally {
      setLoading(false);
      setLoadingMessage('');
    }
  };

  // Back button handler
  const handleBack = () => {
    if (currentStep === 'overview') {
      // Close the generator and go back to documents list
      window.location.reload(); // Simple refresh to close modal
    } else if (currentStep === 'units') {
      setCurrentStep('overview');
    } else if (currentStep === 'unit-content') {
      if (currentUnitIndex > 0) {
        setCurrentUnitIndex(currentUnitIndex - 1);
      } else {
        setCurrentStep('units');
      }
    }
  };

  // Cancel button handler
  const handleCancel = async () => {
    if (window.confirm('Are you sure you want to cancel? Any unsaved progress will be lost.')) {
      window.location.reload(); // Close the generator
    }
  };

  // Save as draft function
  const handleSaveDraft = async () => {
    if (!sessionId) {
      alert('No generation session found');
      return;
    }

    setLoading(true);
    setLoadingMessage('Saving draft…');
    try {
      // Save current progress as draft
      const response = await axios.post(
        `http://localhost:5000/api/ai/step/save/${sessionId}`,
        {
          title: documentName.replace(/\.[^/.]+$/, ""),
          category: 'General',
          difficulty: 'Beginner'
        },
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('token')}`
          }
        }
      );

      alert('Draft saved successfully!');
      navigate(`/admin/review-course/${response.data.courseId}`);
    } catch (err) {
      console.error('Save draft error:', err);
      setError('Failed to save draft: ' + (err.response?.data?.message || err.message));
    } finally {
      setLoading(false);
      setLoadingMessage('');
    }
  };

  // Auto-save draft function
  const autoSaveDraft = async () => {
    // Don't auto-save if no session or no units generated
    if (!sessionId || units.length === 0) return;

    try {
      await axios.post(
        `http://localhost:5000/api/ai/step/save-progress/${sessionId}`,
        {
          title: documentName.replace(/\.[^/.]+$/, ""),
          category: 'General',
          difficulty: 'Beginner'
        },
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('token')}`
          }
        }
      );
      console.log('Auto-saved successfully');
    } catch (err) {
      console.error('Auto-save failed:', err);
    }
  };

  const renderStep = () => {
    if (currentStep === 'overview') {
      return (
        <div className="space-y-6">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h3 className="font-semibold text-blue-800 mb-2">Step 1: Generate Course Overview</h3>
            <p className="text-blue-600 text-sm">The AI will create a course overview based on your document.</p>
          </div>

          {!overview ? (
            <button onClick={generateOverview} disabled={loading} className="btn-primary">
              {loading ? 'Generating...' : 'Generate Overview'}
            </button>
          ) : (
            <div className="space-y-4">
              <div className="border rounded-lg p-4 bg-gray-50">
                <h4 className="font-medium text-gray-900 mb-2">Generated Overview:</h4>
                {Array.isArray(overview) ? (
                  <ul className="list-disc pl-5 space-y-1">
                    {overview.map((item, idx) => (
                      <li key={idx} className="text-gray-700">{item}</li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-gray-700 whitespace-pre-wrap">{overview}</p>
                )}
              </div>

              {/* ACTION BUTTONS */}
              <div className="flex space-x-3">
                <button
                  onClick={approveOverview}
                  disabled={loading}
                  className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg flex items-center"
                >
                  <CheckCircle className="w-4 h-4 mr-2" />
                  Approve & Continue
                </button>
                <button
                  onClick={generateOverview}
                  disabled={loading}
                  className="btn-secondary flex items-center"
                >
                  <XCircle className="w-4 h-4 mr-2" />
                  Regenerate
                </button>
              </div>
            </div>
          )}

          {/* NAVIGATION BUTTONS */}
          <div className="flex justify-between items-center mt-6 pt-4 border-t border-gray-200">
            <button
              onClick={handleBack}
              className="btn-secondary flex items-center"
              disabled={loading}
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back
            </button>

            <button
              onClick={handleSaveDraft}
              className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg flex items-center"
              disabled={loading || !sessionId}
            >
              <Save className="w-4 h-4 mr-2" />
              Save as Draft
            </button>

            <button
              onClick={handleCancel}
              className="bg-gray-200 hover:bg-gray-300 text-gray-800 px-4 py-2 rounded-lg"
              disabled={loading}
            >
              Cancel
            </button>
          </div>
        </div>
      );
    }

    if (currentStep === 'units') {
      const formatUnitTitle = (rawTitle, idx) => {
        const title = (rawTitle || '').trim();
        const stripped = title.replace(/^unit\s*\d+\s*[:\-]?\s*/i, '').trim();
        return stripped || title || `Unit ${idx + 1}`;
      };

      return (
        <div className="space-y-6">
          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <h3 className="font-semibold text-green-800 mb-2">Step 2: Review Course Units</h3>
            <p className="text-green-600 text-sm">The AI has generated these units. Review and approve them.</p>
          </div>

          <div className="space-y-3">
            {units.map((unit, index) => (
              <div key={index} className="border rounded-lg p-4">
                <div className="flex justify-between items-start">
                  <div>
                    <h4 className="font-semibold text-gray-900">
                      Unit {index + 1}: {formatUnitTitle(unit.title, index)}
                    </h4>
                    <p className="text-gray-600 text-sm mt-1 line-clamp-1">{unit.description}</p>
                  </div>
                  <span className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded">
                    Pending
                  </span>
                </div>
              </div>
            ))}
          </div>

          <div className="flex flex-wrap gap-3">
            <button
              onClick={() => {
                setCurrentStep('unit-content');
                setCurrentUnitIndex(0);
              }}
              className="btn-primary"
            >
              Continue to Generate Content
            </button>
            <button
              onClick={generateUnits}
              disabled={loading || !sessionId || !overview}
              className="btn-secondary flex items-center"
              title={!overview ? 'Generate/approve overview first' : 'Regenerate the unit list from the same overview'}
            >
              <XCircle className="w-4 h-4 mr-2" />
              Regenerate Units
            </button>
          </div>

          {/* NAVIGATION BUTTONS */}
          <div className="flex justify-between items-center mt-6 pt-4 border-t border-gray-200">
            <button
              onClick={handleBack}
              className="btn-secondary flex items-center"
              disabled={loading}
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back
            </button>

            <button
              onClick={handleSaveDraft}
              className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg flex items-center"
              disabled={loading || !sessionId}
            >
              <Save className="w-4 h-4 mr-2" />
              Save as Draft
            </button>

            <button
              onClick={handleCancel}
              className="bg-gray-200 hover:bg-gray-300 text-gray-800 px-4 py-2 rounded-lg"
              disabled={loading}
            >
              Cancel
            </button>
          </div>
        </div>
      );
    }

    if (currentStep === 'unit-content') {
      const unit = units[currentUnitIndex];
      const content = unitContents[currentUnitIndex];
      const meta = unitContentMeta[currentUnitIndex];

      return (
        <div className="space-y-6">
          <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
            <h3 className="font-semibold text-purple-800 mb-2">
              Step 3: Generate Content for Unit {currentUnitIndex + 1} of {units.length}
            </h3>
            <p className="text-purple-600 text-sm">Unit: {unit?.title}</p>
          </div>

          {!content ? (
            <button
              onClick={() => generateUnitContent(currentUnitIndex)}
              disabled={loading}
              className="btn-primary"
            >
              {loading ? 'Generating...' : `Generate Content for Unit ${currentUnitIndex + 1}`}
            </button>
          ) : (
            <div className="space-y-4">
              {meta?.source === 'fallback' && (
                <div className="rounded-lg border border-yellow-200 bg-yellow-50 px-4 py-3 text-yellow-900 text-sm">
                  <div className="font-medium">AI fallback content was used.</div>
                  <div className="text-yellow-800">
                    This usually means the model request failed (rate limit, prompt too large, or invalid JSON). If you share the error below, I can fix it.
                  </div>
                  {meta?.error && (
                    <div className="mt-2 font-mono text-xs whitespace-pre-wrap text-yellow-900">
                      {meta.error}
                    </div>
                  )}
                </div>
              )}
              <div className="border rounded-lg p-4">
                <h4 className="font-semibold text-gray-900 mb-3">{content.title}</h4>

                <div className="space-y-4">
                  {content.screens?.map((screen, idx) => (
                    <div key={idx} className="border-l-4 border-blue-400 pl-4">
                      <div className="flex items-center justify-between gap-3">
                        <h5 className="font-medium text-gray-800">{screen.title}</h5>
                        <span className="text-xs px-2 py-1 rounded bg-gray-100 text-gray-700">
                          {screen.type || 'content'}
                        </span>
                      </div>
                      <p className="text-sm text-gray-600 mt-1 line-clamp-2">
                        {screen.description || screen.content || ''}
                      </p>
                      {screen.type === 'concept-check' && (
                        <p className="text-xs text-gray-500 mt-1">
                          {screen.questions?.length || 0} questions
                        </p>
                      )}
                    </div>
                  ))}
                  {!content.screens?.length && (
                    <div className="text-sm text-gray-500">No screens generated for this unit.</div>
                  )}
                </div>
              </div>

              <div className="flex space-x-3">
                <button
                  onClick={() => approveUnit(currentUnitIndex)}
                  className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg flex items-center"
                >
                  <CheckCircle className="w-4 h-4 mr-2" />
                  Approve Unit
                </button>
                <button
                  onClick={() => generateUnitContent(currentUnitIndex)}
                  disabled={loading}
                  className="btn-secondary flex items-center"
                >
                  <XCircle className="w-4 h-4 mr-2" />
                  Regenerate
                </button>
              </div>
            </div>
          )}

          <div className="flex items-center space-x-2 text-sm text-gray-500">
            <span>Progress: {approvedUnits.length}/{units.length} units approved</span>
            <div className="flex-1 h-2 bg-gray-200 rounded-full">
              <div
                className="h-2 bg-green-500 rounded-full"
                style={{ width: `${(approvedUnits.length / units.length) * 100}%` }}
              />
            </div>
          </div>

          {/* NAVIGATION BUTTONS - Fixed: moved outside the progress div */}
          <div className="flex justify-between items-center mt-6 pt-4 border-t border-gray-200">
            <button
              onClick={handleBack}
              className="btn-secondary flex items-center"
              disabled={loading}
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back
            </button>

            <button
              onClick={handleSaveDraft}
              className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg flex items-center"
              disabled={loading || !sessionId}
            >
              <Save className="w-4 h-4 mr-2" />
              Save as Draft
            </button>

            <button
              onClick={handleCancel}
              className="bg-gray-200 hover:bg-gray-300 text-gray-800 px-4 py-2 rounded-lg"
              disabled={loading}
            >
              Cancel
            </button>
          </div>
        </div>
      );
    }

    if (currentStep === 'complete') {
      return (
        <div className="space-y-6">
          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <h3 className="font-semibold text-green-800 mb-2">All Units Approved!</h3>
            <p className="text-green-600 text-sm">Ready to save your course.</p>
          </div>

          <div className="border rounded-lg p-4">
            <h4 className="font-medium text-gray-900 mb-3">Summary</h4>
            <ul className="space-y-2 text-sm">
              <li>✓ Overview approved</li>
              <li>✓ {units.length} units created</li>
              <li>✓ All unit content generated</li>
            </ul>
          </div>

          <button
            onClick={saveCourse}
            disabled={loading}
            className="btn-primary flex items-center"
          >
            <Save className="w-4 h-4 mr-2" />
            {loading ? 'Saving...' : 'Save Course & Review'}
          </button>

          {/* NAVIGATION BUTTONS */}
          <div className="flex justify-between items-center mt-6 pt-4 border-t border-gray-200">
            <button
              onClick={handleBack}
              className="btn-secondary flex items-center"
              disabled={loading}
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back
            </button>

            <button
              onClick={handleCancel}
              className="bg-gray-200 hover:bg-gray-300 text-gray-800 px-4 py-2 rounded-lg"
              disabled={loading}
            >
              Cancel
            </button>
          </div>
        </div>
      );
    }
  };

  return (
    <div className="card">
      {loading && (
        <div className="mb-4 flex items-center gap-3 rounded-lg border border-blue-200 bg-blue-50 px-4 py-3 text-blue-800">
          <LoadingSpinner />
          <div className="text-sm font-medium">
            {loadingMessage || 'Generating…'} <span className="font-normal text-blue-700">Please wait.</span>
          </div>
        </div>
      )}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-4">
          {error}
        </div>
      )}
      {renderStep()}
    </div>
  );
};

export default StepCourseGenerator;