import React, { useState, useEffect } from 'react';
import { courseAPI } from '../services/api';
import { LoadingPage } from '../components/LoadingSpinner';
import CourseCard from '../components/CourseCard';

const Courses = () => {
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
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

  if (loading) return <LoadingPage />;

  return (
    <div className="min-h-screen py-8">
      
      <div className="max-w-7xl mx-auto px-4">
        {/* Course Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {courses.map(course => (
            <CourseCard key={course._id} course={course} />
          ))}
        </div>
      </div>
    </div>
  );
};

export default Courses;