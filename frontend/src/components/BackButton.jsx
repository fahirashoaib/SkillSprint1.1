import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';

const BackButton = ({ to, text = 'Back' }) => {
  const navigate = useNavigate();

  const handleClick = () => {
    if (to) {
      navigate(to);
    } else {
      navigate(-1);
    }
  };

  return (
    <div className="mb-4 pb-4 border-b border-gray-200">
      <button
        onClick={handleClick}
        className="flex items-center text-gray-600 hover:text-gray-900 transition-colors text-sm font-medium"
      >
        <ArrowLeft className="w-4 h-4 mr-2" />
        {text}
      </button>
    </div>
  );
};

export default BackButton;