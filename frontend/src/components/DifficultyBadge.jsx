import React from 'react';

const DifficultyBadge = ({ level }) => {
  const colors = {
    Beginner: 'bg-green-100 text-green-800',
    Intermediate: 'bg-yellow-100 text-yellow-800',
    Advanced: 'bg-red-100 text-red-800'
  };

  return (
    <span className={`px-3 py-1 rounded-full text-sm font-medium ${colors[level] || colors.Beginner}`}>
      {level}
    </span>
  );
};

export default DifficultyBadge;