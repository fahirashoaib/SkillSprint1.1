import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { courseAPI } from '../services/api';
import { LoadingPage } from '../components/LoadingSpinner';
import { Clock, Trophy, BookOpen, ChevronRight, Search } from 'lucide-react';

const Courses = () => {
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

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

  const filteredCourses = courses.filter(course =>
    course.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    course.category?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) return <LoadingPage />;

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4">
        {/* Search Bar */}
        <div className="mb-6 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search courses by title or category..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full max-w-md pl-9 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {/* Course Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredCourses.map(course => (
            <div key={course._id} className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden hover:shadow-lg transition-shadow duration-300 flex flex-col h-full">
              <div className="p-5 flex-1">
                <div className="flex justify-between items-start mb-3">
                  <h3 className="text-xl font-bold text-gray-900 line-clamp-1">{course.title}</h3>
                  <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                    course.difficulty === 'Beginner' ? 'bg-green-100 text-green-700' :
                    course.difficulty === 'Intermediate' ? 'bg-yellow-100 text-yellow-700' :
                    'bg-red-100 text-red-700'
                  }`}>
                    {course.difficulty || 'Beginner'}
                  </span>
                </div>

                <div className="flex flex-wrap gap-3 text-sm text-gray-500 mb-3">
                  <span className="flex items-center gap-1"><Clock className="w-4 h-4" /> {course.totalDuration || 45} min</span>
                  <span className="flex items-center gap-1"><Trophy className="w-4 h-4 text-yellow-500" /> {course.totalXP || 0} XP</span>
                  <span className="flex items-center gap-1"><BookOpen className="w-4 h-4" /> {course.category || 'General'}</span>
                </div>

                <p className="text-gray-600 text-sm mb-4 line-clamp-2">
                  {course.learningObjectives?.[0] || 'Start your learning journey today!'}
                </p>

                {course.learningObjectives && course.learningObjectives.length > 0 && (
                  <div className="mb-4">
                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">What you'll learn:</p>
                    <ul className="space-y-1">
                      {course.learningObjectives.slice(0, 2).map((obj, idx) => (
                        <li key={idx} className="text-xs text-gray-600 flex items-start gap-2">
                          <span className="text-green-500 mt-0.5">✓</span>
                          <span className="line-clamp-1">{obj}</span>
                        </li>
                      ))}
                      {course.learningObjectives.length > 2 && (
                        <li className="text-xs text-gray-400 pl-5">+{course.learningObjectives.length - 2} more</li>
                      )}
                    </ul>
                  </div>
                )}
              </div>

              <div className="border-t border-gray-100 p-4 bg-gray-50">
                <Link
                  to={`/courses/${course._id}`}
                  className="flex items-center justify-between text-gray-900 hover:text-gray-700 font-medium text-sm"
                >
                  View Course Details
                  <ChevronRight className="w-4 h-4" />
                </Link>
              </div>
            </div>
          ))}
        </div>

        {filteredCourses.length === 0 && (
          <div className="text-center py-12">
            <BookOpen className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600">No courses found matching "{searchTerm}"</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Courses;