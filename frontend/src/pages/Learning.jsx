import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom'; // Added useNavigate and Link
import { courseAPI } from '../services/api';
import LoadingSpinner from '../components/LoadingSpinner';
import { ChevronRight, CheckCircle, ArrowLeft } from 'lucide-react'; // Added ArrowLeft
import { progressAPI } from '../services/api';

const Learning = () => {
  const { courseId, unitId, screenId } = useParams();
  const navigate = useNavigate(); // Added navigate
  const [course, setCourse] = useState(null);
  const [currentUnit, setCurrentUnit] = useState(null);
  const [currentScreen, setCurrentScreen] = useState(null);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [userAnswer, setUserAnswer] = useState('');
  const [showExplanation, setShowExplanation] = useState(false);
  const [isCorrect, setIsCorrect] = useState(false);
  const [xpEarned, setXpEarned] = useState(0);
  const [totalXp, setTotalXp] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchCourse = async () => {
      try {
        const response = await courseAPI.getById(courseId);
        setCourse(response.data);

        // Set current unit
        const unit = unitId
          ? response.data.units.find(u => u.unitId === unitId)
          : response.data.units[0];
        setCurrentUnit(unit);

        // Set current screen
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

    if (courseId) {
      fetchCourse();
    }
  }, [courseId, unitId, screenId]);
  

  const getCurrentQuestion = () => {
    if (currentScreen?.type === 'concept-check' && currentScreen.questions) {
      return currentScreen.questions[currentQuestionIndex];
    }
    return null;
  };

  const handleAnswerSubmit = () => {
    const currentQuestion = getCurrentQuestion();
    if (!currentQuestion) return;

    const correct = currentQuestion.type === 'mcq'
      ? userAnswer === currentQuestion.correctAnswer
      : userAnswer.trim() === currentQuestion.correctAnswer.trim();

    setIsCorrect(correct);
    setShowExplanation(true);

    if (correct && currentQuestion.xp) {
      const earnedXP = currentQuestion.xp;
      setXpEarned(earnedXP);
      setTotalXp(prev => prev + earnedXP);
    }
  };

  const handleNextQuestion = () => {
    const currentQuestion = getCurrentQuestion();
    if (!currentQuestion) return;

    // Move to next question or finish the screen
    if (currentQuestionIndex < currentScreen.questions.length - 1) {
      setCurrentQuestionIndex(prev => prev + 1);
      setUserAnswer('');
      setShowExplanation(false);
      setIsCorrect(false);
      setXpEarned(0);
    } else {
      // All questions completed, move to next screen
      handleNextScreen();
    }
  };

  const handleNextScreen = () => {
    if (!currentUnit || !currentScreen) return;

    const currentIndex = currentUnit.screens.findIndex(
      s => s.screenId === currentScreen.screenId
    );

    if (currentIndex < currentUnit.screens.length - 1) {
      // Next screen in same unit
      const nextScreen = currentUnit.screens[currentIndex + 1];
      navigate(`/learn/${courseId}/${currentUnit.unitId}/${nextScreen.screenId}`);
    } else {
      // Next unit or course completion
      const unitIndex = course.units.findIndex(u => u.unitId === currentUnit.unitId);
      if (unitIndex < course.units.length - 1) {
        const nextUnit = course.units[unitIndex + 1];
        navigate(`/learn/${courseId}/${nextUnit.unitId}`);
      } else {
        // Course completed
        navigate('/courses', {
          state: { message: `Congratulations! You completed ${course.title}` }
        });
      }
    }

    // Reset for next screen
    setCurrentQuestionIndex(0);
    setUserAnswer('');
    setShowExplanation(false);
    setIsCorrect(false);
    setXpEarned(0);
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

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-xl font-bold text-gray-900">{course.title}</h2>
              <p className="text-gray-600">Unit: {currentUnit.title}</p>
              {isConceptCheck && (
                <p className="text-sm text-gray-500">
                  Question {currentQuestionIndex + 1} of {totalQuestions}
                </p>
              )}
            </div>
            {totalXp > 0 && (
              <div className="text-right">
                <div className="text-sm text-gray-600">Total XP Earned</div>
                <div className="text-2xl font-bold text-green-600">+{totalXp}</div>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="grid lg:grid-cols-4 gap-8">

          {/* Navigation Sidebar - SCROLLABLE WITH BACK ARROW */}
          <div className="lg:col-span-1">
            <div className="card sticky top-8 max-h-[calc(100vh-6rem)] overflow-y-auto"> {/* Made scrollable */}

              {/* Back to Courses Button */}
              <div className="mb-4 pb-4 border-b border-gray-200">
                <button
                  onClick={() => navigate(`/courses/${courseId}`)}
                  className="flex items-center text-gray-600 hover:text-gray-900 transition-colors text-sm font-medium"
                >
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Back to Course Detail
                </button>
              </div>

              <h4 className="text-lg font-semibold text-gray-900 mb-4">Course Navigation</h4>
              <div className="space-y-4">
                {course.units.map(unit => {
                  const isCurrentUnit = unit.unitId === currentUnit.unitId;

                  return (
                    <div key={unit.unitId} className={`border rounded-lg p-4 ${isCurrentUnit ? 'border-blue-300 bg-blue-50' : 'border-gray-200'
                      }`}>
                      <div className={`flex items-center justify-between mb-2 ${isCurrentUnit ? 'text-blue-700 font-semibold' : 'text-gray-900'
                        }`}>
                        <h5 className="font-medium">{unit.title}</h5>
                        {isCurrentUnit && (
                          <ChevronRight className="w-4 h-4 text-blue-600" />
                        )}
                      </div>
                      <div className="space-y-1">
                        {unit.screens.map(screen => {
                          const isCurrentScreen = isCurrentUnit && screen.screenId === currentScreen.screenId;

                          return (
                            <button
                              key={screen.screenId}
                              onClick={() => navigate(`/learn/${courseId}/${unit.unitId}/${screen.screenId}`)}
                              className={`w-full text-left px-3 py-2 rounded text-sm transition-colors flex items-center justify-between ${isCurrentScreen
                                ? 'bg-blue-100 text-blue-700 font-medium border border-blue-200'
                                : 'text-gray-600 hover:bg-gray-100'
                                }`}
                            >
                              <span className="truncate">{screen.title}</span>
                              {/* Placeholder for completed screens - you can implement this later */}
                              {/* {isCompleted && (
                                <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0 ml-2" />
                              )} */}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Progress Summary */}
              <div className="mt-6 pt-4 border-t border-gray-200">
                <div className="flex justify-between items-center text-sm text-gray-600 mb-2">
                  <span>Course Progress</span>
                  <span>0%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div className="bg-blue-600 h-2 rounded-full" style={{ width: '0%' }}></div>
                </div>
                <div className="flex justify-between items-center mt-2 text-xs text-gray-500">
                  <span>{totalXp} XP earned</span>
                  <span>{course?.totalXP || 0} total XP</span>
                </div>
              </div>

              {/* Quick Actions */}
              <div className="mt-4 pt-4 border-t border-gray-200">
                <button
                  onClick={() => navigate(`/courses/${courseId}`)}
                  className="w-full text-left text-sm text-gray-600 hover:text-gray-900 py-2"
                >
                  View Course Details
                </button>
                <button
                  onClick={() => navigate('/courses')}
                  className="w-full text-left text-sm text-gray-600 hover:text-gray-900 py-2"
                >
                  Browse All Courses
                </button>
              </div>
            </div>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-3">
            <div className="card">
              <h3 className="text-2xl font-bold text-gray-900 mb-6">{currentScreen.title}</h3>

              {currentScreen.description && !isConceptCheck && (
                <div className="prose prose-lg max-w-none mb-6">
                  {currentScreen.description.split('\n').map((line, index) => (
                    <p key={index} className="text-gray-700 mb-4">{line}</p>
                  ))}
                </div>
              )}

              {currentScreen.codeExample && !isConceptCheck && (
                <div className="mb-6">
                  <pre className="bg-gray-900 text-gray-100 p-4 rounded-lg overflow-x-auto">
                    <code className="text-sm">{currentScreen.codeExample}</code>
                  </pre>
                </div>
              )}

              {/* Concept Check Screen - One Question at a Time */}
              {isConceptCheck && currentQuestion && (
                <div className="space-y-6">
                  <div className="border border-gray-200 rounded-lg p-6">
                    <p className="text-lg font-medium text-gray-900 mb-4">
                      {currentQuestion.question}
                    </p>

                    {currentQuestion.type === 'mcq' && currentQuestion.options && (
                      <div className="space-y-3">
                        {currentQuestion.options.map((option, optIndex) => (
                          <label key={optIndex} className="flex items-center space-x-3 p-3 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer">
                            <input
                              type="radio"
                              name="question"
                              value={option}
                              checked={userAnswer === option}
                              onChange={(e) => setUserAnswer(e.target.value)}
                              disabled={showExplanation}
                              className="text-blue-600 focus:ring-blue-500"
                            />
                            <span className="text-gray-700">{option}</span>
                          </label>
                        ))}
                      </div>
                    )}

                    {currentQuestion.type === 'coding' && (
                      <div className="coding-area">
                        <textarea
                          value={userAnswer}
                          onChange={(e) => setUserAnswer(e.target.value)}
                          placeholder="Write your answer here..."
                          disabled={showExplanation}
                          rows={4}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                      </div>
                    )}

                    {showExplanation && (
                      <div className={`mt-4 p-4 rounded-lg border ${isCorrect ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'
                        }`}>
                        <p className={`font-medium mb-2 ${isCorrect ? 'text-green-900' : 'text-red-900'
                          }`}>
                          {isCorrect ? '✓ Correct!' : '✗ Incorrect'}
                        </p>
                        <p className={isCorrect ? 'text-green-800' : 'text-red-800'}>
                          {currentQuestion.explanation}
                        </p>
                        {isCorrect && currentQuestion.xp && (
                          
                          <div className="mt-2 text-green-600 font-medium">
                            +{currentQuestion.xp} XP Earned!
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  <div className="flex justify-between items-center">
                    <div>
                      {!showExplanation ? (
                        <button
                          onClick={handleAnswerSubmit}
                          disabled={!userAnswer}
                          className="btn-primary disabled:bg-gray-400 disabled:cursor-not-allowed"
                        >
                          Check Answer
                        </button>
                      ) : (
                        <button
                          onClick={handleNextQuestion}
                          className="btn-primary"
                        >
                          {isLastQuestion ? 'Finish' : 'Next Question'}
                        </button>
                      )}
                    </div>

                    {isConceptCheck && (
                      <span className="text-sm text-gray-500">
                        {currentQuestionIndex + 1} of {totalQuestions}
                      </span>
                    )}
                  </div>
                </div>
              )}

              {/* Regular Content Screen (Non-concept-check) */}
              {!isConceptCheck && (
                <div className="mt-8 flex justify-end">
                  <button onClick={handleNextScreen} className="btn-primary">
                    Continue
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