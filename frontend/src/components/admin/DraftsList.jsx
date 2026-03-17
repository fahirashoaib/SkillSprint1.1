import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { aiAPI } from '../../services/api';
import LoadingSpinner from '../LoadingSpinner';
import { FileText, Eye, Edit, Trash2, Calendar, User } from 'lucide-react';

const DraftsList = () => {
  const [drafts, setDrafts] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    loadDrafts();
  }, []);

  const loadDrafts = async () => {
    setLoading(true);
    try {
      const response = await aiAPI.getDrafts();
      setDrafts(response.data);
    } catch (error) {
      console.error('Failed to load drafts:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (courseId, title) => {
    if (!window.confirm(`Delete draft "${title}"?`)) return;
    
    try {
      await aiAPI.deleteDraft(courseId);
      loadDrafts();
    } catch (error) {
      console.error('Delete error:', error);
    }
  };

  if (loading) return <LoadingSpinner />;

  return (
    <div className="card">
      <h2 className="text-2xl font-bold text-gray-900 mb-6">Course Drafts</h2>
      
      {drafts.length === 0 ? (
        <div className="text-center py-12">
          <FileText className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-600">No drafts yet</p>
          <p className="text-sm text-gray-500 mt-2">
            Upload and process a document to generate a course
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {drafts.map(draft => (
            <div key={draft._id} className="border border-gray-200 rounded-lg p-4 hover:border-blue-300">
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="font-semibold text-gray-900">{draft.title}</h3>
                  <div className="flex items-center space-x-4 mt-2 text-sm text-gray-500">
                    <span className="flex items-center">
                      <Calendar className="w-4 h-4 mr-1" />
                      {new Date(draft.createdAt).toLocaleDateString()}
                    </span>
                    {draft.generatedBy && (
                      <span className="flex items-center">
                        <User className="w-4 h-4 mr-1" />
                        {draft.generatedBy.username}
                      </span>
                    )}
                  </div>
                </div>
                <div className="flex space-x-2">
                  <button
                    onClick={() => navigate(`/admin/review-course/${draft._id}`)}
                    className="p-2 text-blue-600 hover:bg-blue-50 rounded"
                    title="Review"
                  >
                    <Eye className="w-5 h-5" />
                  </button>
                  <button
                    onClick={() => handleDelete(draft._id, draft.title)}
                    className="p-2 text-red-600 hover:bg-red-50 rounded"
                    title="Delete"
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default DraftsList;