import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { courseAPI, progressAPI, userAPI } from '../services/api';
import LoadingSpinner from '../components/LoadingSpinner';
import { ArrowLeft, ArrowRight } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const Learning = () => {
  const { user } = useAuth();
  const { courseId, unitId, screenId } = useParams();
  const navigate = useNavigate();

  const [course, setCourse] = useState(null);
  const [currentUnit, setCurrentUnit] = useState(null);
  const [currentScreen, setCurrentScreen] = useState(null);
  const [loading, setLoading] = useState(true);
  const [fullUserData, setFullUserData] = useState(null);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [userAnswer, setUserAnswer] = useState('');
  const [showExplanation, setShowExplanation] = useState(false);
  const [isCorrect, setIsCorrect] = useState(false);
  const [feedbackMessage, setFeedbackMessage] = useState('');
  const [showFeedback, setShowFeedback] = useState(false);
  const [courseXp, setCourseXp] = useState(0);
  const [completedScreensMap, setCompletedScreensMap] = useState({});

  // Check if user can access a specific screen
  const canAccessScreen = (screenIndex, unit) => {
    // First screen is always accessible
    if (screenIndex === 0) return true;

    // Check if previous screen is completed
    const previousScreen = unit.screens[screenIndex - 1];
    return isScreenCompleted(previousScreen.screenId, unit.unitId);
  };

  // Helper: Refresh completed screens and XP
  const refreshCompletedData = useCallback((userData) => {
    if (!userData?.currentProgress || !course) return;

    const completedMap = {};
    let xpTotal = 0;

    userData.currentProgress.forEach(p => {
      // Handle both ObjectId and string comparison
      const pCourseId = p.courseId?._id?.toString() || p.courseId?.toString();
      const currentCourseId = course._id?.toString();

      if (pCourseId === currentCourseId && p.completed === true) {
        const key = `${p.unitId}|${p.screenId}`;
        completedMap[key] = true;
        xpTotal += (p.xpEarned || 0);
        console.log('✅ Found completed screen:', p.screenId, 'XP:', p.xpEarned);
      }
    });

    console.log('📊 Completed screens map:', completedMap);
    console.log('💰 Total XP in course:', xpTotal);

    setCompletedScreensMap(completedMap);
    setCourseXp(xpTotal);

    return { completedMap, xpTotal };
  }, [course]);

  /// Check if a screen is completed
  const isScreenCompleted = useCallback((screenIdToCheck, unitIdToCheck) => {
    const key = `${unitIdToCheck}|${screenIdToCheck}`;
    const completed = !!completedScreensMap[key];
    return completed;
  }, [completedScreensMap]);

  // Fetch user data
  const loadUserData = useCallback(async () => {
    if (!user?.id) return null;
    try {
      console.log('📡 Loading user data for user:', user.id);
      const response = await userAPI.getProfile(user.id);
      console.log('📦 User data received. Progress entries:', response.data.currentProgress?.length || 0);
      setFullUserData(response.data);
      refreshCompletedData(response.data);
      return response.data;
    } catch (error) {
      console.error('Failed to fetch user data:', error);
      return null;
    }
  }, [user?.id, refreshCompletedData]);

  // Save progress
  // Save progress
  const saveProgress = useCallback(async (earnedXP = 0) => {
    if (!currentUnit || !currentScreen || !user?.id) return false;

    // Check if already completed
    if (isScreenCompleted(currentScreen.screenId, currentUnit.unitId)) {
      console.log('⏭️ Screen already completed, skipping save');
      return true;
    }

    console.log('💾 Saving progress for screen:', currentScreen.title, 'XP:', earnedXP);

    try {
      const response = await progressAPI.update(user.id, {
        courseId: course._id,
        unitId: currentUnit.unitId,
        screenId: currentScreen.screenId,
        completed: true,
        xpEarned: earnedXP
      });

      console.log('✅ Save response:', response.data);

      // Manually update the completed screens map immediately
      const newKey = `${currentUnit.unitId}|${currentScreen.screenId}`;
      setCompletedScreensMap(prev => ({
        ...prev,
        [newKey]: true
      }));

      // Update XP immediately
      if (earnedXP > 0) {
        setCourseXp(prev => prev + earnedXP);
      }

      // Also reload user data to sync
      await loadUserData();

      return true;
    } catch (error) {
      console.error('Failed to save progress:', error);
      return false;
    }
  }, [currentUnit, currentScreen, user?.id, course, loadUserData, isScreenCompleted]);

  // Fetch course data
  useEffect(() => {
    const fetchCourse = async () => {
      try {
        console.log('📚 Fetching course:', courseId);
        const response = await courseAPI.getById(courseId);
        console.log('📚 Course loaded:', response.data.title);
        setCourse(response.data);

        const unit = unitId
          ? response.data.units.find(u => u.unitId === unitId)
          : response.data.units[0];
        setCurrentUnit(unit);

        const screen = screenId
          ? unit.screens.find(s => s.screenId === screenId)
          : unit.screens[0];
        setCurrentScreen(screen);

      } catch (error) {
        console.error('Error fetching course:', error);
      } finally {
        setLoading(false);
      }
    };
    if (courseId) fetchCourse();
  }, [courseId, unitId, screenId]);

  // Load user data
  useEffect(() => {
    if (user?.id) {
      loadUserData();
    }
  }, [user?.id, loadUserData]);

  // Resume functionality
  useEffect(() => {
    if (!course || !fullUserData) return;
    if (screenId && unitId) return;

    // Find first incomplete screen
    for (const unit of course.units) {
      for (const screen of unit.screens) {
        if (!isScreenCompleted(screen.screenId, unit.unitId)) {
          const targetPath = `/learn/${course._id}/${unit.unitId}/${screen.screenId}`;
          if (window.location.pathname !== targetPath) {
            console.log('🔄 Resuming to screen:', screen.title);
            navigate(targetPath, { replace: true });
          }
          return;
        }
      }
    }
  }, [course, fullUserData, isScreenCompleted]);

  const getCurrentQuestion = () => {
    if (currentScreen?.type === 'concept-check' && currentScreen.questions) {
      return currentScreen.questions[currentQuestionIndex];
    }
    return null;
  };

  const showTemporaryFeedback = (message, isSuccess = true) => {
    setFeedbackMessage(message);
    setShowFeedback(true);
    setTimeout(() => {
      setShowFeedback(false);
      setFeedbackMessage('');
    }, 3000);
  };

  const handleAnswerSubmit = async () => {
    const currentQuestion = getCurrentQuestion();
    if (!currentQuestion) return;

    let correct = false;

    if (currentQuestion.type === 'mcq') {
      correct = userAnswer === currentQuestion.correctAnswer;
    } else if (currentQuestion.type === 'coding') {
      correct = userAnswer.trim().toLowerCase() === currentQuestion.correctAnswer.trim().toLowerCase();
    } else {
      correct = userAnswer.trim().toLowerCase() === currentQuestion.correctAnswer.trim().toLowerCase();
    }

    console.log('📝 Answer submitted. Correct:', correct);

    setIsCorrect(correct);
    setShowExplanation(true);

    if (correct && currentQuestion.xp) {
      showTemporaryFeedback(`🎉 +${currentQuestion.xp} XP Earned!`, true);
      await saveProgress(currentQuestion.xp);
    } else if (!correct) {
      showTemporaryFeedback('❌ Incorrect! Try again.', false);
    }
  };

  const handleNextQuestion = async () => {
    if (currentQuestionIndex < currentScreen.questions.length - 1) {
      setCurrentQuestionIndex(prev => prev + 1);
      setUserAnswer('');
      setShowExplanation(false);
      setIsCorrect(false);
    } else {
      await saveProgress(0);
      await handleNextScreen();
    }
  };

  const handleNextScreen = async () => {
    if (!currentUnit || !currentScreen) return;

    // Find current screen index
    const currentIndex = currentUnit.screens.findIndex(
      s => s.screenId === currentScreen.screenId
    );

    // Check if there's a next screen
    if (currentIndex < currentUnit.screens.length - 1) {
      const nextScreen = currentUnit.screens[currentIndex + 1];

      // For content screens, just navigate
      // For concept-check screens, they already answered to get here
      await saveProgress(0);
      navigate(`/learn/${courseId}/${currentUnit.unitId}/${nextScreen.screenId}`);
    } else {
      // Last screen of current unit - check if more units
      const unitIndex = course.units.findIndex(u => u.unitId === currentUnit.unitId);
      if (unitIndex < course.units.length - 1) {
        const nextUnit = course.units[unitIndex + 1];
        await saveProgress(0);
        navigate(`/learn/${courseId}/${nextUnit.unitId}/${nextUnit.screens[0].screenId}`);
      } else {
        // Course completed
        try {
          await progressAPI.completeCourse(user.id, courseId);
          showTemporaryFeedback('🎉 Congratulations! You completed the course!', true);
          setTimeout(() => navigate('/courses'), 2000);
        } catch (error) {
          console.error('Failed to mark course complete:', error);
          navigate('/courses');
        }
      }
    }

    // Reset states for new screen
    setCurrentQuestionIndex(0);
    setUserAnswer('');
    setShowExplanation(false);
    setIsCorrect(false);
  };

  const handleBackToCourseDetail = () => {
    navigate(`/courses/${courseId}`);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (!course || !currentUnit || !currentScreen) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Content not found</h2>
          <button onClick={() => navigate('/courses')} className="btn-primary">Back to Courses</button>
        </div>
      </div>
    );
  }

  const currentQuestion = getCurrentQuestion();
  const isConceptCheck = currentScreen.type === 'concept-check';
  const totalQuestions = isConceptCheck ? currentScreen.questions.length : 1;
  const isLastQuestion = currentQuestionIndex === totalQuestions - 1;

  // Calculate completed lessons count for each unit
  const getCompletedInUnit = (unit) => {
    let count = 0;
    for (const screen of unit.screens) {
      if (isScreenCompleted(screen.screenId, unit.unitId)) count++;
    }
    return count;
  };

  const totalScreensInCourse = course.units.reduce((sum, u) => sum + u.screens.length, 0);
  const completedScreensCount = Object.keys(completedScreensMap).length;
  const progressPercentage = totalScreensInCourse > 0 ? Math.round((completedScreensCount / totalScreensInCourse) * 100) : 0;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Feedback Toast Popup */}
      {showFeedback && (
        <div className="fixed top-20 right-4 z-50 animate-slide-in">
          <div className={`px-4 py-2 rounded-lg shadow-lg text-white ${feedbackMessage.includes('🎉') ? 'bg-green-500' : 'bg-red-500'}`}>
            {feedbackMessage}
          </div>
        </div>
      )}

      {/* Header */}
      <div className="bg-white shadow-sm border-b sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold text-gray-900">{course.title}</h2>
              <p className="text-sm text-gray-500">Unit: {currentUnit.title}</p>
            </div>
            <div className="text-right">
              <div className="text-xs text-gray-500">XP in this course</div>
              <div className="text-xl font-bold text-green-600">
                {courseXp} / {course?.totalXP || 0}
              </div>
            </div>
          </div>
          {isConceptCheck && (
            <div className="mt-1 text-xs text-gray-400">
              Question {currentQuestionIndex + 1} of {totalQuestions}
            </div>
          )}
          {/* Mini progress bar */}
          <div className="mt-2">
            <div className="flex justify-between text-xs text-gray-500 mb-1">
              <span>Course Progress</span>
              <span>{progressPercentage}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-1.5">
              <div className="bg-blue-600 h-1.5 rounded-full transition-all" style={{ width: `${progressPercentage}%` }} />
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-6">
        <div className="grid lg:grid-cols-4 gap-6">
          {/* Navigation Sidebar */}
          <div className="lg:col-span-1">
            <div className="card sticky top-20 max-h-[calc(100vh-6rem)] overflow-y-auto">
              <h4 className="text-md font-semibold text-gray-900 mb-3">Course Navigation</h4>
              <div className="space-y-3">
                {course.units.map(unit => {
                  const isCurrentUnit = unit.unitId === currentUnit.unitId;
                  const completedInUnit = getCompletedInUnit(unit);
                  const totalInUnit = unit.screens.length;

                  return (
                    <div key={unit.unitId} className={`border rounded-lg p-2 ${isCurrentUnit ? 'border-blue-300 bg-blue-50' : 'border-gray-200'}`}>
                      <div className="mb-1 px-1">
                        <h5 className={`text-sm font-medium ${isCurrentUnit ? 'text-blue-700' : 'text-gray-900'}`}>
                          {unit.title}
                        </h5>
                        <div className="text-xs text-gray-400">
                          {completedInUnit}/{totalInUnit} lessons
                        </div>
                      </div>
                      <div className="space-y-0.5">
                        {unit.screens.map((screen, screenIndex) => {
                          const isCurrentScreen = isCurrentUnit && screen.screenId === currentScreen.screenId;
                          const completed = isScreenCompleted(screen.screenId, unit.unitId);
                          const isUnlocked = screenIndex === 0 || isScreenCompleted(unit.screens[screenIndex - 1].screenId, unit.unitId);

                          return (
                            <button
                              key={screen.screenId}
                              onClick={() => {
                                if (isUnlocked || completed) {
                                  navigate(`/learn/${courseId}/${unit.unitId}/${screen.screenId}`);
                                } else {
                                  showTemporaryFeedback('🔒 Complete previous screen first!', false);
                                }
                              }}
                              className={`w-full text-left px-2 py-1 rounded text-xs transition-colors flex items-center justify-between ${isCurrentScreen
                                ? 'bg-blue-100 text-blue-700 font-medium'
                                : !isUnlocked && !completed
                                  ? 'text-gray-400 cursor-not-allowed bg-gray-50 opacity-50'
                                  : 'text-gray-600 hover:bg-gray-100'
                                }`}
                              disabled={!isUnlocked && !completed}
                            >
                              <span className="truncate">{screen.title}</span>
                              {completed && (
                                <svg className="w-3 h-3 text-green-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                </svg>
                              )}
                              {!isUnlocked && !completed && (
                                <svg className="w-3 h-3 text-gray-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                                </svg>
                              )}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-3">
            <div className="card">
              <h3 className="text-xl font-bold text-gray-900 mb-4">{currentScreen.title}</h3>

              {currentScreen.description && !isConceptCheck && (
                <div className="prose prose-sm max-w-none mb-4">
                  {currentScreen.description.split('\n').map((line, index) => (
                    <p key={index} className="text-gray-700 mb-2">{line}</p>
                  ))}
                </div>
              )}

              {currentScreen.codeExample && !isConceptCheck && (
                <div className="mb-4">
                  <pre className="bg-gray-900 text-gray-100 p-3 rounded-lg overflow-x-auto text-sm">
                    <code>{currentScreen.codeExample}</code>
                  </pre>
                </div>
              )}

              {/* Concept Check Screen */}
              {isConceptCheck && currentQuestion && (
                <div className="space-y-4">
                  <div className="border border-gray-200 rounded-lg p-4">
                    <p className="text-md font-medium text-gray-900 mb-3">{currentQuestion.question}</p>

                    {currentQuestion.type === 'mcq' && currentQuestion.options && (
                      <div className="space-y-2">
                        {currentQuestion.options.map((option, optIndex) => (
                          <label key={optIndex} className="flex items-center space-x-2 p-2 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer">
                            <input
                              type="radio"
                              name="question"
                              value={option}
                              checked={userAnswer === option}
                              onChange={(e) => setUserAnswer(e.target.value)}
                              disabled={showExplanation}
                              className="text-blue-600"
                            />
                            <span className="text-gray-700 text-sm">{option}</span>
                          </label>
                        ))}
                      </div>
                    )}

                    {currentQuestion.type === 'coding' && (
                      <textarea
                        value={userAnswer}
                        onChange={(e) => setUserAnswer(e.target.value)}
                        placeholder="Write your code/answer here..."
                        disabled={showExplanation}
                        rows={6}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono text-sm"
                      />
                    )}

                    {currentQuestion.type === 'text' && (
                      <input
                        type="text"
                        value={userAnswer}
                        onChange={(e) => setUserAnswer(e.target.value)}
                        placeholder="Type your answer here..."
                        disabled={showExplanation}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    )}

                    {showExplanation && (
                      <div className={`mt-3 p-3 rounded-lg border ${isCorrect ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}`}>
                        <p className={`text-sm font-medium mb-1 ${isCorrect ? 'text-green-900' : 'text-red-900'}`}>
                          {isCorrect ? '✓ Correct!' : '✗ Incorrect'}
                        </p>
                        <p className="text-sm">{currentQuestion.explanation}</p>
                        {isCorrect && currentQuestion.xp && (
                          <div className="mt-2 text-green-600 font-medium text-sm">
                            +{currentQuestion.xp} XP Earned!
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  <div className="flex justify-between items-center">
                    {!showExplanation ? (
                      <button onClick={handleAnswerSubmit} disabled={!userAnswer} className="btn-primary text-sm px-4 py-2">
                        Check Answer
                      </button>
                    ) : (
                      <button onClick={handleNextQuestion} className="btn-primary text-sm px-4 py-2">
                        {isLastQuestion ? 'Finish Screen' : 'Next Question'}
                      </button>
                    )}
                    <span className="text-xs text-gray-400">
                      {currentQuestionIndex + 1} of {totalQuestions}
                    </span>
                  </div>
                </div>
              )}

              {/* Regular Content Screen */}
              {!isConceptCheck && (
                <div className="mt-6 flex justify-between items-center">
                  <button
                    onClick={handleBackToCourseDetail}
                    className="bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded-lg text-sm transition-colors flex items-center gap-2"
                  >
                    <ArrowLeft className="w-4 h-4" />
                    Back to Course
                  </button>
                  <button onClick={handleNextScreen} className="btn-primary px-4 py-2 rounded-lg text-sm transition-colors flex items-center gap-2">
                    Continue
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              )}

              {/* Back button for concept check screens */}
              {isConceptCheck && (
                <div className="mt-6 flex justify-start">
                  <button
                    onClick={handleBackToCourseDetail}
                    className="bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded-lg text-sm transition-colors flex items-center gap-2"
                  >
                    <ArrowLeft className="w-4 h-4" />
                    Back to Course
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Learning;