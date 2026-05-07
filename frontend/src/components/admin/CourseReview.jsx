import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { aiAPI } from '../../services/api';
import LoadingSpinner from '../LoadingSpinner';
import BackButton from '../BackButton';
import { 
  Sparkles, Save, CheckCircle, XCircle, Edit2, FileText, 
  ChevronDown, ChevronUp, AlertCircle, Trophy, Clock, BookOpen, 
  Plus, Trash2, Star, Target, Award, Zap, Brain, Shield,
  TrendingUp, Users, Eye, MessageSquare, Copy, RefreshCw,
  Layers, Monitor, HelpCircle, Code
} from 'lucide-react';

const CourseReview = () => {
  const { courseId } = useParams();
  const navigate = useNavigate();
  const [course, setCourse] = useState(null);
  const [originalCourse, setOriginalCourse] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [expandedUnits, setExpandedUnits] = useState({});
  const [expandedScreens, setExpandedScreens] = useState({});
  const [unsavedChanges, setUnsavedChanges] = useState(false);
  const [validationErrors, setValidationErrors] = useState({});
  const [aiImproving, setAiImproving] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');

  // Feedback modal state
  const [feedbackModalOpen, setFeedbackModalOpen] = useState(false);
  const [selectedField, setSelectedField] = useState(null);
  const [feedbackText, setFeedbackText] = useState('');
  const [feedbackLoading, setFeedbackLoading] = useState(false);
  const [aiSuggestion, setAiSuggestion] = useState('');

  useEffect(() => {
    loadDraft();
  }, [courseId]);

  useEffect(() => {
    const handleBeforeUnload = (e) => {
      if (unsavedChanges) {
        e.preventDefault();
        e.returnValue = 'You have unsaved changes. Are you sure?';
      }
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [unsavedChanges]);

  const loadDraft = async () => {
    setLoading(true);
    try {
      const response = await aiAPI.getReviewCourse(courseId);
      setCourse(response.data);
      setOriginalCourse(JSON.parse(JSON.stringify(response.data)));
      
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
      if (!current[keys[i]]) current[keys[i]] = {};
      current = current[keys[i]];
    }
    current[keys[keys.length - 1]] = value;
    setCourse(updated);
    setUnsavedChanges(true);
    if (validationErrors[path]) {
      setValidationErrors(prev => ({ ...prev, [path]: null }));
    }
  };

  const validateCourse = () => {
    const errors = {};
    if (!course.title?.trim()) errors.title = 'Course title is required';
    if (!course.learningObjectives?.length) errors.learningObjectives = 'At least one learning objective is required';
    
    course.units?.forEach((unit, uIdx) => {
      if (!unit.title?.trim()) errors[`units.${uIdx}.title`] = 'Unit title is required';
      unit.screens?.forEach((screen, sIdx) => {
        if (!screen.title?.trim()) errors[`units.${uIdx}.screens.${sIdx}.title`] = 'Screen title is required';
        if (screen.type === 'concept-check' && screen.questions) {
          screen.questions.forEach((q, qIdx) => {
            if (!q.question?.trim()) errors[`units.${uIdx}.screens.${sIdx}.questions.${qIdx}.question`] = 'Question required';
            if (!q.correctAnswer?.trim()) errors[`units.${uIdx}.screens.${sIdx}.questions.${qIdx}.correctAnswer`] = 'Correct answer required';
          });
        }
      });
    });
    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSave = async () => {
    if (!validateCourse()) {
      alert('Please fix validation errors before saving');
      return;
    }
    setSaving(true);
    try {
      await aiAPI.updateDraft(courseId, course);
      setOriginalCourse(JSON.parse(JSON.stringify(course)));
      setUnsavedChanges(false);
      alert('Draft saved successfully');
    } catch (error) {
      console.error('Save error:', error);
      alert('Failed to save draft: ' + (error.response?.data?.message || error.message));
    } finally {
      setSaving(false);
    }
  };

  const handlePublish = async () => {
    if (!validateCourse()) {
      alert('Please fix validation errors before publishing');
      return;
    }
    if (!window.confirm('Publish this course? It will be visible to all learners.')) return;
    
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
    if (!window.confirm('Delete this draft? This cannot be undone.')) return;
    try {
      await aiAPI.deleteDraft(courseId);
      alert('Draft deleted');
      navigate('/admin');
    } catch (error) {
      console.error('Delete error:', error);
      alert('Failed to delete draft');
    }
  };

  // AI Improvement Handler
  const openAiFeedback = (fieldType, data, unitIndex = null, screenIndex = null, questionIndex = null) => {
    setSelectedField({ type: fieldType, data, unitIndex, screenIndex, questionIndex });
    setFeedbackText('');
    setAiSuggestion('');
    setFeedbackModalOpen(true);
  };

  const applyAiImprovement = async () => {
    if (!feedbackText.trim() && !aiSuggestion) {
      alert('Please provide feedback or use the suggestion');
      return;
    }
    
    setFeedbackLoading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:5000/api/ai/improve-field/${courseId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          fieldType: selectedField.type,
          currentValue: selectedField.data,
          feedback: feedbackText || aiSuggestion,
          context: {
            unitIndex: selectedField.unitIndex,
            screenIndex: selectedField.screenIndex,
            questionIndex: selectedField.questionIndex,
            courseTitle: course?.title,
            unitTitle: selectedField.unitIndex !== null ? course?.units[selectedField.unitIndex]?.title : null
          }
        })
      });
      
      const result = await response.json();
      if (result.result) {
        // Apply the improvement based on field type
        if (selectedField.type === 'course_title') {
          handleFieldChange('title', result.result.title || result.result);
        } else if (selectedField.type === 'learning_objectives') {
          handleFieldChange('learningObjectives', Array.isArray(result.result) ? result.result : [result.result]);
        } else if (selectedField.type === 'unit_title' && selectedField.unitIndex !== null) {
          handleFieldChange(`units.${selectedField.unitIndex}.title`, result.result.title || result.result);
        } else if (selectedField.type === 'unit_message' && selectedField.unitIndex !== null) {
          handleFieldChange(`units.${selectedField.unitIndex}.displayMessage`, result.result.message || result.result);
        } else if (selectedField.type === 'key_takeaways' && selectedField.unitIndex !== null) {
          handleFieldChange(`units.${selectedField.unitIndex}.keyTakeaways`, Array.isArray(result.result) ? result.result : [result.result]);
        } else if (selectedField.type === 'screen_title' && selectedField.unitIndex !== null && selectedField.screenIndex !== null) {
          handleFieldChange(`units.${selectedField.unitIndex}.screens.${selectedField.screenIndex}.title`, result.result.title || result.result);
        } else if (selectedField.type === 'screen_description' && selectedField.unitIndex !== null && selectedField.screenIndex !== null) {
          handleFieldChange(`units.${selectedField.unitIndex}.screens.${selectedField.screenIndex}.description`, result.result.description || result.result);
        } else if (selectedField.type === 'question_text' && selectedField.unitIndex !== null && selectedField.screenIndex !== null && selectedField.questionIndex !== null) {
          handleFieldChange(`units.${selectedField.unitIndex}.screens.${selectedField.screenIndex}.questions.${selectedField.questionIndex}.question`, result.result.question || result.result);
        } else if (selectedField.type === 'question_explanation' && selectedField.unitIndex !== null && selectedField.screenIndex !== null && selectedField.questionIndex !== null) {
          handleFieldChange(`units.${selectedField.unitIndex}.screens.${selectedField.screenIndex}.questions.${selectedField.questionIndex}.explanation`, result.result.explanation || result.result);
        }
        setFeedbackModalOpen(false);
        alert('AI improvement applied successfully!');
      }
    } catch (error) {
      console.error('AI improvement error:', error);
      alert('Failed to apply AI improvement');
    } finally {
      setFeedbackLoading(false);
    }
  };

  const generateAiSuggestion = async () => {
    if (!feedbackText.trim()) {
      alert('Please enter feedback first');
      return;
    }
    setAiImproving(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:5000/api/ai/suggest-improvement/${courseId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          fieldType: selectedField.type,
          currentValue: selectedField.data,
          feedback: feedbackText,
          context: {
            unitIndex: selectedField.unitIndex,
            screenIndex: selectedField.screenIndex,
            courseTitle: course?.title
          }
        })
      });
      const result = await response.json();
      if (result.suggestion) {
        setAiSuggestion(result.suggestion);
      }
    } catch (error) {
      console.error('Suggestion error:', error);
      alert('Failed to generate suggestion');
    } finally {
      setAiImproving(false);
    }
  };

  const toggleUnit = (index) => {
    setExpandedUnits(prev => ({ ...prev, [index]: !prev[index] }));
  };

  const toggleScreen = (unitIndex, screenIndex) => {
    const key = `${unitIndex}-${screenIndex}`;
    setExpandedScreens(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const getTotalStats = () => {
    if (!course?.units) return { screens: 0, questions: 0, xp: 0 };
    let screens = 0, questions = 0, xp = 0;
    course.units.forEach(unit => {
      screens += unit.screens?.length || 0;
      unit.screens?.forEach(screen => {
        if (screen.type === 'concept-check' && screen.questions) {
          questions += screen.questions.length;
          screen.questions.forEach(q => xp += q.xp || 5);
        } else {
          xp += screen.xp || 0;
        }
      });
    });
    return { screens, questions, xp };
  };

  const getScreenIcon = (type) => {
    switch(type) {
      case 'concept-check': return <HelpCircle className="w-4 h-4" />;
      case 'coding': return <Code className="w-4 h-4" />;
      default: return <Monitor className="w-4 h-4" />;
    }
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
          <button onClick={() => navigate('/admin')} className="btn-primary">Back to Dashboard</button>
        </div>
      </div>
    );
  }

  const stats = getTotalStats();

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 py-8">
      <div className="max-w-7xl mx-auto px-4">
        <BackButton to="/admin" text="Back to Dashboard" />

        {/* Unsaved Changes Warning */}
        {unsavedChanges && (
          <div className="mb-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg flex items-center justify-between shadow-sm">
            <div className="flex items-center">
              <AlertCircle className="w-5 h-5 text-yellow-600 mr-2" />
              <span className="text-yellow-800 font-medium">You have unsaved changes</span>
            </div>
            <button onClick={handleSave} disabled={saving} className="bg-yellow-600 hover:bg-yellow-700 text-white px-4 py-2 rounded-lg text-sm">
              {saving ? 'Saving...' : 'Save Now'}
            </button>
          </div>
        )}

        {/* Header */}
        <div className="mb-6">
          <div className="flex justify-between items-start mb-4">
            <div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-gray-900 to-gray-600 bg-clip-text text-transparent">
                Course Builder
              </h1>
              <p className="text-gray-600 mt-1">Review, edit, and enhance your AI-generated course</p>
            </div>
            <div className="flex space-x-3">
              <button onClick={handleSave} disabled={saving} className="btn-secondary flex items-center">
                <Save className="w-4 h-4 mr-2" />
                {saving ? 'Saving...' : 'Save Draft'}
              </button>
              <button onClick={handlePublish} disabled={saving} className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg flex items-center">
                <CheckCircle className="w-4 h-4 mr-2" />
                Publish Course
              </button>
              <button onClick={handleDelete} className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg flex items-center">
                <Trash2 className="w-4 h-4 mr-2" />
                Delete
              </button>
            </div>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-6">
            <div className="bg-white rounded-xl shadow-sm p-4 border-l-4 border-blue-500">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500">Total Screens</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.screens}</p>
                </div>
                <Layers className="w-8 h-8 text-blue-500 opacity-75" />
              </div>
            </div>
            <div className="bg-white rounded-xl shadow-sm p-4 border-l-4 border-green-500">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500">Questions</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.questions}</p>
                </div>
                <Brain className="w-8 h-8 text-green-500 opacity-75" />
              </div>
            </div>
            <div className="bg-white rounded-xl shadow-sm p-4 border-l-4 border-yellow-500">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500">Total XP</p>
                  <p className="text-2xl font-bold text-yellow-600">{stats.xp}</p>
                </div>
                <Trophy className="w-8 h-8 text-yellow-500 opacity-75" />
              </div>
            </div>
            <div className="bg-white rounded-xl shadow-sm p-4 border-l-4 border-purple-500">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500">Units</p>
                  <p className="text-2xl font-bold text-gray-900">{course.units?.length || 0}</p>
                </div>
                <Target className="w-8 h-8 text-purple-500 opacity-75" />
              </div>
            </div>
            <div className="bg-white rounded-xl shadow-sm p-4 border-l-4 border-orange-500">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500">Est. Duration</p>
                  <p className="text-2xl font-bold text-gray-900">{course.totalDuration || 45} min</p>
                </div>
                <Clock className="w-8 h-8 text-orange-500 opacity-75" />
              </div>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex space-x-2 mb-6 border-b">
          {['overview', 'units', 'analytics'].map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-6 py-2 font-medium transition-colors ${
                activeTab === tab 
                  ? 'text-blue-600 border-b-2 border-blue-600' 
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
            </button>
          ))}
        </div>

        {/* Tab: Overview */}
        {activeTab === 'overview' && (
          <div className="card mb-6">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                <Zap className="w-6 h-6 text-yellow-500" />
                Course Overview
              </h2>
              <button
                onClick={() => openAiFeedback('course_overview', { title: course.title, objectives: course.learningObjectives })}
                className="bg-gradient-to-r from-purple-500 to-pink-500 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:from-purple-600 hover:to-pink-600 transition-all"
              >
                <Sparkles className="w-4 h-4" />
                AI Enhance Course
              </button>
            </div>

            <div className="space-y-6">
              {/* Course Title */}
              <div>
                <div className="flex justify-between items-center mb-2">
                  <label className="block text-sm font-semibold text-gray-700">
                    Course Title <span className="text-red-500">*</span>
                  </label>
                  <button
                    onClick={() => openAiFeedback('course_title', course.title)}
                    className="text-purple-500 hover:text-purple-700 flex items-center gap-1 text-sm"
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                    Improve with AI
                  </button>
                </div>
                <input
                  type="text"
                  value={course.title || ''}
                  onChange={(e) => handleFieldChange('title', e.target.value)}
                  className={`input-field text-lg font-semibold ${validationErrors.title ? 'border-red-500' : ''}`}
                  placeholder="Enter course title"
                />
                {validationErrors.title && <p className="text-red-500 text-xs mt-1">{validationErrors.title}</p>}
              </div>

              {/* Category & Difficulty */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Category</label>
                  <select value={course.category || 'General'} onChange={(e) => handleFieldChange('category', e.target.value)} className="input-field">
                    <option>General</option><option>Programming</option><option>Data Science</option>
                    <option>Web Development</option><option>Business</option><option>Design</option><option>Marketing</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Difficulty Level</label>
                  <select value={course.difficulty || 'Beginner'} onChange={(e) => handleFieldChange('difficulty', e.target.value)} className="input-field">
                    <option>Beginner</option><option>Intermediate</option><option>Advanced</option>
                  </select>
                </div>
              </div>

              {/* Learning Objectives */}
              <div>
                <div className="flex justify-between items-center mb-2">
                  <label className="block text-sm font-semibold text-gray-700">
                    Learning Objectives <span className="text-red-500">*</span>
                  </label>
                  <button
                    onClick={() => openAiFeedback('learning_objectives', course.learningObjectives)}
                    className="text-purple-500 hover:text-purple-700 flex items-center gap-1 text-sm"
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                    Improve All
                  </button>
                </div>
                <div className="space-y-2">
                  {(course.learningObjectives || []).map((obj, idx) => (
                    <div key={idx} className="flex items-center gap-2">
                      <span className="text-green-500 text-xl">✓</span>
                      <input
                        type="text"
                        value={obj}
                        onChange={(e) => {
                          const newObjectives = [...course.learningObjectives];
                          newObjectives[idx] = e.target.value;
                          handleFieldChange('learningObjectives', newObjectives);
                        }}
                        className="flex-1 input-field text-sm"
                      />
                      <button
                        onClick={() => {
                          const newObjectives = course.learningObjectives.filter((_, i) => i !== idx);
                          handleFieldChange('learningObjectives', newObjectives);
                        }}
                        className="text-red-400 hover:text-red-600"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                  <button
                    onClick={() => handleFieldChange('learningObjectives', [...(course.learningObjectives || []), 'New Objective'])}
                    className="text-blue-600 hover:text-blue-700 text-sm flex items-center gap-1 mt-2"
                  >
                    <Plus className="w-4 h-4" /> Add Objective
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Tab: Units with FULL SCREEN EDITING */}
        {activeTab === 'units' && (
          <div className="space-y-4">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                <Target className="w-6 h-6 text-purple-500" />
                Course Units ({course.units?.length || 0})
              </h2>
              <button
                onClick={() => {
                  const newUnit = {
                    unitId: `unit-${(course.units?.length || 0) + 1}`,
                    title: 'New Unit',
                    duration: 10,
                    totalXP: 25,
                    displayMessage: 'Ready to learn? Start now!',
                    screens: [],
                    keyTakeaways: ['Master the core concepts', 'Apply knowledge practically', 'Complete exercises']
                  };
                  handleFieldChange('units', [...(course.units || []), newUnit]);
                }}
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center gap-2"
              >
                <Plus className="w-4 h-4" /> Add Unit
              </button>
            </div>

            {course.units?.map((unit, uIdx) => (
              <div key={uIdx} className="card hover:shadow-lg transition-shadow">
                {/* Unit Header */}
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <button onClick={() => toggleUnit(uIdx)} className="focus:outline-none">
                        {expandedUnits[uIdx] ? <ChevronUp className="w-5 h-5 text-gray-500" /> : <ChevronDown className="w-5 h-5 text-gray-500" />}
                      </button>
                      <span className="text-sm font-semibold text-gray-400">UNIT {uIdx + 1}</span>
                      <div className="flex items-center gap-2 flex-1">
                        <input
                          type="text"
                          value={unit.title || ''}
                          onChange={(e) => handleFieldChange(`units.${uIdx}.title`, e.target.value)}
                          className="text-xl font-bold text-gray-900 bg-transparent border-b-2 border-transparent hover:border-gray-300 focus:border-blue-400 focus:outline-none flex-1"
                          placeholder="Unit Title"
                        />
                        <button
                          onClick={() => openAiFeedback('unit_title', unit.title, uIdx)}
                          className="text-purple-500 hover:text-purple-700 p-1 rounded"
                          title="Improve unit title with AI"
                        >
                          <Sparkles className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                    <div className="flex gap-4 text-sm text-gray-500 ml-8">
                      <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> {unit.duration || 10} min</span>
                      <span className="flex items-center gap-1"><Trophy className="w-3 h-3" /> {unit.totalXP || 25} XP</span>
                      <span className="flex items-center gap-1"><BookOpen className="w-3 h-3" /> {unit.screens?.length || 0} screens</span>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => {
                      const newUnits = [...course.units];
                      newUnits.splice(uIdx, 1);
                      handleFieldChange('units', newUnits);
                    }} className="text-red-500 hover:text-red-700 p-1">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {expandedUnits[uIdx] && (
                  <div className="mt-6 space-y-5 ml-8">
                    {/* Display Message */}
                    <div>
                      <div className="flex justify-between items-center mb-2">
                        <label className="block text-sm font-semibold text-gray-700">Welcome Message</label>
                        <button onClick={() => openAiFeedback('unit_message', unit.displayMessage, uIdx)} className="text-purple-500 hover:text-purple-700 flex items-center gap-1 text-xs">
                          <Sparkles className="w-3 h-3" /> Improve
                        </button>
                      </div>
                      <input
                        type="text"
                        value={unit.displayMessage || ''}
                        onChange={(e) => handleFieldChange(`units.${uIdx}.displayMessage`, e.target.value)}
                        className="input-field text-sm italic"
                        placeholder="Welcome message for learners"
                      />
                    </div>

                    {/* Key Takeaways */}
                    <div>
                      <div className="flex justify-between items-center mb-2">
                        <label className="block text-sm font-semibold text-gray-700">Key Takeaways</label>
                        <button onClick={() => openAiFeedback('key_takeaways', unit.keyTakeaways, uIdx)} className="text-purple-500 hover:text-purple-700 flex items-center gap-1 text-xs">
                          <Sparkles className="w-3 h-3" /> Improve
                        </button>
                      </div>
                      <textarea
                        value={(unit.keyTakeaways || []).join('\n')}
                        onChange={(e) => handleFieldChange(`units.${uIdx}.keyTakeaways`, e.target.value.split('\n').filter(l => l.trim()))}
                        rows="3"
                        className="input-field text-sm"
                        placeholder="One takeaway per line"
                      />
                    </div>

                    {/* SCREENS SECTION - FULLY VISIBLE */}
                    <div>
                      <div className="flex justify-between items-center mb-3">
                        <h4 className="font-semibold text-gray-900 flex items-center gap-2">
                          <Layers className="w-4 h-4 text-blue-500" />
                          Lesson Screens ({unit.screens?.length || 0})
                        </h4>
                        <button
                          onClick={() => {
                            const newScreen = {
                              screenId: `screen-${uIdx + 1}-${(unit.screens?.length || 0) + 1}`,
                              title: 'New Screen',
                              description: 'Screen description goes here',
                              type: 'content',
                              xp: 5
                            };
                            const updatedUnits = [...course.units];
                            updatedUnits[uIdx].screens = [...(unit.screens || []), newScreen];
                            handleFieldChange('units', updatedUnits);
                          }}
                          className="bg-blue-600 hover:bg-blue-700 text-white text-sm px-3 py-1.5 rounded-lg flex items-center gap-1"
                        >
                          <Plus className="w-3 h-3" /> Add Screen
                        </button>
                      </div>

                      {/* Screens List - FULLY VISIBLE */}
                      <div className="space-y-4">
                        {unit.screens?.map((screen, sIdx) => {
                          const screenKey = `${uIdx}-${sIdx}`;
                          return (
                            <div key={sIdx} className="border-2 border-gray-200 rounded-lg overflow-hidden hover:border-purple-300 transition-colors">
                              {/* Screen Header */}
                              <div 
                                className="bg-gray-50 px-4 py-3 flex items-center justify-between cursor-pointer hover:bg-gray-100"
                                onClick={() => toggleScreen(uIdx, sIdx)}
                              >
                                <div className="flex items-center gap-3">
                                  {expandedScreens[screenKey] ? <ChevronUp className="w-4 h-4 text-gray-500" /> : <ChevronDown className="w-4 h-4 text-gray-500" />}
                                  <div className={`p-1.5 rounded ${screen.type === 'concept-check' ? 'bg-orange-100' : 'bg-blue-100'}`}>
                                    {getScreenIcon(screen.type)}
                                  </div>
                                  <div>
                                    <p className="font-medium text-gray-900">Screen {sIdx + 1}: {screen.title || 'Untitled'}</p>
                                    <p className="text-xs text-gray-500">
                                      {screen.type === 'concept-check' ? `${screen.questions?.length || 0} questions` : 'Content screen'}
                                      {screen.xp > 0 && ` • ${screen.xp} XP`}
                                    </p>
                                  </div>
                                </div>
                                <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                                  <span className={`px-2 py-1 text-xs rounded-full font-medium ${
                                    screen.type === 'concept-check' ? 'bg-orange-100 text-orange-700' : 'bg-blue-100 text-blue-700'
                                  }`}>
                                    {screen.type === 'concept-check' ? '📝 Quiz' : '📖 Content'}
                                  </span>
                                  <button
                                    onClick={() => {
                                      const updatedUnits = [...course.units];
                                      updatedUnits[uIdx].screens.splice(sIdx, 1);
                                      handleFieldChange('units', updatedUnits);
                                    }}
                                    className="text-red-500 hover:text-red-700 p-1"
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </button>
                                </div>
                              </div>

                              {/* Screen Content - EXPANDED */}
                              {expandedScreens[screenKey] && (
                                <div className="p-4 space-y-4">
                                  {/* Screen Title with AI */}
                                  <div>
                                    <div className="flex justify-between items-center mb-1">
                                      <label className="block text-sm font-medium text-gray-700">Screen Title</label>
                                      <button
                                        onClick={() => openAiFeedback('screen_title', screen.title, uIdx, sIdx)}
                                        className="text-purple-500 hover:text-purple-700 flex items-center gap-1 text-xs"
                                      >
                                        <Sparkles className="w-3 h-3" /> Improve
                                      </button>
                                    </div>
                                    <input
                                      type="text"
                                      value={screen.title || ''}
                                      onChange={(e) => handleFieldChange(`units.${uIdx}.screens.${sIdx}.title`, e.target.value)}
                                      className="input-field text-sm"
                                      placeholder="Screen title"
                                    />
                                    {validationErrors[`units.${uIdx}.screens.${sIdx}.title`] && (
                                      <p className="text-red-500 text-xs mt-1">{validationErrors[`units.${uIdx}.screens.${sIdx}.title`]}</p>
                                    )}
                                  </div>

                                  {/* Screen Description with AI */}
                                  <div>
                                    <div className="flex justify-between items-center mb-1">
                                      <label className="block text-sm font-medium text-gray-700">Description / Content</label>
                                      <button
                                        onClick={() => openAiFeedback('screen_description', screen.description, uIdx, sIdx)}
                                        className="text-purple-500 hover:text-purple-700 flex items-center gap-1 text-xs"
                                      >
                                        <Sparkles className="w-3 h-3" /> Improve
                                      </button>
                                    </div>
                                    <textarea
                                      value={screen.description || ''}
                                      onChange={(e) => handleFieldChange(`units.${uIdx}.screens.${sIdx}.description`, e.target.value)}
                                      rows="4"
                                      className="input-field text-sm"
                                      placeholder="Screen description or content"
                                    />
                                  </div>

                                  {/* Screen Settings */}
                                  <div className="grid grid-cols-2 gap-4">
                                    <div>
                                      <label className="block text-sm font-medium text-gray-700 mb-1">Screen Type</label>
                                      <select
                                        value={screen.type || 'content'}
                                        onChange={(e) => {
                                          const newType = e.target.value;
                                          handleFieldChange(`units.${uIdx}.screens.${sIdx}.type`, newType);
                                          if (newType === 'concept-check' && !screen.questions) {
                                            handleFieldChange(`units.${uIdx}.screens.${sIdx}.questions`, [{
                                              type: 'mcq',
                                              question: 'Sample question?',
                                              options: ['Option A', 'Option B', 'Option C', 'Option D'],
                                              correctAnswer: 'Option A',
                                              explanation: 'Sample explanation',
                                              xp: 5
                                            }]);
                                          }
                                        }}
                                        className="input-field text-sm"
                                      >
                                        <option value="content">📖 Content Screen</option>
                                        <option value="concept-check">📝 Concept Check / Quiz</option>
                                      </select>
                                    </div>
                                    <div>
                                      <label className="block text-sm font-medium text-gray-700 mb-1">XP Reward</label>
                                      <input
                                        type="number"
                                        value={screen.xp || 0}
                                        onChange={(e) => handleFieldChange(`units.${uIdx}.screens.${sIdx}.xp`, parseInt(e.target.value) || 0)}
                                        className="input-field text-sm"
                                        min="0"
                                      />
                                    </div>
                                  </div>

                                  {/* Questions Section (for concept-check screens) */}
                                  {screen.type === 'concept-check' && (
                                    <div className="mt-4 pt-4 border-t border-gray-200">
                                      <div className="flex justify-between items-center mb-3">
                                        <label className="block text-sm font-semibold text-gray-700 flex items-center gap-2">
                                          <HelpCircle className="w-4 h-4 text-orange-500" />
                                          Questions ({screen.questions?.length || 0})
                                        </label>
                                        <button
                                          onClick={() => {
                                            const updatedUnits = [...course.units];
                                            if (!updatedUnits[uIdx].screens[sIdx].questions) {
                                              updatedUnits[uIdx].screens[sIdx].questions = [];
                                            }
                                            updatedUnits[uIdx].screens[sIdx].questions.push({
                                              type: 'mcq',
                                              question: 'New question',
                                              options: ['Option A', 'Option B', 'Option C', 'Option D'],
                                              correctAnswer: 'Option A',
                                              explanation: 'Explanation here',
                                              xp: 5
                                            });
                                            handleFieldChange('units', updatedUnits);
                                          }}
                                          className="text-blue-600 hover:text-blue-700 text-sm flex items-center gap-1"
                                        >
                                          <Plus className="w-3 h-3" /> Add Question
                                        </button>
                                      </div>

                                      <div className="space-y-3">
                                        {screen.questions?.map((q, qIdx) => (
                                          <div key={qIdx} className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                                            <div className="flex justify-between items-start mb-3">
                                              <span className="font-medium text-gray-900">Question {qIdx + 1}</span>
                                              <button
                                                onClick={() => {
                                                  const updatedUnits = [...course.units];
                                                  updatedUnits[uIdx].screens[sIdx].questions.splice(qIdx, 1);
                                                  handleFieldChange('units', updatedUnits);
                                                }}
                                                className="text-red-500 hover:text-red-700 text-xs"
                                              >
                                                Remove
                                              </button>
                                            </div>

                                            {/* Question Text with AI */}
                                            <div className="mb-3">
                                              <div className="flex justify-between items-center mb-1">
                                                <label className="text-xs text-gray-600">Question</label>
                                                <button
                                                  onClick={() => openAiFeedback('question_text', q.question, uIdx, sIdx, qIdx)}
                                                  className="text-purple-500 hover:text-purple-700 text-xs flex items-center gap-1"
                                                >
                                                  <Sparkles className="w-2.5 h-2.5" /> Improve
                                                </button>
                                              </div>
                                              <input
                                                type="text"
                                                value={q.question || ''}
                                                onChange={(e) => handleFieldChange(`units.${uIdx}.screens.${sIdx}.questions.${qIdx}.question`, e.target.value)}
                                                className="input-field text-sm"
                                                placeholder="Question"
                                              />
                                              {validationErrors[`units.${uIdx}.screens.${sIdx}.questions.${qIdx}.question`] && (
                                                <p className="text-red-500 text-xs mt-1">{validationErrors[`units.${uIdx}.screens.${sIdx}.questions.${qIdx}.question`]}</p>
                                              )}
                                            </div>

                                            {/* Options (for MCQ) */}
                                            {q.type === 'mcq' && (
                                              <div className="mb-3">
                                                <label className="text-xs text-gray-600 mb-1 block">Options</label>
                                                <div className="grid grid-cols-2 gap-2">
                                                  {q.options?.map((opt, optIdx) => (
                                                    <input
                                                      key={optIdx}
                                                      type="text"
                                                      value={opt}
                                                      onChange={(e) => {
                                                        const newOptions = [...q.options];
                                                        newOptions[optIdx] = e.target.value;
                                                        handleFieldChange(`units.${uIdx}.screens.${sIdx}.questions.${qIdx}.options`, newOptions);
                                                      }}
                                                      className="input-field text-sm"
                                                      placeholder={`Option ${String.fromCharCode(65 + optIdx)}`}
                                                    />
                                                  ))}
                                                </div>
                                              </div>
                                            )}

                                            {/* Correct Answer */}
                                            <div className="mb-3">
                                              <label className="text-xs text-gray-600 mb-1 block">Correct Answer</label>
                                              <input
                                                type="text"
                                                value={q.correctAnswer || ''}
                                                onChange={(e) => handleFieldChange(`units.${uIdx}.screens.${sIdx}.questions.${qIdx}.correctAnswer`, e.target.value)}
                                                className="input-field text-sm"
                                                placeholder="Correct answer"
                                              />
                                              {validationErrors[`units.${uIdx}.screens.${sIdx}.questions.${qIdx}.correctAnswer`] && (
                                                <p className="text-red-500 text-xs mt-1">{validationErrors[`units.${uIdx}.screens.${sIdx}.questions.${qIdx}.correctAnswer`]}</p>
                                              )}
                                            </div>

                                            {/* Explanation with AI */}
                                            <div className="mb-3">
                                              <div className="flex justify-between items-center mb-1">
                                                <label className="text-xs text-gray-600">Explanation</label>
                                                <button
                                                  onClick={() => openAiFeedback('question_explanation', q.explanation, uIdx, sIdx, qIdx)}
                                                  className="text-purple-500 hover:text-purple-700 text-xs flex items-center gap-1"
                                                >
                                                  <Sparkles className="w-2.5 h-2.5" /> Improve
                                                </button>
                                              </div>
                                              <textarea
                                                value={q.explanation || ''}
                                                onChange={(e) => handleFieldChange(`units.${uIdx}.screens.${sIdx}.questions.${qIdx}.explanation`, e.target.value)}
                                                rows="2"
                                                className="input-field text-sm"
                                                placeholder="Explanation of why answer is correct"
                                              />
                                            </div>

                                            {/* XP */}
                                            <div>
                                              <label className="text-xs text-gray-600 mb-1 block">XP Value</label>
                                              <input
                                                type="number"
                                                value={q.xp || 5}
                                                onChange={(e) => handleFieldChange(`units.${uIdx}.screens.${sIdx}.questions.${qIdx}.xp`, parseInt(e.target.value) || 0)}
                                                className="input-field text-sm w-32"
                                                min="0"
                                              />
                                            </div>
                                          </div>
                                        ))}
                                      </div>
                                    </div>
                                  )}
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>

                      {(!unit.screens || unit.screens.length === 0) && (
                        <div className="text-center py-8 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
                          <Layers className="w-12 h-12 text-gray-400 mx-auto mb-2" />
                          <p className="text-gray-500">No screens yet</p>
                          <button
                            onClick={() => {
                              const newScreen = {
                                screenId: `screen-${uIdx + 1}-1`,
                                title: 'New Screen',
                                description: 'Screen description goes here',
                                type: 'content',
                                xp: 5
                              };
                              const updatedUnits = [...course.units];
                              updatedUnits[uIdx].screens = [newScreen];
                              handleFieldChange('units', updatedUnits);
                            }}
                            className="mt-3 text-blue-600 hover:text-blue-700 text-sm flex items-center gap-1 mx-auto"
                          >
                            <Plus className="w-3 h-3" /> Add First Screen
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Tab: Analytics */}
        {activeTab === 'analytics' && (
          <div className="card">
            <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-2">
              <TrendingUp className="w-6 h-6 text-green-500" />
              Course Analytics
            </h2>
            <div className="grid md:grid-cols-2 gap-6">
              <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl p-6">
                <h3 className="font-semibold text-gray-900 mb-4">Engagement Metrics</h3>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Estimated Completion Time:</span>
                    <span className="font-semibold">{course.totalDuration || 45} minutes</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Total XP Available:</span>
                    <span className="font-semibold text-yellow-600">{stats.xp} XP</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Average Screen Duration:</span>
                    <span className="font-semibold">{Math.round((course.totalDuration || 45) / Math.max(stats.screens, 1))} min/screen</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Content-to-Quiz Ratio:</span>
                    <span className="font-semibold">{stats.screens - stats.questions} : {stats.questions}</span>
                  </div>
                </div>
              </div>
              <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-xl p-6">
                <h3 className="font-semibold text-gray-900 mb-4">Content Quality</h3>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Knowledge Checks:</span>
                    <span className="font-semibold">{stats.questions} questions</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Learning Objectives:</span>
                    <span className="font-semibold">{course.learningObjectives?.length || 0} objectives</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Key Takeaways:</span>
                    <span className="font-semibold">{course.units?.reduce((sum, u) => sum + (u.keyTakeaways?.length || 0), 0)} points</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Total Screens:</span>
                    <span className="font-semibold">{stats.screens} screens</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* AI Feedback Modal */}
        {feedbackModalOpen && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <div className="p-6">
                <div className="flex justify-between items-center mb-4">
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-6 h-6 text-purple-600" />
                    <h2 className="text-2xl font-bold text-gray-900">AI Content Improver</h2>
                  </div>
                  <button onClick={() => setFeedbackModalOpen(false)} className="text-gray-400 hover:text-gray-600">
                    <XCircle className="w-6 h-6" />
                  </button>
                </div>

                <div className="mb-4 p-3 bg-purple-50 rounded-lg">
                  <p className="text-sm text-purple-800">
                    <strong>Field:</strong> {selectedField?.type?.replace(/_/g, ' ').toUpperCase()}
                  </p>
                  <p className="text-sm text-purple-800 mt-1">
                    <strong>Current Value:</strong> {typeof selectedField?.data === 'object' ? JSON.stringify(selectedField?.data).substring(0, 100) : selectedField?.data?.substring(0, 100)}
                  </p>
                </div>

                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Your Feedback / Instructions
                  </label>
                  <textarea
                    value={feedbackText}
                    onChange={(e) => setFeedbackText(e.target.value)}
                    rows="4"
                    className="input-field"
                    placeholder="Example: Make it more engaging, add real-world examples, simplify language for beginners..."
                  />
                </div>

                <div className="flex gap-3 mb-4">
                  <button
                    onClick={generateAiSuggestion}
                    disabled={aiImproving || !feedbackText.trim()}
                    className="flex-1 bg-gray-600 hover:bg-gray-700 text-white py-2 rounded-lg flex items-center justify-center gap-2 disabled:opacity-50"
                  >
                    {aiImproving ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Brain className="w-4 h-4" />}
                    Generate Suggestion
                  </button>
                  <button
                    onClick={applyAiImprovement}
                    disabled={feedbackLoading}
                    className="flex-1 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white py-2 rounded-lg flex items-center justify-center gap-2"
                  >
                    {feedbackLoading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                    Apply Improvement
                  </button>
                </div>

                {aiSuggestion && (
                  <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-lg">
                    <div className="flex justify-between items-start mb-2">
                      <h3 className="font-semibold text-green-800 flex items-center gap-2">
                        <Zap className="w-4 h-4" /> AI Suggestion
                      </h3>
                      <button
                        onClick={() => setFeedbackText(aiSuggestion)}
                        className="text-green-600 hover:text-green-700 text-sm flex items-center gap-1"
                      >
                        <Copy className="w-3 h-3" /> Use this
                      </button>
                    </div>
                    <p className="text-green-700 text-sm whitespace-pre-wrap">{aiSuggestion}</p>
                  </div>
                )}

                <div className="p-3 bg-yellow-50 rounded-lg">
                  <p className="text-xs text-yellow-800">
                    💡 <span className="font-semibold">Pro Tip:</span> Be specific about what you want changed. 
                    The AI will preserve the core meaning while enhancing it based on your feedback.
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default CourseReview;