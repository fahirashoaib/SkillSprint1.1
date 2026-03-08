import React, { useState, useEffect } from 'react';
import { courseAPI } from '../services/api';
import { LoadingPage } from '../components/LoadingSpinner';
import StatCard from '../components/StatCard';
import BackButton from '../components/BackButton';
import ProgressBar from '../components/ProgressBar';
import { Trophy, BookOpen, Star, Target, Award, Lock } from 'lucide-react';

const Achievements = () => {
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalCourses: 0,
    completedCourses: 0,
    totalXP: 0,
    totalScreens: 0
  });

  useEffect(() => {
    const fetchCourses = async () => {
      try {
        const response = await courseAPI.getAll();
        setCourses(response.data);
        
        const totalCourses = response.data.length;
        const totalXP = response.data.reduce((sum, course) => sum + course.totalXP, 0);
        const totalScreens = response.data.reduce((sum, course) => 
          sum + course.units.reduce((unitSum, unit) => unitSum + unit.screens.length, 0), 0
        );
        
        setStats({
          totalCourses,
          completedCourses: 0, // This would come from user data
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

  if (loading) return <LoadingPage />;

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
    }
  ];

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      
      <div className="max-w-7xl mx-auto px-4">
        {/* Stats Overview - USING STATCARD */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <StatCard 
            icon={BookOpen}
            title="Total Courses"
            value={stats.totalCourses}
            color="blue"
          />
          <StatCard 
            icon={Target}
            title="Completed"
            value={stats.completedCourses}
            color="green"
          />
          <StatCard 
            icon={Star}
            title="Total XP"
            value={stats.totalXP}
            color="yellow"
          />
          <StatCard 
            icon={BookOpen}
            title="Total Screens"
            value={stats.totalScreens}
            color="purple"
          />
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
                  <ProgressBar 
                    progress={achievement.progress} 
                    size="sm"
                    color="blue"
                    showLabel={false}
                  />
                )}
                
                <div className="flex items-center justify-center mt-4">
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