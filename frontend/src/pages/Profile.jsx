import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { userAPI } from '../services/api';
import { LoadingPage } from '../components/LoadingSpinner';
import StatCard from '../components/StatCard';
import BackButton from '../components/BackButton';
import { User, Mail, Award, BookOpen, Calendar, Shield, Settings } from 'lucide-react';

const Profile = () => {
  const { user, isAdmin } = useAuth();
  const [profileData, setProfileData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Redirect admin
  if (isAdmin()) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center py-8">
        <div className="max-w-md w-full text-center">
          <div className="card">
            <Settings className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Admin Account</h2>
            <p className="text-gray-600 mb-6">
              Administrators use the Admin Dashboard for platform management.
            </p>
            <a href="/admin" className="btn-primary inline-block">
              Go to Admin Dashboard
            </a>
          </div>
        </div>
      </div>
    );
  }

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const response = await userAPI.getProfile(user.id);
        setProfileData(response.data);
      } catch (error) {
        console.error('Error fetching profile:', error);
        setError('Failed to load profile data');
      } finally {
        setLoading(false);
      }
    };

    if (user?.id) {
      fetchProfile();
    }
  }, [user]);

  if (loading) return <LoadingPage />;

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-4">
            {error}
          </div>
          <button onClick={() => window.location.reload()} className="btn-primary">
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      
      <div className="max-w-4xl mx-auto px-4">
        {/* Profile Header */}
        <div className="card mb-8">
          <div className="flex items-center space-x-6">
            <div className="w-24 h-24 bg-gradient-to-r from-blue-600 to-purple-600 rounded-full flex items-center justify-center">
              <User className="w-12 h-12 text-white" />
            </div>
            <div className="flex-1">
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                {profileData?.username || user?.username}
              </h1>
              <div className="flex items-center space-x-4 text-gray-600">
                <span className="flex items-center">
                  <Mail className="w-4 h-4 mr-2" />
                  {profileData?.email || user?.email}
                </span>
                <span className="flex items-center">
                  <Shield className="w-4 h-4 mr-2" />
                  Learner
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Stats Grid - USING STATCARD */}
        <div className="grid md:grid-cols-3 gap-6 mb-8">
          <StatCard 
            icon={Award}
            title="Total XP"
            value={profileData?.xp || 0}
            color="yellow"
          />
          <StatCard 
            icon={BookOpen}
            title="Courses Completed"
            value={profileData?.completedCourses?.length || 0}
            color="blue"
          />
          <StatCard 
            icon={Calendar}
            title="Member Since"
            value={profileData?.createdAt
              ? new Date(profileData.createdAt).toLocaleDateString()
              : 'N/A'
            }
            color="green"
          />
        </div>

        {/* Completed Courses */}
        <div className="card">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Completed Courses</h2>
          {profileData?.completedCourses && profileData.completedCourses.length > 0 ? (
            <div className="space-y-4">
              {profileData.completedCourses.map((course, index) => (
                <div key={index} className="flex items-center justify-between p-4 bg-green-50 rounded-lg border border-green-200">
                  <div className="flex items-center space-x-3">
                    <BookOpen className="w-6 h-6 text-green-600" />
                    <div>
                      <p className="font-medium text-gray-900">
                        {course.courseId?.title || 'Course'}
                      </p>
                      <p className="text-sm text-gray-600">
                        Completed on {new Date(course.completedAt).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  <Award className="w-6 h-6 text-green-600" />
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <BookOpen className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600 mb-4">No courses completed yet</p>
              <a href="/courses" className="btn-primary inline-block">
                Browse Courses
              </a>
            </div>
          )}
        </div>

        {/* Current Progress */}
        <div className="card mt-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Current Progress</h2>
          {profileData?.currentProgress && profileData.currentProgress.length > 0 ? (
            <div className="space-y-3">
              {profileData.currentProgress.slice(0, 5).map((progress, index) => (
                <div key={index} className="flex items-center justify-between p-4 bg-blue-50 rounded-lg border border-blue-200">
                  <div className="flex items-center space-x-3">
                    <div className={`w-3 h-3 rounded-full ${progress.completed ? 'bg-green-500' : 'bg-yellow-500'}`}></div>
                    <div>
                      <p className="font-medium text-gray-900">
                        {progress.courseId?.title || `Course ${progress.courseId}`}
                      </p>
                      <p className="text-sm text-gray-600">
                        Unit {progress.unitId} • Screen {progress.screenId}
                      </p>
                    </div>
                  </div>
                  <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                    progress.completed ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                  }`}>
                    {progress.completed ? 'Completed' : 'In Progress'}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <p className="text-gray-600">No progress tracked yet</p>
              <p className="text-sm text-gray-500 mt-2">
                Start a course to track your learning progress!
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Profile;