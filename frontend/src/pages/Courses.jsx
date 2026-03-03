import React, { useState, useEffect } from 'react';
import {useNavigate, Link } from 'react-router-dom';
import { courseAPI } from '../services/api';
import LoadingSpinner from '../components/LoadingSpinner';
import { ArrowLeft } from 'lucide-react';

const Courses = () => {
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  useEffect(() => {
    const fetchCourses = async () => {
      try {
        const response = await courseAPI.getAll();
        setCourses(response.data);
      } catch (error) {
        console.error('Error fetching courses:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchCourses();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div className="min-h-screen py-8">
      {/* Back to Courses Button */}
      <div className="mb-4 pb-4 border-b border-gray-200">
        <button
          onClick={() => navigate(`/`)}
          className="flex items-center text-gray-600 hover:text-gray-900 transition-colors text-sm font-medium"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Home
        </button>
      </div>
      <div className="max-w-7xl mx-auto px-4">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Available Courses
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Choose a course to start your learning journey and master new skills
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {courses.map(course => (
            <div key={course._id} className="card hover:shadow-lg transition-shadow duration-300">
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
                <span className="flex items-center">
                  ⏱️ {course.totalDuration} min
                </span>
                <span className="flex items-center">
                  ⭐ {course.totalXP} XP
                </span>
                <span className="flex items-center">
                  📚 {course.category}
                </span>
              </div>

              <p className="text-gray-600 mb-4 line-clamp-2">
                {course.learningObjectives?.[0] || 'Master fundamental concepts through interactive learning'}
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
          ))}
        </div>
      </div>
    </div>
  );
};

export default Courses;