import React from 'react';
import { Link } from 'react-router-dom';
import { Rocket, Target, TrendingUp, BookOpen } from 'lucide-react';

const Home = () => {
  return (
    <div className="min-h-screen">
      {/* Hero Section
      <section className="bg-gradient-to-br from-blue-600 to-purple-700 text-white rounded-2xl p-8 mb-8">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-4xl md:text-5xl font-bold mb-6">
            Accelerate Your Learning Journey
          </h1>
          <p className="text-xl mb-8 text-blue-100 max-w-2xl mx-auto">
            Master new skills through interactive courses, earn achievements, and track your progress with SkillSprint.
          </p>
          <Link to="/courses" className="btn-primary bg-white text-blue-600 hover:bg-blue-50 text-lg px-8 py-3 inline-block">
            Start Sprinting Now
          </Link>
        </div>
      </section> */}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-12 mb-12">
        <div className="card text-center">
          <div className="flex justify-center mb-3">
            <Rocket className="w-8 h-8 text-blue-600" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Get Started</h3>
          <p className="text-gray-600 mb-4">Begin your learning journey with our beginner-friendly courses</p>
          <Link to="/courses" className="text-blue-600 hover:text-blue-700 font-medium">
            Browse Courses →
          </Link>
        </div>

        <div className="card text-center">
          <div className="flex justify-center mb-3">
            <Target className="w-8 h-8 text-green-600" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Earn Achievements</h3>
          <p className="text-gray-600 mb-4">Track your progress and unlock achievements as you learn</p>
          <Link to="/achievements" className="text-blue-600 hover:text-blue-700 font-medium">
            View Achievements →
          </Link>
        </div>

        <div className="card text-center">
          <div className="flex justify-center mb-3">
            <TrendingUp className="w-8 h-8 text-purple-600" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Track Progress</h3>
          <p className="text-gray-600 mb-4">Monitor your learning journey and see your improvement</p>
          <Link to="/courses" className="text-blue-600 hover:text-blue-700 font-medium">
            Continue Learning →
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Home;