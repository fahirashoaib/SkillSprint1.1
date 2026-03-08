import React from 'react';

const LoadingSpinner = ({ size = 'md', className = '' }) => {
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-8 h-8',
    lg: 'w-12 h-12'
  };

  return (
    <div className={`animate-spin rounded-full border-b-2 border-primary-500 ${sizeClasses[size]} ${className}`}></div>
  );
};

export const LoadingPage = () => (
  <div className="min-h-screen flex items-center justify-center">
    <LoadingSpinner size="lg" />
  </div>
);

export const LoadingInline = () => (
  <div className="flex justify-center py-8">
    <LoadingSpinner size="md" />
  </div>
);

export const ErrorDisplay = ({ message, onRetry }) => (
  <div className="text-center py-8">
    <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-4 max-w-md mx-auto">
      {message}
    </div>
    {onRetry && (
      <button onClick={onRetry} className="btn-primary">
        Try Again
      </button>
    )}
  </div>
);

export default LoadingSpinner;