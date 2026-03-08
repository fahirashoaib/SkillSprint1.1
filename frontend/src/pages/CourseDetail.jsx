import React, { useState, useEffect } from 'react';
import {useParams, Link } from 'react-router-dom';
import { courseAPI } from '../services/api';
import { LoadingPage } from '../components/LoadingSpinner';
import BackButton from '../components/BackButton';
import DifficultyBadge from '../components/DifficultyBadge';
import ProgressBar from '../components/ProgressBar';

const CourseDetail = () => {
  const { id } = useParams();
  const [course, setCourse] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchCourse = async () => {
      try {
        const response = await courseAPI.getById(id);
        setCourse(response.data);
      } catch (error) {
        console.error('Error fetching course:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchCourse();
  }, [id]);

  if (loading) return <LoadingPage />;

  if (!course) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Course not found</h2>
          <Link to="/courses" className="btn-primary">Back to Courses</Link>
        </div>
      </div>
    );
  }

  
  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <BackButton to="/courses" text="Back to Courses" />
      
      <div className="max-w-4xl mx-auto px-4">
        {/* Course Hero */}
        <div className="card mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">{course.title}</h1>
          <div className="flex flex-wrap gap-4 mb-6">
            <span className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm font-medium">
              {course.category}
            </span>
            <DifficultyBadge level={course.difficulty} />
            <span className="bg-gray-100 text-gray-800 px-3 py-1 rounded-full text-sm font-medium">
              ⏱️ {course.totalDuration} min
            </span>
            <span className="bg-yellow-100 text-yellow-800 px-3 py-1 rounded-full text-sm font-medium">
              ⭐ {course.totalXP} XP
            </span>
          </div>
        </div>

        {/* Learning Objectives */}
        <div className="card mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Learning Objectives</h2>
          <ul className="space-y-2">
            {course.learningObjectives.map((objective, index) => (
              <li key={index} className="flex items-start">
                <span className="text-green-500 mr-3 mt-1">✓</span>
                <span className="text-gray-700">{objective}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Curriculum */}
        <div className="card">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Course Curriculum</h2>
          <div className="space-y-4">
            {course.units.map((unit, index) => (
              <div key={unit.unitId} className="border border-gray-200 rounded-lg p-6 hover:border-primary-300 transition-colors">
                <div className="flex justify-between items-start mb-3">
                  <h3 className="text-xl font-semibold text-gray-900">
                    Unit {index + 1}: {unit.title}
                  </h3>
                  <div className="flex items-center space-x-4 text-sm text-gray-600">
                    <span>{unit.duration} min</span>
                    <span>{unit.totalXP} XP</span>
                  </div>
                </div>
                <p className="text-gray-600 mb-4 italic">"{unit.displayMessage}"</p>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-500">
                    {unit.screens.length} screens
                  </span>
                  <Link
                    to={`/learn/${course._id}/${unit.unitId}`}
                    className="btn-primary"
                  >
                    Start Unit
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Start Course Button */}
        <div className="text-center mt-8">
          <Link
            to={`/learn/${course._id}/${course.units[0]?.unitId}`}
            className="btn-primary text-lg px-8 py-3"
          >
            Start Course
          </Link>
        </div>
      </div>
    </div>
  );
};

export default CourseDetail;