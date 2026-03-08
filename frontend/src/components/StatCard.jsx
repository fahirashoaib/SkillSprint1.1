import React from 'react';

const StatCard = ({ icon: Icon, title, value, color = 'blue', subtitle }) => {
  const colorClasses = {
    blue: 'text-blue-600 bg-blue-50',
    green: 'text-green-600 bg-green-50',
    purple: 'text-purple-600 bg-purple-50',
    yellow: 'text-yellow-600 bg-yellow-50',
    orange: 'text-orange-600 bg-orange-50',
    red: 'text-red-600 bg-red-50'
  };

  return (
    <div className="card text-center">
      <div className={`w-12 h-12 ${colorClasses[color]} rounded-lg flex items-center justify-center mx-auto mb-3`}>
        <Icon className={`w-6 h-6`} />
      </div>
      <h3 className="text-lg font-semibold text-gray-900 mb-1">{title}</h3>
      <p className={`text-2xl font-bold text-${color}-600`}>{value}</p>
      {subtitle && <p className="text-sm text-gray-500 mt-1">{subtitle}</p>}
    </div>
  );
};

export default StatCard;