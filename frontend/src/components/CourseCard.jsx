import React from 'react';
import { Link } from 'react-router-dom';

const CourseCard = ({ course, variant = 'full' }) => {
  // variant can be 'full' (for Courses page) or 'compact' (for AdminDashboard)
  
  if (variant === 'compact') {
    return (
      <div className="border border-gray-200 rounded-lg p-4">
        <h4 className="font-semibold text-gray-900 mb-2">{course.title}</h4>
        <div className="flex justify-between text-sm text-gray-600 mb-3">
          <span>{course.category}</span>
          <span className={`px-2 py-1 text-xs rounded-full ${
            course.difficulty === 'Beginner' ? 'bg-green-100 text-green-800' :
            course.difficulty === 'Intermediate' ? 'bg-yellow-100 text-yellow-800' :
            'bg-red-100 text-red-800'
          }`}>
            {course.difficulty}
          </span>
        </div>
        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span>Completions:</span>
            <span className="font-medium text-green-600">{course.completions || 0}</span>
          </div>
          <div className="flex justify-between">
            <span>In Progress:</span>
            <span className="font-medium text-blue-600">{course.inProgress || 0}</span>
          </div>
        </div>
      </div>
    );
  }

  // Full variant for Courses page
  return (
    <div className="card hover:shadow-lg transition-shadow duration-300">
      <div className="flex justify-between items-start mb-4">
        <h3 className="text-xl font-semibold text-gray-900">{course.title}</h3>
        <span className={`px-3 py-1 rounded-full text-sm font-medium ${
          course.difficulty === 'Beginner' 
            ? 'bg-green-100 text-green-800'
            : 'bg-blue-100 text-blue-800'
        }`}>
          {course.difficulty}
        </span>
      </div>
      
      <div className="flex items-center space-x-4 text-sm text-gray-600 mb-4">
        <span>⏱️ {course.totalDuration} min</span>
        <span>⭐ {course.totalXP} XP</span>
        <span>📚 {course.category}</span>
      </div>

      <p className="text-gray-600 mb-4 line-clamp-2">
        {course.learningObjectives?.[0] || 'Master fundamental concepts'}
      </p>

      <div className="mb-4">
        <h4 className="font-medium text-gray-900 mb-2">You'll learn:</h4>
        <ul className="text-sm text-gray-600 space-y-1">
          {course.learningObjectives?.slice(0, 3).map((objective, index) => (
            <li key={index} className="flex items-center">
              <span className="w-2 h-2 bg-primary-600 rounded-full mr-2"></span>
              {objective}
            </li>
          ))}
        </ul>
      </div>

      <Link 
        to={`/courses/${course._id}`}
        className="w-full btn-primary block text-center"
      >
        View Course
      </Link>
    </div>
  );
};

export default CourseCard;