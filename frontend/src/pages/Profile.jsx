import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { userAPI } from '../services/api';
import LoadingSpinner from '../components/LoadingSpinner';
import { User, Mail, Award, BookOpen, Calendar, Shield, Settings, ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const Profile = () => {
  const { user, isAdmin } = useAuth();
  const [profileData, setProfileData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  // Redirect admin to admin dashboard if they somehow reach profile
  if (isAdmin()) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center py-8">
        <div className="max-w-md w-full text-center">
          <div className="card">
            <Settings className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Admin Account</h2>
            <p className="text-gray-600 mb-6">
              Administrators use the Admin Dashboard for platform management and analytics.
            </p>
            <a
              href="/admin"
              className="btn-primary inline-block"
            >
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

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (error) {
    return (

      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-4">
            {error}
          </div>
          <button
            onClick={() => window.location.reload()}
            className="btn-primary"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
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

        {/* Stats Grid */}
        <div className="grid md:grid-cols-3 gap-6 mb-8">
          <div className="card text-center">
            <Award className="w-8 h-8 text-yellow-600 mx-auto mb-2" />
            <h3 className="text-lg font-semibold text-gray-900">Total XP</h3>
            <p className="text-3xl font-bold text-yellow-600">
              {profileData?.xp || 0}
            </p>
          </div>

          <div className="card text-center">
            <BookOpen className="w-8 h-8 text-blue-600 mx-auto mb-2" />
            <h3 className="text-lg font-semibold text-gray-900">Courses Completed</h3>
            <p className="text-3xl font-bold text-blue-600">
              {profileData?.completedCourses?.length || 0}
            </p>
          </div>

          <div className="card text-center">
            <Calendar className="w-8 h-8 text-green-600 mx-auto mb-2" />
            <h3 className="text-lg font-semibold text-gray-900">Member Since</h3>
            <p className="text-lg font-medium text-green-600">
              {profileData?.createdAt
                ? new Date(profileData.createdAt).toLocaleDateString()
                : 'N/A'
              }
            </p>
          </div>
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
                    <div className={`w-3 h-3 rounded-full ${progress.completed ? 'bg-green-500' : 'bg-yellow-500'
                      }`}></div>
                    <div>
                      <p className="font-medium text-gray-900">
                        {progress.courseId?.title || `Course ${progress.courseId}`}
                      </p>
                      <p className="text-sm text-gray-600">
                        Unit {progress.unitId} • Screen {progress.screenId}
                      </p>
                    </div>
                  </div>
                  <span className={`px-2 py-1 text-xs font-medium rounded-full ${progress.completed ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
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

        {/* Learning Statistics */}
        <div className="card mt-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Learning Statistics</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
            <div>
              <p className="text-2xl font-bold text-gray-900">{profileData?.completedCourses?.length || 0}</p>
              <p className="text-sm text-gray-600">Courses Completed</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{profileData?.xp || 0}</p>
              <p className="text-sm text-gray-600">Total XP</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">
                {profileData?.currentProgress?.filter(p => p.completed).length || 0}
              </p>
              <p className="text-sm text-gray-600">Screens Completed</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">
                {profileData?.currentProgress?.filter(p => !p.completed).length || 0}
              </p>
              <p className="text-sm text-gray-600">In Progress</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;