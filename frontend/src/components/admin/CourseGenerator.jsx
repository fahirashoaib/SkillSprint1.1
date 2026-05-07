import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { documentAPI, aiAPI } from '../../services/api';
import axios from 'axios';
import LoadingSpinner from '../LoadingSpinner';
import {
  CheckCircle, XCircle, ArrowLeft, Save, Sparkles, Plus, Trash2,
  ChevronDown, ChevronUp, X, Send, Loader, Edit2, Eye, Maximize2
} from 'lucide-react';

// ─── Full Screen Preview Modal ─────────────────────────────────────────────────
const FullScreenPreviewModal = ({ isOpen, onClose, content, title }) => {
  if (!isOpen) return null;
  
  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl max-w-4xl w-full max-h-[90vh] overflow-auto">
        <div className="sticky top-0 bg-white border-b px-4 py-3 flex justify-between items-center">
          <h3 className="font-bold text-lg">{title}</h3>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="p-4">
          <pre className="text-xs bg-gray-900 text-green-400 p-4 rounded-lg overflow-auto whitespace-pre-wrap font-mono">
            {typeof content === 'object' ? JSON.stringify(content, null, 2) : content}
          </pre>
        </div>
      </div>
    </div>
  );
};

// ─── Expandable Content Card ───────────────────────────────────────────────────
// ─── Expandable Content Card (No JSON, Just Readable Content) ──────────────────
const ExpandableContentCard = ({ screen, screenIndex, unitIndex, onModify, onDelete }) => {
  const [expanded, setExpanded] = useState(false);
  
  const truncateLength = 300;
  const description = screen.description || '';
  const isLong = description.length > truncateLength;
  const displayText = expanded ? description : description.substring(0, truncateLength);
  
  return (
    <div className="border rounded-lg p-3 bg-white hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          {/* Screen Type Badge */}
          <div className="flex items-center gap-2 mb-2">
            <span className={`text-xs px-2 py-0.5 rounded font-medium ${
              screen.type === 'concept-check' 
                ? 'bg-orange-100 text-orange-700' 
                : 'bg-blue-100 text-blue-700'
            }`}>
              {screen.type === 'concept-check' ? '📝 Quiz' : '📖 Content'}
            </span>
            <span className="text-xs text-gray-400">Screen {screenIndex + 1}</span>
            {screen.xp > 0 && (
              <span className="text-xs bg-yellow-100 text-yellow-700 px-1.5 py-0.5 rounded">
                +{screen.xp} XP
              </span>
            )}
          </div>
          
          {/* Screen Title */}
          <h4 className="font-semibold text-gray-900 mb-2">{screen.title || 'Untitled Screen'}</h4>
          
          {/* Full Description (expandable) */}
          {description && (
            <div className="mb-2">
              <div className="text-sm text-gray-700 whitespace-pre-wrap">
                {displayText}
                {isLong && !expanded && '...'}
              </div>
              {isLong && (
                <button 
                  onClick={() => setExpanded(!expanded)}
                  className="text-xs text-purple-600 hover:text-purple-800 mt-1"
                >
                  {expanded ? 'Show less' : 'Show more'}
                </button>
              )}
            </div>
          )}
          
          {/* Questions for Quiz Screens */}
          {screen.type === 'concept-check' && screen.questions && (
            <div className="mt-2 pl-3 border-l-2 border-orange-200">
              <p className="text-xs font-medium text-orange-700 mb-2">
                {screen.questions.length} Question(s):
              </p>
              {screen.questions.map((q, qi) => (
                <div key={qi} className="text-xs text-gray-600 mb-2">
                  <span className="font-medium">Q{qi + 1}:</span> {q.question}
                  {q.options && q.options.length > 0 && (
                    <div className="ml-4 mt-1 text-gray-500">
                      Options: {q.options.join(' | ')}
                    </div>
                  )}
                  <div className="ml-4 text-green-600">
✓ Correct: {q.correctAnswer}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
        
        {/* Action Buttons */}
        <div className="flex gap-1 ml-2 shrink-0">
          <button
            onClick={() => onModify(screenIndex)}
            className="p-1.5 text-purple-500 hover:text-purple-700 rounded hover:bg-purple-50"
            title="Modify with AI"
          >
            <Sparkles className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => onDelete(screenIndex)}
            className="p-1.5 text-red-500 hover:text-red-700 rounded hover:bg-red-50"
            title="Delete Screen"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
};

// ─── Inline feedback panel ─────────────────────────────────────────────────────
const LiveFeedbackPanel = ({ isOpen, onClose, title, onSubmit, loading }) => {
  const [text, setText] = useState('');
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-md p-6">
        <div className="flex justify-between items-center mb-3">
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-purple-600" />
            <h3 className="font-semibold text-gray-900">{title}</h3>
          </div>
          <button onClick={onClose} disabled={loading} className="text-gray-400 hover:text-gray-600">
            <X className="w-5 h-5" />
          </button>
        </div>
        <textarea
          value={text}
          onChange={e => setText(e.target.value)}
          rows={4}
          disabled={loading}
          placeholder="Describe what you want…"
          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-400 resize-none"
        />
        <div className="flex justify-end gap-2 mt-3">
          <button onClick={onClose} disabled={loading} className="btn-secondary text-sm py-1.5 px-3">
            Cancel
          </button>
          <button
            onClick={() => { onSubmit(text); setText(''); }}
            disabled={loading || !text.trim()}
            className="bg-purple-600 hover:bg-purple-700 text-white text-sm px-4 py-1.5 rounded-lg flex items-center gap-2 disabled:opacity-50"
          >
            {loading ? <Loader className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
            {loading ? 'Applying…' : 'Apply'}
          </button>
        </div>
      </div>
    </div>
  );
};

// ─── Unit Management Modal ─────────────────────────────────────────────────────
const UnitManagementModal = ({ isOpen, onClose, units, unitIndex, onAddUnitAtPosition, onModifyUnit, onRegenerateUnit }) => {
  const [actionType, setActionType] = useState('add_before');
  const [instructions, setInstructions] = useState('');
  const [processing, setProcessing] = useState(false);
  const [editTitle, setEditTitle] = useState('');
  const [editDescription, setEditDescription] = useState('');
  
  const currentUnit = unitIndex !== null ? units[unitIndex] : null;
  
  useEffect(() => {
    if (currentUnit) {
      setEditTitle(currentUnit.title || '');
      setEditDescription(currentUnit.description || '');
    }
  }, [currentUnit]);
  
  if (!isOpen || !currentUnit) return null;
  
  const handleSubmit = async () => {
    setProcessing(true);
    try {
      if (actionType === 'add_before') {
        await onAddUnitAtPosition(unitIndex, 'before', instructions);
      } else if (actionType === 'add_after') {
        await onAddUnitAtPosition(unitIndex, 'after', instructions);
      } else if (actionType === 'modify') {
        await onModifyUnit(unitIndex, null, editTitle, editDescription);
      } else if (actionType === 'regenerate') {
        await onRegenerateUnit(unitIndex, instructions);
      }
      onClose();
      setInstructions('');
    } catch (error) {
      alert('Failed: ' + error.message);
    } finally {
      setProcessing(false);
    }
  };
  
  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg p-6">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-xl font-bold text-gray-900 flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-purple-600" />
            Manage Unit: {currentUnit?.title}
          </h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X className="w-5 h-5" />
          </button>
        </div>
        
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Action</label>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
              <button onClick={() => setActionType('add_before')}
                className={`px-3 py-2 rounded-lg text-sm font-medium ${actionType === 'add_before' ? 'bg-blue-600 text-white' : 'bg-gray-100 hover:bg-gray-200'}`}>
                Add Before
              </button>
              <button onClick={() => setActionType('add_after')}
                className={`px-3 py-2 rounded-lg text-sm font-medium ${actionType === 'add_after' ? 'bg-blue-600 text-white' : 'bg-gray-100 hover:bg-gray-200'}`}>
                Add After
              </button>
              <button onClick={() => setActionType('modify')}
                className={`px-3 py-2 rounded-lg text-sm font-medium ${actionType === 'modify' ? 'bg-purple-600 text-white' : 'bg-gray-100 hover:bg-gray-200'}`}>
                Modify
              </button>
              <button onClick={() => setActionType('regenerate')}
                className={`px-3 py-2 rounded-lg text-sm font-medium ${actionType === 'regenerate' ? 'bg-orange-600 text-white' : 'bg-gray-100 hover:bg-gray-200'}`}>
                Regenerate
              </button>
            </div>
          </div>
          
          {(actionType === 'add_before' || actionType === 'add_after') && (
            <>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">New Unit Instructions</label>
                <textarea value={instructions} onChange={(e) => setInstructions(e.target.value)}
                  rows={3} className="input-field text-sm"
                  placeholder="Describe what this new unit should cover..." />
              </div>
              <div className="p-3 bg-yellow-50 rounded-lg">
                <p className="text-xs text-yellow-800">💡 New unit will be added {actionType === 'add_before' ? 'before' : 'after'} "{currentUnit?.title}"</p>
              </div>
            </>
          )}
          
          {actionType === 'modify' && (
            <>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Unit Title</label>
                <input type="text" value={editTitle} onChange={(e) => setEditTitle(e.target.value)}
                  className="input-field text-sm" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
                <textarea value={editDescription} onChange={(e) => setEditDescription(e.target.value)}
                  rows={2} className="input-field text-sm" />
              </div>
            </>
          )}
          
          {actionType === 'regenerate' && (
            <>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Improvement Instructions</label>
                <textarea value={instructions} onChange={(e) => setInstructions(e.target.value)}
                  rows={3} className="input-field text-sm"
                  placeholder="Example: 'Make this unit more focused on agile methodologies'" />
              </div>
              <div className="p-3 bg-yellow-50 rounded-lg">
                <p className="text-xs text-yellow-800">💡 AI will regenerate this unit's title and description based on your feedback</p>
              </div>
            </>
          )}
        </div>
        
        <div className="flex justify-end gap-3 mt-6 pt-4 border-t">
          <button onClick={onClose} className="btn-secondary text-sm py-2 px-4">Cancel</button>
          <button onClick={handleSubmit} disabled={processing || ((actionType === 'add_before' || actionType === 'add_after' || actionType === 'regenerate') && !instructions.trim())}
            className="bg-purple-600 hover:bg-purple-700 text-white py-2 px-4 rounded-lg text-sm font-medium flex items-center gap-2">
            {processing ? <Loader className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
            {processing ? 'Processing...' : (actionType === 'modify' ? 'Save Changes' : 'Apply')}
          </button>
        </div>
      </div>
    </div>
  );
};

// ─── Screen Modification Modal ─────────────────────────────────────────────────
const ScreenModificationModal = ({ isOpen, onClose, unit, unitIndex, unitContent, onAddScreen, onModifyScreen, onDeleteScreen, loading }) => {
  const [modificationType, setModificationType] = useState('add_before');
  const [selectedScreenIndex, setSelectedScreenIndex] = useState(0);
  const [instructions, setInstructions] = useState('');
  const [processing, setProcessing] = useState(false);

  if (!isOpen || !unit) return null;

  const screens = unitContent?.screens || [];

  const handleSubmit = async () => {
    if (modificationType === 'delete') {
      if (!window.confirm(`Delete "${screens[selectedScreenIndex]?.title}"? This cannot be undone.`)) {
        return;
      }
      setProcessing(true);
      try {
        await onDeleteScreen(unitIndex, selectedScreenIndex);
        onClose();
      } catch (error) {
        alert('Failed to delete screen: ' + error.message);
      } finally {
        setProcessing(false);
      }
      return;
    }

    if (!instructions.trim()) {
      alert('Please enter instructions for the AI');
      return;
    }
    
    setProcessing(true);
    try {
      if (modificationType === 'modify') {
        await onModifyScreen(unitIndex, selectedScreenIndex, instructions);
      } else {
        const position = modificationType === 'add_before' ? 'before' : 'after';
        await onAddScreen(unitIndex, selectedScreenIndex, position, instructions);
      }
      onClose();
      setInstructions('');
    } catch (error) {
      alert('Failed: ' + error.message);
    } finally {
      setProcessing(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg p-6">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-xl font-bold text-gray-900 flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-purple-600" />
            Modify Screens: {unit.title}
          </h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Action</label>
            <div className="grid grid-cols-4 gap-2">
              <button onClick={() => setModificationType('add_before')}
                className={`px-2 py-2 rounded-lg text-xs font-medium ${modificationType === 'add_before' ? 'bg-blue-600 text-white' : 'bg-gray-100 hover:bg-gray-200'}`}>
                Add Before
              </button>
              <button onClick={() => setModificationType('add_after')}
                className={`px-2 py-2 rounded-lg text-xs font-medium ${modificationType === 'add_after' ? 'bg-blue-600 text-white' : 'bg-gray-100 hover:bg-gray-200'}`}>
                Add After
              </button>
              <button onClick={() => setModificationType('modify')}
                className={`px-2 py-2 rounded-lg text-xs font-medium ${modificationType === 'modify' ? 'bg-purple-600 text-white' : 'bg-gray-100 hover:bg-gray-200'}`}>
                Modify
              </button>
              <button onClick={() => setModificationType('delete')}
                className={`px-2 py-2 rounded-lg text-xs font-medium ${modificationType === 'delete' ? 'bg-red-600 text-white' : 'bg-gray-100 hover:bg-gray-200'}`}>
                Delete
              </button>
            </div>
          </div>

          {screens.length > 0 && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {modificationType === 'delete' ? 'Screen to Delete' : modificationType === 'modify' ? 'Screen to Modify' : 'Reference Screen'}
              </label>
              <select value={selectedScreenIndex} onChange={(e) => setSelectedScreenIndex(parseInt(e.target.value))}
                className="input-field text-sm">
                {screens.map((screen, idx) => (
                  <option key={idx} value={idx}>{idx + 1}. {screen.title} ({screen.type === 'concept-check' ? 'Quiz' : 'Content'})</option>
                ))}
              </select>
            </div>
          )}

          {modificationType !== 'delete' && screens.length > 0 && (
            <>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {modificationType === 'modify' ? 'Modification Instructions' : 'New Screen Instructions'}
                </label>
                <textarea value={instructions} onChange={(e) => setInstructions(e.target.value)}
                  rows={4} className="input-field text-sm"
                  placeholder={modificationType === 'modify' 
                    ? "Example: 'Make this more beginner-friendly and add an example'"
                    : "Example: 'Add a screen explaining regularization with an example'"} />
              </div>
              <div className="p-3 bg-yellow-50 rounded-lg">
                <p className="text-xs text-yellow-800">💡 The AI will only {modificationType === 'modify' ? 'modify the selected screen' : 'add a new screen'} without affecting others.</p>
              </div>
            </>
          )}

          {modificationType === 'delete' && screens.length > 0 && (
            <div className="p-3 bg-red-50 rounded-lg">
              <p className="text-xs text-red-800">⚠️ This will permanently delete "{screens[selectedScreenIndex]?.title}".</p>
            </div>
          )}
        </div>

        <div className="flex justify-end gap-3 mt-6 pt-4 border-t">
          <button onClick={onClose} className="btn-secondary text-sm py-2 px-4">Cancel</button>
          <button onClick={handleSubmit} disabled={processing || (modificationType !== 'delete' && !instructions.trim()) || screens.length === 0}
            className={`py-2 px-4 rounded-lg text-sm font-medium flex items-center gap-2 ${modificationType === 'delete' ? 'bg-red-600 hover:bg-red-700' : 'bg-purple-600 hover:bg-purple-700'} text-white`}>
            {processing ? <Loader className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
            {processing ? 'Processing...' : (modificationType === 'delete' ? 'Delete' : (modificationType === 'modify' ? 'Modify' : 'Add'))}
          </button>
        </div>
      </div>
    </div>
  );
};

// ─── Main Component ────────────────────────────────────────────────────────────
const StepCourseGenerator = ({ documentId, documentName, onClose }) => {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState('overview');
  const [sessionId, setSessionId] = useState(null);
  const [overview, setOverview] = useState([]);
  const [units, setUnits] = useState([]);
  const [approvedUnits, setApprovedUnits] = useState([]);
  const [currentUnitIndex, setCurrentUnitIndex] = useState(0);
  const [unitContents, setUnitContents] = useState({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [loadingMessage, setLoadingMessage] = useState('');
  const [fullPreviewContent, setFullPreviewContent] = useState(null);
  const [fullPreviewTitle, setFullPreviewTitle] = useState('');
  
  // Modal states
  const [showScreenModal, setShowScreenModal] = useState(false);
  const [showUnitModal, setShowUnitModal] = useState(false);
  const [selectedUnitIndexForEdit, setSelectedUnitIndexForEdit] = useState(null);
  const [feedbackPanel, setFeedbackPanel] = useState({ open: false, type: null, unitIndex: null, screenIndex: null });
  const [feedbackLoading, setFeedbackLoading] = useState(false);
  const [viewFullUnitJson, setViewFullUnitJson] = useState(false);

  // ── Restore existing generation ──────────────────────────────────────────────
  useEffect(() => {
    if (!documentId) return;
    (async () => {
      try {
        const response = await documentAPI.getById(documentId);
        const doc = response.data;
        if (doc.generationStatus === 'not_started' || !doc.generationSessionId) return;

        setSessionId(doc.generationSessionId);
        if (doc.generationProgress?.overview) {
          setOverview(Array.isArray(doc.generationProgress.overview) ? doc.generationProgress.overview : [doc.generationProgress.overview]);
          if (doc.generationProgress?.units?.length > 0) {
            setUnits(doc.generationProgress.units);
            const contentsMap = {};
            if (doc.generationProgress.unitContents) {
              Object.keys(doc.generationProgress.unitContents).forEach(k => {
                if (doc.generationProgress.unitContents[k]) contentsMap[parseInt(k)] = doc.generationProgress.unitContents[k];
              });
            }
            setUnitContents(contentsMap);
            setApprovedUnits(doc.generationProgress.completedUnits || []);
            const next = doc.generationProgress.completedUnits?.length || 0;
            if (next < doc.generationProgress.units.length) {
              setCurrentUnitIndex(next);
              setCurrentStep('unit-content');
            } else if (next === doc.generationProgress.units.length) {
              setCurrentStep('complete');
            }
          }
        }
      } catch (e) { console.error('Restore error:', e); }
    })();
  }, [documentId]);

  const authHeader = () => ({ Authorization: `Bearer ${localStorage.getItem('token')}` });

  const saveToBackend = async () => {
    if (!sessionId) return;
    try {
      await axios.post(`http://localhost:5000/api/ai/step/save-progress/${sessionId}`,
        { title: documentName.replace(/\.[^/.]+$/, ''), category: 'General', difficulty: 'Beginner' },
        { headers: authHeader() });
    } catch (err) { console.warn('Save failed:', err.message); }
  };

  const generateOverview = async () => {
    setLoading(true); setLoadingMessage('Generating overview…'); setError('');
    try {
      const res = await axios.post(`http://localhost:5000/api/ai/step/overview/${documentId}`, {},
        { headers: authHeader(), timeout: 90000 });
      setSessionId(res.data.sessionId);
      setOverview(Array.isArray(res.data.overview) ? res.data.overview : [res.data.overview]);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to generate overview');
    } finally { setLoading(false); setLoadingMessage(''); }
  };

  const generateUnits = async () => {
    setLoading(true); setLoadingMessage('Generating units…'); setError('');
    try {
      const res = await axios.post(`http://localhost:5000/api/ai/step/units/${sessionId}`,
        { overview }, { headers: authHeader(), timeout: 90000 });
      setUnits(res.data.units);
      setApprovedUnits([]);
      setCurrentUnitIndex(0);
      setUnitContents({});
      setCurrentStep('units');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to generate units');
    } finally { setLoading(false); setLoadingMessage(''); }
  };

  const generateUnitContent = async (index, extraInstructions = '') => {
    setLoading(true); setLoadingMessage(`Generating Unit ${index + 1}…`); setError('');
    try {
      const body = { unitTitle: units[index].title, unitDescription: units[index].description };
      if (extraInstructions) body.feedbackInstructions = extraInstructions;
      const res = await axios.post(`http://localhost:5000/api/ai/step/unit-content/${sessionId}/${index}`,
        body, { headers: authHeader(), timeout: 120000 });
      setUnitContents(prev => ({ ...prev, [index]: res.data.unit }));
      await saveToBackend();
    } catch (err) {
      setError(`Failed to generate unit: ${err.response?.data?.message || err.message}`);
    } finally { setLoading(false); setLoadingMessage(''); }
  };

  // ── Unit Management Functions ────────────────────────────────────────────────
  const addUnitAtPosition = async (referenceIndex, position, instructions) => {
    setLoading(true);
    try {
      const res = await aiAPI.modifyGeneration('add_unit', { 
        instructions: instructions || `Create a new unit related to the course`,
        referenceUnitIndex: referenceIndex,
        position: position
      });
      if (res.data?.unit) {
        const newUnits = [...units];
        const insertIndex = position === 'before' ? referenceIndex : referenceIndex + 1;
        newUnits.splice(insertIndex, 0, res.data.unit);
        setUnits(newUnits);
        await saveToBackend();
      }
    } catch (err) {
      setError('Failed to add unit at position');
    } finally {
      setLoading(false);
    }
  };

  const modifyUnit = async (index, instructions, newTitle = null, newDescription = null) => {
    if (newTitle !== null || newDescription !== null) {
      const updated = [...units];
      if (newTitle !== null) updated[index] = { ...updated[index], title: newTitle };
      if (newDescription !== null) updated[index] = { ...updated[index], description: newDescription };
      setUnits(updated);
      await saveToBackend();
    }
  };

  const regenerateUnit = async (index, instructions) => {
    setLoading(true);
    try {
      const res = await aiAPI.modifyGeneration('regenerate_unit', {
        unitTitle: units[index].title,
        unitDescription: units[index].description,
        instructions: instructions
      });
      if (res.data?.unit) {
        const updated = [...units];
        updated[index] = res.data.unit;
        setUnits(updated);
        await saveToBackend();
      }
    } catch (err) {
      setError('Failed to regenerate unit');
    } finally {
      setLoading(false);
    }
  };

  // ── Screen Modification Functions ────────────────────────────────────────────
  const addScreenToUnit = async (unitIndex, referenceIndex, position, instructions) => {
    const content = unitContents[unitIndex];
    if (!content?.screens) throw new Error('Generate unit content first');
    
    setLoading(true);
    try {
      const res = await aiAPI.modifyGeneration('add_screen', {
        unitTitle: units[unitIndex].title,
        screenType: 'content',
        instructions: instructions,
        position: position,
        referenceScreenIndex: referenceIndex,
      });
      
      if (res.data?.screen) {
        const newScreens = [...content.screens];
        const insertIndex = position === 'before' ? referenceIndex : referenceIndex + 1;
        newScreens.splice(insertIndex, 0, res.data.screen);
        setUnitContents(prev => ({ ...prev, [unitIndex]: { ...content, screens: newScreens } }));
        await saveToBackend();
      }
    } finally {
      setLoading(false);
    }
  };

  const modifyScreenInUnit = async (unitIndex, screenIndex, instructions) => {
    const content = unitContents[unitIndex];
    if (!content?.screens) throw new Error('Unit content not found');
    
    setLoading(true);
    try {
      const res = await aiAPI.modifyGeneration('modify_screen', {
        unitTitle: units[unitIndex].title,
        screenIndex: screenIndex,
        instructions: instructions,
        currentScreen: content.screens[screenIndex]
      });
      
      if (res.data?.screen) {
        const newScreens = [...content.screens];
        newScreens[screenIndex] = res.data.screen;
        setUnitContents(prev => ({ ...prev, [unitIndex]: { ...content, screens: newScreens } }));
        await saveToBackend();
      }
    } finally {
      setLoading(false);
    }
  };

  const deleteScreenFromUnit = async (unitIndex, screenIndex) => {
    const content = unitContents[unitIndex];
    if (!content?.screens) throw new Error('Unit content not found');
    
    const newScreens = [...content.screens];
    newScreens.splice(screenIndex, 1);
    setUnitContents(prev => ({ ...prev, [unitIndex]: { ...content, screens: newScreens } }));
    await saveToBackend();
  };

  // ── Other Functions ──────────────────────────────────────────────────────────
  const approveOverview = async () => { await generateUnits(); };
  
  const approveUnit = (idx) => {
    setApprovedUnits(prev => [...prev, idx]);
    if (idx < units.length - 1) setCurrentUnitIndex(idx + 1);
    else setCurrentStep('complete');
  };

  const updateUnitTitle = (idx, title) => {
    const updated = [...units];
    updated[idx] = { ...updated[idx], title };
    setUnits(updated);
  };

  const updateUnitDescription = (idx, desc) => {
    const updated = [...units];
    updated[idx] = { ...updated[idx], description: desc };
    setUnits(updated);
  };

  const removeUnit = (idx) => {
    setUnits(prev => prev.filter((_, i) => i !== idx));
    const newContents = {};
    Object.keys(unitContents).forEach(k => {
      const ki = parseInt(k);
      if (ki < idx) newContents[ki] = unitContents[k];
      else if (ki > idx) newContents[ki - 1] = unitContents[k];
    });
    setUnitContents(newContents);
    setApprovedUnits(prev => prev.filter(i => i !== idx).map(i => i > idx ? i - 1 : i));
    if (currentUnitIndex >= idx && currentUnitIndex > 0) setCurrentUnitIndex(i => i - 1);
  };

  const addNewUnit = async (instructions) => {
    try {
      const res = await aiAPI.modifyGeneration('add_unit', { instructions });
      if (res.data?.unit) setUnits(prev => [...prev, res.data.unit]);
    } catch (err) {
      setError('Failed to add unit');
    }
  };

  const regenerateOverviewWithFeedback = async (instructions) => {
    setLoading(true);
    try {
      const res = await axios.post(`http://localhost:5000/api/ai/step/overview/${documentId}`,
        { feedbackInstructions: instructions }, { headers: authHeader(), timeout: 90000 });
      setOverview(Array.isArray(res.data.overview) ? res.data.overview : [res.data.overview]);
    } catch (err) {
      setError('Failed to regenerate overview');
    } finally {
      setLoading(false);
    }
  };

  const openFeedback = (type, unitIndex = null, screenIndex = null) => {
    setFeedbackPanel({ open: true, type, unitIndex, screenIndex });
  };

  const handleFeedbackSubmit = async (text) => {
    const { type, unitIndex, screenIndex } = feedbackPanel;
    setFeedbackLoading(true);
    try {
      if (type === 'regenerate_unit') {
        await generateUnitContent(unitIndex, text);
      } else if (type === 'add_unit') {
        await addNewUnit(text);
      } else if (type === 'regenerate_overview') {
        await regenerateOverviewWithFeedback(text);
      } else if (type === 'modify_screen') {
        await modifyScreenInUnit(unitIndex, screenIndex, text);
      }
      setFeedbackPanel({ open: false, type: null, unitIndex: null, screenIndex: null });
    } catch (err) {
      setError('Feedback action failed');
    } finally {
      setFeedbackLoading(false);
    }
  };

  const saveCourse = async () => {
    setLoading(true);
    try {
      const res = await axios.post(`http://localhost:5000/api/ai/step/save/${sessionId}`,
        { title: documentName.replace(/\.[^/.]+$/, ''), category: 'General', difficulty: 'Beginner' },
        { headers: authHeader() });
      if (onClose) onClose();
      navigate(`/admin/review-course/${res.data.courseId}`);
    } catch (err) {
      setError('Failed to save course');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveDraft = async () => {
    if (!sessionId) { alert('No session'); return; }
    setLoading(true);
    try {
      const res = await axios.post(`http://localhost:5000/api/ai/step/save-progress/${sessionId}`,
        { title: documentName.replace(/\.[^/.]+$/, ''), category: 'General', difficulty: 'Beginner' },
        { headers: authHeader() });
      if (onClose) onClose();
      navigate(`/admin/review-course/${res.data.courseId}`);
    } catch (err) {
      setError('Failed to save draft');
    } finally {
      setLoading(false);
    }
  };

  const handleBack = () => {
    if (currentStep === 'overview') onClose();
    else if (currentStep === 'units') setCurrentStep('overview');
    else if (currentStep === 'unit-content') {
      if (currentUnitIndex > 0) setCurrentUnitIndex(i => i - 1);
      else setCurrentStep('units');
    } else if (currentStep === 'complete') {
      setCurrentStep('unit-content');
      setCurrentUnitIndex(units.length - 1);
    }
  };

  const ActionBar = () => (
    <div className="flex justify-between items-center mt-6 pt-4 border-t">
      <button onClick={handleBack} disabled={loading} className="btn-secondary flex items-center text-sm">
        <ArrowLeft className="w-4 h-4 mr-1" /> Back
      </button>
      <div className="flex gap-2">
        <button onClick={handleSaveDraft} disabled={loading || !sessionId}
          className="bg-purple-600 hover:bg-purple-700 text-white text-sm px-3 py-1.5 rounded-lg flex items-center gap-1">
          <Save className="w-4 h-4" /> Save Draft
        </button>
        <button onClick={() => { if (window.confirm('Cancel?')) onClose(); }} disabled={loading}
          className="btn-secondary text-sm py-1.5 px-3">Cancel</button>
      </div>
    </div>
  );

  // ── Render Steps ──────────────────────────────────────────────────────────────
  const renderStep = () => {
    if (currentStep === 'overview') {
      return (
        <div className="space-y-5">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 flex justify-between">
            <div><h3 className="font-semibold text-blue-800">Step 1 — Course Overview</h3></div>
            <button onClick={() => openFeedback('regenerate_overview')} className="flex items-center gap-1 bg-purple-100 text-purple-700 text-sm px-3 py-1.5 rounded-lg">
              <Sparkles className="w-4 h-4" /> Improve with AI
            </button>
          </div>
          {!overview.length ? (
            <button onClick={generateOverview} className="btn-primary">Generate Overview</button>
          ) : (
            <div className="space-y-4">
              <div className="border rounded-lg p-4 bg-gray-50">
                <h4 className="font-medium mb-3">Learning Objectives</h4>
                {overview.map((obj, i) => (
                  <div key={i} className="flex items-center gap-2 mb-2">
                    <span className="text-blue-500">✓</span>
                    <input value={obj} onChange={e => {
                      const updated = [...overview];
                      updated[i] = e.target.value;
                      setOverview(updated);
                    }} className="flex-1 px-2 py-1 border rounded text-sm" />
                  </div>
                ))}
              </div>
              <button onClick={approveOverview} className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg flex items-center gap-2">
                <CheckCircle className="w-4 h-4" /> Approve & Continue
              </button>
            </div>
          )}
          <ActionBar />
        </div>
      );
    }

    if (currentStep === 'units') {
      return (
        <div className="space-y-5">
          <div className="bg-green-50 border border-green-200 rounded-lg p-4 flex justify-between">
            <div><h3 className="font-semibold text-green-800">Step 2 — Review Units</h3></div>
            <button onClick={() => openFeedback('add_unit')} className="flex items-center gap-1 bg-purple-100 text-purple-700 text-sm px-3 py-1.5 rounded-lg">
              <Plus className="w-4 h-4" /> Add Unit (at end)
            </button>
          </div>
          {units.map((unit, i) => (
            <div key={i} className="border rounded-lg p-3">
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <input value={unit.title} onChange={e => updateUnitTitle(i, e.target.value)} 
                    className="font-medium w-full text-sm mb-1 border-b focus:border-blue-400 outline-none" />
                  <input value={unit.description} onChange={e => updateUnitDescription(i, e.target.value)} 
                    className="text-xs text-gray-500 w-full border-b focus:border-blue-400 outline-none" />
                </div>
                <div className="flex items-center gap-1 shrink-0 ml-2">
                  <button
                    onClick={() => {
                      setSelectedUnitIndexForEdit(i);
                      setShowUnitModal(true);
                    }}
                    className="text-purple-500 hover:text-purple-600 p-1"
                    title="Manage this unit"
                  >
                    <Sparkles className="w-4 h-4" />
                  </button>
                  <button onClick={() => removeUnit(i)} className="text-red-400 hover:text-red-600 p-1">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
          <button onClick={() => { setCurrentStep('unit-content'); setCurrentUnitIndex(0); }} className="btn-primary">
            Generate Content →
          </button>
          <ActionBar />
        </div>
      );
    }

    if (currentStep === 'unit-content') {
      const unit = units[currentUnitIndex];
      const content = unitContents[currentUnitIndex];
      return (
        <div className="space-y-5">
          <div className="bg-purple-50 border border-purple-200 rounded-lg p-4 flex justify-between items-start">
            <div>
              <h3 className="font-semibold text-purple-800">Unit {currentUnitIndex + 1} of {units.length}</h3>
              <p className="text-sm font-medium text-purple-700 mt-1">{unit?.title}</p>
              {content && (
                <p className="text-xs text-gray-500 mt-1">{content.screens?.length || 0} screens generated</p>
              )}
            </div>
            <div className="flex gap-2">
              <button onClick={() => openFeedback('regenerate_unit', currentUnitIndex)} 
                className="flex items-center gap-1 bg-purple-100 hover:bg-purple-200 text-purple-700 text-sm px-3 py-1.5 rounded-lg">
                <Sparkles className="w-4 h-4" /> {content ? 'Redo with feedback' : 'Add instructions'}
              </button>
            </div>
          </div>
          
          {!content ? (
            <button onClick={() => generateUnitContent(currentUnitIndex)} className="btn-primary">Generate Unit</button>
          ) : (
            <>
              <div className="border rounded-lg overflow-hidden">
                <div className="bg-gray-100 px-4 py-2 border-b flex justify-between items-center">
                  <span className="text-sm font-medium">📋 Screens ({content.screens?.length})</span>
                  <button
                    onClick={() => setShowScreenModal(true)}
                    className="bg-purple-600 hover:bg-purple-700 text-white text-xs px-2 py-1 rounded flex items-center gap-1"
                  >
                    <Plus className="w-3 h-3" /> Add Screen
                  </button>
                </div>
                <div className="p-3 space-y-3 max-h-96 overflow-y-auto">
                  {content.screens?.map((screen, si) => (
                    <ExpandableContentCard
                      key={si}
                      screen={screen}
                      screenIndex={si}
                      unitIndex={currentUnitIndex}
                      onModify={(idx) => openFeedback('modify_screen', currentUnitIndex, idx)}
                      onDelete={deleteScreenFromUnit}
                      onViewFull={(screenData) => {
                        setFullPreviewContent(screenData);
                        setFullPreviewTitle(`Screen: ${screenData.title}`);
                        setViewFullUnitJson(true);
                      }}
                    />
                  ))}
                  {(!content.screens || content.screens.length === 0) && (
                    <div className="text-center py-8 text-gray-500">
                      No screens yet. Click "Add Screen" to create one.
                    </div>
                  )}
                </div>
              </div>
              
              <div className="flex gap-2 flex-wrap">
                <button onClick={() => approveUnit(currentUnitIndex)} className="bg-green-600 text-white px-4 py-2 rounded-lg flex items-center gap-2">
                  <CheckCircle className="w-4 h-4" /> Approve Unit
                </button>
              </div>
            </>
          )}
          
          <div className="space-y-1">
            <div className="flex justify-between text-xs">
              <span>{approvedUnits.length}/{units.length} approved</span>
              <span>{Math.round((approvedUnits.length / units.length) * 100)}%</span>
            </div>
            <div className="w-full h-2 bg-gray-200 rounded-full">
              <div className="h-2 bg-green-500 rounded-full transition-all" style={{ width: `${(approvedUnits.length / units.length) * 100}%` }} />
            </div>
          </div>
          <ActionBar />
        </div>
      );
    }

    if (currentStep === 'complete') {
      return (
        <div className="space-y-5">
          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <h3 className="font-semibold text-green-800">All Units Approved!</h3>
            <p className="text-sm text-green-600 mt-1">Your course is ready to save and review.</p>
          </div>
          <div className="border rounded-lg p-4 bg-white text-sm space-y-1">
            <p>✓ {overview.length} learning objectives</p>
            <p>✓ {units.length} units created</p>
            <p>✓ {Object.keys(unitContents).length} units with content</p>
          </div>
          <button onClick={saveCourse} className="btn-primary flex items-center gap-2">
            <Save className="w-4 h-4" /> Save & Review Course
          </button>
          <ActionBar />
        </div>
      );
    }
  };

  return (
    <div className="card">
      {loading && (
        <div className="mb-4 flex items-center gap-3 rounded-lg border border-blue-200 bg-blue-50 px-4 py-3">
          <LoadingSpinner size="sm" />
          <span className="text-sm font-medium">{loadingMessage}</span>
        </div>
      )}
      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-red-800 text-sm font-medium">Error: {error}</p>
          {error.includes('expired') && (
            <button onClick={() => onClose()} className="mt-2 text-xs bg-red-100 hover:bg-red-200 text-red-800 px-3 py-1 rounded">
              Close Window
            </button>
          )}
        </div>
      )}
      {renderStep()}
      
      {/* Live Feedback Modal */}
      <LiveFeedbackPanel isOpen={feedbackPanel.open} loading={feedbackLoading}
        title={feedbackPanel.type === 'add_unit' ? 'Add a New Unit' : 
               feedbackPanel.type === 'regenerate_unit' ? `Regenerate: ${units[feedbackPanel.unitIndex]?.title}` :
               feedbackPanel.type === 'modify_screen' ? `Modify Screen` : 'AI Instructions'}
        onClose={() => setFeedbackPanel({ open: false, type: null, unitIndex: null, screenIndex: null })}
        onSubmit={handleFeedbackSubmit} />
      
      {/* Screen Modification Modal */}
      <ScreenModificationModal isOpen={showScreenModal}
        onClose={() => { setShowScreenModal(false); }}
        unit={units[currentUnitIndex]} unitIndex={currentUnitIndex}
        unitContent={unitContents[currentUnitIndex]}
        onAddScreen={addScreenToUnit} onModifyScreen={modifyScreenInUnit} onDeleteScreen={deleteScreenFromUnit} loading={loading} />
      
      {/* Unit Management Modal */}
      <UnitManagementModal
        isOpen={showUnitModal}
        onClose={() => { setShowUnitModal(false); setSelectedUnitIndexForEdit(null); }}
        units={units}
        unitIndex={selectedUnitIndexForEdit}
        onAddUnitAtPosition={addUnitAtPosition}
        onModifyUnit={modifyUnit}
        onRegenerateUnit={regenerateUnit}
      />
      
      {/* Full JSON Preview Modal */}
      <FullScreenPreviewModal
        isOpen={viewFullUnitJson}
        onClose={() => { setViewFullUnitJson(false); setFullPreviewContent(null); }}
        content={fullPreviewContent}
        title={fullPreviewTitle}
      />
    </div>
  );
};

export default StepCourseGenerator;