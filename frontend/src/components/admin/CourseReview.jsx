import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { aiAPI } from '../../services/api';
import LoadingSpinner from '../LoadingSpinner';
import BackButton from '../BackButton';
import { Save, CheckCircle, XCircle, Edit2, FileText, ChevronDown, ChevronUp } from 'lucide-react';

const CourseReview = () => {
  const { courseId } = useParams();
  const navigate = useNavigate();
  const [course, setCourse] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [expandedUnits, setExpandedUnits] = useState({});
  const [editingField, setEditingField] = useState(null);

  useEffect(() => {
    loadDraft();
  }, [courseId]);

  const loadDraft = async () => {
    setLoading(true);
    try {
      const response = await aiAPI.getDraft(courseId);
      setCourse(response.data);
      
      // Initialize all units as expanded
      const expanded = {};
      response.data.units?.forEach((_, index) => {
        expanded[index] = true;
      });
      setExpandedUnits(expanded);
    } catch (error) {
      console.error('Failed to load draft:', error);
      alert('Failed to load course draft');
    } finally {
      setLoading(false);
    }
  };

  const handleFieldChange = (path, value) => {
    const updated = { ...course };
    const keys = path.split('.');
    let current = updated;
    
    for (let i = 0; i < keys.length - 1; i++) {
      current = current[keys[i]];
    }
    current[keys[keys.length - 1]] = value;
    
    setCourse(updated);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await aiAPI.updateDraft(courseId, course);
      alert('Draft saved successfully');
      setEditingField(null);
    } catch (error) {
      console.error('Save error:', error);
      alert('Failed to save draft');
    } finally {
      setSaving(false);
    }
  };

  const handlePublish = async () => {
    if (!window.confirm('Are you sure you want to publish this course? It will be visible to all learners.')) {
      return;
    }

    setSaving(true);
    try {
      await aiAPI.publishDraft(courseId);
      alert('Course published successfully!');
      navigate('/admin');
    } catch (error) {
      console.error('Publish error:', error);
      alert('Failed to publish course');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm('Are you sure you want to delete this draft? This action cannot be undone.')) {
      return;
    }

    try {
      await aiAPI.deleteDraft(courseId);
      alert('Draft deleted');
      navigate('/admin');
    } catch (error) {
      console.error('Delete error:', error);
      alert('Failed to delete draft');
    }
  };

  const toggleUnit = (index) => {
    setExpandedUnits(prev => ({
      ...prev,
      [index]: !prev[index]
    }));
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (!course) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Draft not found</h2>
          <button onClick={() => navigate('/admin')} className="btn-primary">
            Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4">
        <BackButton to="/admin" text="Back to Dashboard" />

        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Review Course Draft</h1>
            <p className="text-gray-600 mt-1">Review and edit the AI-generated course before publishing</p>
          </div>
          <div className="flex space-x-3">
            <button
              onClick={handleSave}
              disabled={saving}
              className="btn-secondary flex items-center"
            >
              <Save className="w-4 h-4 mr-2" />
              {saving ? 'Saving...' : 'Save Draft'}
            </button>
            <button
              onClick={handlePublish}
              disabled={saving}
              className="bg-green-600 hover:bg-green-700 text-white font-medium py-2 px-4 rounded-lg transition-colors flex items-center"
            >
              <CheckCircle className="w-4 h-4 mr-2" />
              Publish Course
            </button>
            <button
              onClick={handleDelete}
              className="bg-red-600 hover:bg-red-700 text-white font-medium py-2 px-4 rounded-lg transition-colors flex items-center"
            >
              <XCircle className="w-4 h-4 mr-2" />
              Delete Draft
            </button>
          </div>
        </div>

        {/* Course Overview */}
        <div className="card mb-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Course Overview</h2>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Title</label>
              <input
                type="text"
                value={course.title || ''}
                onChange={(e) => handleFieldChange('title', e.target.value)}
                className="input-field"
              />
            </div>

            <div>
              <div className="flex justify-between items-center mb-2">
                <label className="block text-sm font-medium text-gray-700">Learning Objectives</label>
                {editingField === 'learningObjectives' ? (
                  <button
                    onClick={() => setEditingField(null)}
                    className="text-sm text-blue-600 hover:text-blue-700"
                  >
                    Done
                  </button>
                ) : (
                  <button
                    onClick={() => setEditingField('learningObjectives')}
                    className="text-sm text-gray-600 hover:text-gray-900 flex items-center"
                  >
                    <Edit2 className="w-4 h-4 mr-1" /> Edit
                  </button>
                )}
              </div>
              {editingField === 'learningObjectives' ? (
                <textarea
                  value={(course.learningObjectives || []).join('\n')}
                  onChange={(e) =>
                    handleFieldChange(
                      'learningObjectives',
                      e.target.value
                        .split('\n')
                        .map((l) => l.trim())
                        .filter(Boolean)
                    )
                  }
                  rows="4"
                  className="input-field"
                  placeholder="One objective per line"
                />
              ) : (
                <div className="p-4 bg-gray-50 rounded-lg text-gray-700">
                  {(course.learningObjectives || []).length ? (
                    <ul className="list-disc pl-5 space-y-1">
                      {(course.learningObjectives || []).map((obj, idx) => (
                        <li key={idx}>{obj}</li>
                      ))}
                    </ul>
                  ) : (
                    'No learning objectives provided'
                  )}
                </div>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Category</label>
                <input
                  type="text"
                  value={course.category || ''}
                  onChange={(e) => handleFieldChange('category', e.target.value)}
                  className="input-field"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Difficulty</label>
                <select
                  value={course.difficulty || 'Beginner'}
                  onChange={(e) => handleFieldChange('difficulty', e.target.value)}
                  className="input-field"
                >
                  <option>Beginner</option>
                  <option>Intermediate</option>
                  <option>Advanced</option>
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* Units */}
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-bold text-gray-900">Course Units</h2>
          </div>

          {course.units?.map((unit, uIdx) => (
            <div key={uIdx} className="card">
              <div className="flex justify-between items-center">
                <button
                  onClick={() => toggleUnit(uIdx)}
                  className="flex items-center space-x-2 text-lg font-semibold text-gray-900 hover:text-blue-600"
                >
                  {expandedUnits[uIdx] ? (
                    <ChevronUp className="w-5 h-5" />
                  ) : (
                    <ChevronDown className="w-5 h-5" />
                  )}
                  <span>Unit {uIdx + 1}: {unit.title}</span>
                </button>
              </div>

              {expandedUnits[uIdx] && (
                <div className="mt-4 space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Unit Title</label>
                    <input
                      type="text"
                      value={unit.title || ''}
                      onChange={(e) => handleFieldChange(`units.${uIdx}.title`, e.target.value)}
                      className="input-field"
                    />
                  </div>

                  {/* Screens */}
                  <div className="space-y-3">
                    <h4 className="font-medium text-gray-900">Screens</h4>
                    {unit.screens?.map((screen, sIdx) => (
                      <div key={sIdx} className="border border-gray-200 rounded-lg p-4">
                        <div className="flex items-center justify-between gap-3 mb-3">
                          <h5 className="font-medium text-gray-900">
                            Screen {sIdx + 1}: {screen.title || '(untitled)'}
                          </h5>
                          <span className="text-xs px-2 py-1 rounded bg-gray-100 text-gray-700">
                            {screen.type || 'content'}
                          </span>
                        </div>

                        <div className="space-y-3">
                          <input
                            type="text"
                            value={screen.title || ''}
                            onChange={(e) => handleFieldChange(`units.${uIdx}.screens.${sIdx}.title`, e.target.value)}
                            className="input-field text-sm"
                            placeholder="Screen title"
                          />

                          <textarea
                            value={screen.description || ''}
                            onChange={(e) => handleFieldChange(`units.${uIdx}.screens.${sIdx}.description`, e.target.value)}
                            rows="3"
                            className="input-field text-sm"
                            placeholder="Screen description"
                          />

                          <div className="grid grid-cols-2 gap-3">
                            <div>
                              <label className="block text-xs font-medium text-gray-600 mb-1">Type</label>
                              <select
                                value={screen.type || 'content'}
                                onChange={(e) => handleFieldChange(`units.${uIdx}.screens.${sIdx}.type`, e.target.value)}
                                className="input-field text-sm"
                              >
                                <option value="content">content</option>
                                <option value="concept-check">concept-check</option>
                                <option value="coding">coding</option>
                              </select>
                            </div>
                            <div>
                              <label className="block text-xs font-medium text-gray-600 mb-1">XP</label>
                              <input
                                type="number"
                                value={screen.xp ?? 0}
                                onChange={(e) =>
                                  handleFieldChange(
                                    `units.${uIdx}.screens.${sIdx}.xp`,
                                    Number.isFinite(Number(e.target.value)) ? Number(e.target.value) : 0
                                  )
                                }
                                className="input-field text-sm"
                                min="0"
                              />
                            </div>
                          </div>

                          {screen.type === 'concept-check' && (
                            <div className="mt-2">
                              <p className="text-sm font-medium text-gray-700 mb-2">Questions</p>
                              {screen.questions?.map((q, qIdx) => (
                                <div key={qIdx} className="bg-gray-50 p-3 rounded mb-2 space-y-2">
                                  <input
                                    type="text"
                                    value={q.question || ''}
                                    onChange={(e) =>
                                      handleFieldChange(
                                        `units.${uIdx}.screens.${sIdx}.questions.${qIdx}.question`,
                                        e.target.value
                                      )
                                    }
                                    className="input-field text-sm"
                                    placeholder="Question"
                                  />
                                  <input
                                    type="text"
                                    value={q.correctAnswer || ''}
                                    onChange={(e) =>
                                      handleFieldChange(
                                        `units.${uIdx}.screens.${sIdx}.questions.${qIdx}.correctAnswer`,
                                        e.target.value
                                      )
                                    }
                                    className="input-field text-sm"
                                    placeholder="Correct answer"
                                  />
                                  {!!q.options?.length && (
                                    <div className="text-xs text-gray-600">
                                      Options: {q.options.join(', ')}
                                    </div>
                                  )}
                                </div>
                              ))}
                              {!screen.questions?.length && (
                                <div className="text-sm text-gray-500">No questions on this screen.</div>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                    {!unit.screens?.length && (
                      <div className="text-sm text-gray-500">No screens found for this unit.</div>
                    )}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Source Document Info */}
        {course.generatedFrom && (
          <div className="mt-6 p-4 bg-gray-50 rounded-lg flex items-center text-sm text-gray-600">
            <FileText className="w-5 h-5 mr-3 text-gray-400" />
            <span>Generated from document: </span>
            <span className="font-medium ml-1">{course.generatedFrom.originalName}</span>
          </div>
        )}
      </div>
    </div>
  );
};

export default CourseReview;