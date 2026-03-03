import React, { useState, useEffect } from 'react';
import { courseAPI } from '../services/api';
import LoadingSpinner from '../components/LoadingSpinner';
import { Trophy, BookOpen, Star, Target, Award, Lock, ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const Achievements = () => {
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalCourses: 0,
    completedCourses: 0,
    totalXP: 0,
    totalScreens: 0
  });
  const navigate = useNavigate();

  useEffect(() => {
    const fetchCourses = async () => {
      try {
        const response = await courseAPI.getAll();
        setCourses(response.data);
        
        // Calculate stats
        const totalCourses = response.data.length;
        const totalXP = response.data.reduce((sum, course) => sum + course.totalXP, 0);
        const totalScreens = response.data.reduce((sum, course) => 
          sum + course.units.reduce((unitSum, unit) => unitSum + unit.screens.length, 0), 0
        );
        
        setStats({
          totalCourses,
          completedCourses: 0,
          totalXP,
          totalScreens
        });
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

  const achievements = [
    {
      id: 1,
      name: 'First Sprint',
      description: 'Complete your first course',
      icon: Trophy,
      completed: false,
      progress: stats.completedCourses >= 1 ? 100 : 0
    },
    {
      id: 2,
      name: 'Quick Learner',
      description: 'Complete 3 courses',
      icon: BookOpen,
      completed: false,
      progress: Math.min((stats.completedCourses / 3) * 100, 100)
    },
    {
      id: 3,
      name: 'Skill Master',
      description: 'Complete all available courses',
      icon: Target,
      completed: false,
      progress: Math.min((stats.completedCourses / stats.totalCourses) * 100, 100)
    },
    // {
    //   id: 4,
    //   name: 'Code Champion',
    //   description: 'Complete 50 coding challenges',
    //   icon: Award,
    //   completed: false,
    //   progress: 0
    // },
    // {
    //   id: 5,
    //   name: 'Quiz Expert',
    //   description: 'Answer 100 questions correctly',
    //   icon: Star,
    //   completed: false,
    //   progress: 0
    // },
    // {
    //   id: 6,
    //   name: 'Knowledge Seeker',
    //   description: 'Spend 10 hours learning',
    //   icon: Lock,
    //   completed: false,
    //   progress: 0
    // }
  ];

  return (
    <div className="min-h-screen bg-gray-50 py-8">
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
        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="card text-center">
            <BookOpen className="w-8 h-8 text-blue-600 mx-auto mb-2" />
            <h3 className="text-lg font-semibold text-gray-900">Total Courses</h3>
            <p className="text-2xl font-bold text-blue-600">{stats.totalCourses}</p>
          </div>
          <div className="card text-center">
            <Target className="w-8 h-8 text-green-600 mx-auto mb-2" />
            <h3 className="text-lg font-semibold text-gray-900">Completed</h3>
            <p className="text-2xl font-bold text-green-600">{stats.completedCourses}</p>
          </div>
          <div className="card text-center">
            <Star className="w-8 h-8 text-yellow-600 mx-auto mb-2" />
            <h3 className="text-lg font-semibold text-gray-900">Total XP</h3>
            <p className="text-2xl font-bold text-yellow-600">{stats.totalXP}</p>
          </div>
          <div className="card text-center">
            <BookOpen className="w-8 h-8 text-purple-600 mx-auto mb-2" />
            <h3 className="text-lg font-semibold text-gray-900">Total Screens</h3>
            <p className="text-2xl font-bold text-purple-600">{stats.totalScreens}</p>
          </div>
        </div>

        {/* Achievements Grid */}
        <div className="card">
          <h2 className="text-3xl font-bold text-gray-900 mb-8 text-center">Your Achievements</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {achievements.map((achievement) => (
              <div
                key={achievement.id}
                className={`border rounded-lg p-6 text-center transition-all duration-300 ${
                  achievement.completed
                    ? 'bg-green-50 border-green-200 shadow-sm'
                    : 'bg-white border-gray-200 hover:shadow-md'
                }`}
              >
                <achievement.icon className={`w-12 h-12 mx-auto mb-4 ${
                  achievement.completed ? 'text-green-600' : 'text-gray-400'
                }`} />
                <h3 className="text-xl font-semibold text-gray-900 mb-2">
                  {achievement.name}
                </h3>
                <p className="text-gray-600 mb-4">{achievement.description}</p>
                
                {achievement.progress > 0 && (
                  <div className="w-full bg-gray-200 rounded-full h-2 mb-2">
                    <div
                      className="bg-blue-600 h-2 rounded-full transition-all duration-500"
                      style={{ width: `${achievement.progress}%` }}
                    ></div>
                  </div>
                )}
                
                <div className="flex items-center justify-center">
                  {achievement.completed ? (
                    <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800">
                      <Target className="w-4 h-4 mr-1" />
                      Completed
                    </span>
                  ) : (
                    <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-yellow-100 text-yellow-800">
                      <Lock className="w-4 h-4 mr-1" />
                      Locked
                    </span>
                  )}
                </div>
                
                {achievement.progress > 0 && !achievement.completed && (
                  <p className="text-sm text-gray-500 mt-2">
                    {Math.round(achievement.progress)}% complete
                  </p>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Recent Activity */}
        <div className="card mt-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Learning Journey</h2>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 bg-blue-50 rounded-lg">
              <div className="flex items-center space-x-3">
                <Trophy className="w-6 h-6 text-blue-600" />
                <div>
                  <p className="font-medium text-gray-900">Started SkillSprint Journey</p>
                  <p className="text-sm text-gray-600">Welcome to SkillSprint!</p>
                </div>
              </div>
              <span className="text-sm text-gray-500">Just now</span>
            </div>
            
            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
              <div className="flex items-center space-x-3">
                <BookOpen className="w-6 h-6 text-gray-600" />
                <div>
                  <p className="font-medium text-gray-900">Explore Courses</p>
                  <p className="text-sm text-gray-600">Browse available courses to start learning</p>
                </div>
              </div>
              <span className="text-sm text-gray-500">Today</span>
            </div>
            
            <div className="text-center py-8">
              <p className="text-gray-500">
                Your learning activities will appear here as you progress through courses
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Achievements;