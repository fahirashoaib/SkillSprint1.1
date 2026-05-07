import React from 'react';
import { AlertCircle, ArrowRight } from 'lucide-react';

const PrerequisiteWarning = ({ prerequisites, onContinue, onViewPrerequisites }) => {
  const missingCount = prerequisites.requirements.filter(r => !r.met).length;
  
  return (
    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-4">
      <div className="flex items-start gap-3">
        <AlertCircle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
        <div className="flex-1">
          <p className="font-medium text-yellow-800">Prerequisite Recommendation</p>
          <p className="text-sm text-yellow-700 mt-1">
            This course builds on {missingCount} prerequisite{missingCount !== 1 ? 's' : ''} that you haven't completed.
            You may find this course difficult without them.
          </p>
          <div className="flex gap-3 mt-3">
            <button
              onClick={onViewPrerequisites}
              className="text-sm text-yellow-800 hover:text-yellow-900 font-medium"
            >
              View Prerequisites
            </button>
            <button
              onClick={onContinue}
              className="text-sm bg-yellow-600 hover:bg-yellow-700 text-white px-3 py-1 rounded-lg"
            >
              Continue Anyway
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PrerequisiteWarning;