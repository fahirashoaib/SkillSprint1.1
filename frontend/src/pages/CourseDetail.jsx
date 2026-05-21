import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { courseAPI, userAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { LoadingPage } from '../components/LoadingSpinner';
import { Clock, Trophy, BookOpen, Play, CheckCircle, RefreshCw, ArrowLeft } from 'lucide-react';
import axios from 'axios';
import LockScreen from '../components/LockScreen';

const CourseDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [course, setCourse] = useState(null);
  const [loading, setLoading] = useState(true);
  const [userProgress, setUserProgress] = useState(null);
  const [firstIncompleteScreen, setFirstIncompleteScreen] = useState(null);
  const [completedScreensCount, setCompletedScreensCount] = useState(0);
  const [courseXpEarned, setCourseXpEarned] = useState(0);
  const [totalScreens, setTotalScreens] = useState(0);
  const [showLockScreen, setShowLockScreen] = useState(false);
  const [prerequisiteDetails, setPrerequisiteDetails] = useState(null);

  useEffect(() => {
    const fetchCourse = async () => {
      try {
        const response = await courseAPI.getById(id);
        setCourse(response.data);

        const total = response.data.units.reduce((sum, u) => sum + u.screens.length, 0);
        setTotalScreens(total);

        if (user?.id) {
          const userData = await userAPI.getProfile(user.id);
          setUserProgress(userData.data);

          // Calculate completed screens for this course
          const completed = userData.data.currentProgress?.filter(p => {
            const pCourseId = typeof p.courseId === 'object' ? p.courseId._id : p.courseId;
            return pCourseId === id && p.completed === true;
          }) || [];
          setCompletedScreensCount(completed.length);

          // Calculate XP earned
          const xpEarned = completed.reduce((sum, p) => sum + (p.xpEarned || 0), 0);
          setCourseXpEarned(xpEarned);

          // Find first incomplete screen
          let firstIncomplete = null;
          for (const unit of response.data.units) {
            for (const screen of unit.screens) {
              const isCompleted = completed.some(p =>
                p.screenId === screen.screenId && p.unitId === unit.unitId
              );
              if (!isCompleted) {
                firstIncomplete = { unitId: unit.unitId, screenId: screen.screenId };
                break;
              }
            }
            if (firstIncomplete) break;
          }
          setFirstIncompleteScreen(firstIncomplete);
        }

      } catch (error) {
        console.error('Error fetching course:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchCourse();
  }, [id, user?.id]);

  const progressPercentage = totalScreens > 0 ? Math.round((completedScreensCount / totalScreens) * 100) : 0;
  const hasStarted = completedScreensCount > 0;
  const isCompleted = progressPercentage === 100 && totalScreens > 0;

  const getStartLink = () => {
    if (!user?.id) return `/learn/${course?._id}/${course?.units[0]?.unitId}`;
    if (isCompleted) return `/learn/${course?._id}/${course?.units[0]?.unitId}`;
    if (hasStarted && firstIncompleteScreen) {
      return `/learn/${course?._id}/${firstIncompleteScreen.unitId}/${firstIncompleteScreen.screenId}`;
    }
    return `/learn/${course?._id}/${course?.units[0]?.unitId}`;
  };

  const checkPrerequisites = async () => {
    if (!user?.id) return true; // Not logged in, allow access

    try {
      const response = await axios.get(`/api/prerequisites/check/${course._id}`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });

      if (response.data.allowed) {
        // Proceed to course
        navigate(getStartLink());
      } else {
        // Show lock screen modal
        setShowLockScreen(true);
        setPrerequisiteDetails(response.data);
      }
    } catch (error) {
      console.error('Prerequisite check failed:', error);
      // Fallback: allow access
      navigate(getStartLink());
    }
  };

  // Check prerequisites before starting course
  const handleStartCourse = async () => {
    if (!user?.id) {
      // Not logged in, allow access
      navigate(getStartLink());
      return;
    }

    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`http://localhost:5000/api/prerequisites/check/${course._id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (response.data.allowed) {
        // Prerequisites met, proceed to course
        navigate(getStartLink());
      } else {
        // Show lock screen
        setPrerequisiteDetails(response.data);
        setShowLockScreen(true);
      }
    } catch (error) {
      console.error('Prerequisite check failed:', error);
      // Fallback: allow access
      navigate(getStartLink());
    }
  };

  const getButtonText = () => {
    if (!user?.id) return 'Start Course';
    if (isCompleted) return 'Review Course';
    if (hasStarted) return 'Resume Course';
    return 'Start Course';
  };

  const getButtonIcon = () => {
    if (hasStarted && !isCompleted) return <RefreshCw className="w-5 h-5" />;
    return <Play className="w-5 h-5" />;
  };

  if (loading) return <LoadingPage />;
  if (!course) return <div>Course not found</div>;

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        {/* Simple Back Button - Goes to Courses page */}
        <button
          onClick={() => navigate('/')}
          className="bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded-lg text-sm transition-colors flex items-center gap-2 mb-6"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Home
        </button>

        {/* Course Header */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-3">{course.title}</h1>
          <div className="flex flex-wrap gap-3 mb-4">
            <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm font-medium">{course.category || 'General'}</span>
            <span className={`px-3 py-1 rounded-full text-sm font-medium ${course.difficulty === 'Beginner' ? 'bg-green-100 text-green-700' :
              course.difficulty === 'Intermediate' ? 'bg-yellow-100 text-yellow-700' :
                'bg-red-100 text-red-700'
              }`}>
              {course.difficulty || 'Beginner'}
            </span>
            <span className="flex items-center gap-1 text-gray-500 text-sm"><Clock className="w-4 h-4" /> {course.totalDuration || 45} min</span>
            <span className="flex items-center gap-1 text-gray-500 text-sm"><Trophy className="w-4 h-4 text-yellow-500" /> {course.totalXP || 0} XP</span>
          </div>

          {/* Progress Section */}
          {user?.id && hasStarted && (
            <div className="mb-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
              <div className="flex justify-between items-center text-sm mb-2">
                <span className="text-blue-700 font-medium">Your Progress</span>
                <span className="text-blue-700 font-medium">{progressPercentage}% Complete</span>
              </div>
              <div className="w-full bg-blue-200 rounded-full h-2">
                <div className="bg-blue-600 h-2 rounded-full transition-all" style={{ width: `${progressPercentage}%` }} />
              </div>
              <div className="flex justify-between items-center mt-2 text-xs text-blue-600">
                <span>{completedScreensCount} of {totalScreens} lessons completed</span>
                <span>{courseXpEarned} XP earned</span>
              </div>
            </div>
          )}

          {/* Completed Badge */}
          {isCompleted && (
            <div className="mb-4 p-3 bg-green-50 rounded-lg border border-green-200">
              <div className="flex items-center gap-2">
                <CheckCircle className="w-5 h-5 text-green-600" />
                <span className="text-green-700 font-medium">Course Completed! 🎉</span>
              </div>
            </div>
          )}

          {/* Single Start/Resume Button */}
          <div className="text-center">
            <button
              onClick={handleStartCourse}
              className="inline-flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white text-lg px-8 py-3 rounded-xl transition-colors shadow-lg"
            >
              {getButtonIcon()}
              {getButtonText()}
            </button>
            {hasStarted && !isCompleted && (
              <p className="text-sm text-gray-500 mt-3">
                You've completed {completedScreensCount} of {totalScreens} lessons
              </p>
            )}
          </div>

          {/* Learning Objectives */}
          <div className="border-t pt-4 mt-2">
            <h2 className="text-lg font-semibold text-gray-900 mb-3">What You'll Learn</h2>
            <ul className="space-y-2">
              {course.learningObjectives?.map((obj, idx) => (
                <li key={idx} className="flex items-start gap-2">
                  <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                  <span className="text-gray-700">{obj}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Course Content */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Course Content</h2>
          <div className="space-y-3">
            {course.units?.map((unit, idx) => {
              let unitCompletedCount = 0;
              let unitProgress = 0;
              if (user?.id && userProgress) {
                unitCompletedCount = userProgress.currentProgress?.filter(p => {
                  const pCourseId = typeof p.courseId === 'object' ? p.courseId._id : p.courseId;
                  return pCourseId === course._id && p.unitId === unit.unitId && p.completed === true;
                }).length || 0;
                unitProgress = unit.screens.length > 0 ? Math.round((unitCompletedCount / unit.screens.length) * 100) : 0;
              }

              return (
                <div key={unit.unitId} className="border rounded-lg p-4 hover:border-blue-300 transition-colors">
                  <div className="flex justify-between items-center">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <h3 className="font-semibold text-gray-900">Unit {idx + 1}: {unit.title}</h3>
                        {unitProgress === 100 && unitCompletedCount > 0 && (
                          <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full">✓ Complete</span>
                        )}
                        {unitProgress > 0 && unitProgress < 100 && (
                          <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full">{unitProgress}%</span>
                        )}
                      </div>
                      <p className="text-sm text-gray-500">{unit.screens?.length || 0} lessons</p>
                      {unit.displayMessage && <p className="text-sm text-gray-600 italic mt-1">"{unit.displayMessage}"</p>}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
        {/* Lock Screen Modal */}
        {showLockScreen && prerequisiteDetails && (
          <LockScreen
            course={course}
            prerequisites={prerequisiteDetails}
            onClose={() => setShowLockScreen(false)}
            onContinue={() => {
              setShowLockScreen(false);
              navigate(getStartLink());
            }}
            onTakeTest={() => {
              // Your existing placement test logic here
              setShowLockScreen(false);
              // Navigate to test page or open test modal
              navigate(`/placement-test/${course._id}`);
            }}
          />
        )}
      </div>
    </div>
  );
};

export default CourseDetail;