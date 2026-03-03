import React from 'react';
import { Link } from 'react-router-dom';

const Navbar = () => {
  return (
    
    <nav className="bg-white shadow-lg border-b">
      
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex justify-between items-center h-16">
          <Link to="/" className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-primary-600 rounded-lg"></div>
            <span className="text-xl font-bold text-gray-900">LearnHub</span>
          </Link>
          
          <div className="flex items-center space-x-4">
            <Link to="/courses" className="text-gray-700 hover:text-primary-600 font-medium">
              Courses
            </Link>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;