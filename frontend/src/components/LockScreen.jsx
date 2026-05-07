import React from 'react';
import { XCircle, BookOpen, Trophy, FileText, HelpCircle, AlertCircle, ArrowRight } from 'lucide-react';

const LockScreen = ({ course, prerequisites, onClose, onTakeTest, onContinue }) => {
  const getRequirementIcon = (type) => {
    switch(type) {
      case 'course': return <BookOpen className="w-5 h-5" />;
      case 'xp': return <Trophy className="w-5 h-5" />;
      case 'document': return <FileText className="w-5 h-5" />;
      case 'test': return <HelpCircle className="w-5 h-5" />;
      default: return <BookOpen className="w-5 h-5" />;
    }
  };

  const getRequirementText = (req) => {
    switch(req.type) {
      case 'course':
        return `Complete "${req.details?.courseTitle || 'required course'}"`;
      case 'unit':
        return `Complete unit "${req.details?.unitTitle || 'required unit'}"`;
      case 'xp':
        return `Earn ${req.details?.requiredXp || 0} XP (You have ${req.details?.currentXp || 0})`;
      case 'document':
        return `Study ${req.details?.documentsRequired || 0} prerequisite documents`;
      case 'test':
        return `Pass placement test (${req.details?.passingScore || 80}% required)`;
      default:
        return 'Complete prerequisite';
    }
  };

  // ========== SOFT LINK - Show Warning with Continue Button ==========
  if (prerequisites.linkType === 'soft') {
    const missingCount = prerequisites.requirements?.filter(r => !r.met).length || 0;
    
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-xl max-w-md w-full p-6">
          <div className="text-center mb-4">
            <div className="w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-3">
              <AlertCircle className="w-8 h-8 text-yellow-600" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900">Prerequisite Recommendation</h2>
            <p className="text-gray-600 mt-1">This course builds on other concepts</p>
          </div>

          <div className="space-y-3 mb-6">
            <p className="text-sm font-medium text-gray-700">
              You're missing {missingCount} prerequisite{missingCount !== 1 ? 's' : ''}:
            </p>
            {prerequisites.requirements?.map((req, idx) => (
              <div key={idx} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg border border-gray-200">
                <div className="text-gray-400">
                  {getRequirementIcon(req.type)}
                </div>
                <div className="flex-1">
                  <p className="text-sm text-gray-700">{getRequirementText(req)}</p>
                </div>
                {req.met && (
                  <span className="text-green-600 text-sm">✓</span>
                )}
              </div>
            ))}
          </div>

          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-800 py-2 rounded-lg"
            >
              Cancel
            </button>
            <button
              onClick={onContinue}
              className="flex-1 bg-yellow-600 hover:bg-yellow-700 text-white py-2 rounded-lg flex items-center justify-center gap-2"
            >
              Continue Anyway
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ========== HARD LINK - Show Lock Screen (with Test Bypass if available) ==========
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl max-w-md w-full p-6">
        <div className="text-center mb-4">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-3">
            <XCircle className="w-8 h-8 text-red-600" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900">Course Locked</h2>
          <p className="text-gray-600 mt-1">Complete the requirements below to unlock</p>
        </div>

        <div className="space-y-3 mb-6">
          <p className="text-sm font-medium text-gray-700">Requirements:</p>
          {prerequisites.requirements?.map((req, idx) => {
            const isMet = req.met || false;
            return (
              <div key={idx} className={`flex items-center gap-3 p-3 rounded-lg border ${isMet ? 'bg-green-50 border-green-200' : 'bg-gray-50 border-gray-200'}`}>
                <div className={isMet ? 'text-green-600' : 'text-gray-400'}>
                  {getRequirementIcon(req.type)}
                </div>
                <div className="flex-1">
                  <p className={`text-sm ${isMet ? 'text-green-700' : 'text-gray-700'}`}>
                    {getRequirementText(req)}
                  </p>
                </div>
                {isMet && (
                  <span className="text-green-600 text-sm">✓</span>
                )}
              </div>
            );
          })}
        </div>

        {/* Placement Test Bypass Option - Your existing test functionality preserved */}
        {prerequisites.bypassAvailable && !prerequisites.bypassPassed && (
          <button
            onClick={onTakeTest}
            className="w-full bg-purple-600 hover:bg-purple-700 text-white py-2 rounded-lg flex items-center justify-center gap-2 mb-3"
          >
            Take Placement Test
            <ArrowRight className="w-4 h-4" />
          </button>
        )}

        <button
          onClick={onClose}
          className="w-full bg-gray-200 hover:bg-gray-300 text-gray-800 py-2 rounded-lg"
        >
          Back to Course
        </button>
      </div>
    </div>
  );
};

export default LockScreen;