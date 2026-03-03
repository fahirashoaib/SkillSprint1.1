import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext'; // Import useAuth
import ProtectedRoute from './components/ProtectedRoute';

// Pages
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import Home from './pages/Home';
import Courses from './pages/Courses';
import CourseDetail from './pages/CourseDetail';
import Learning from './pages/Learning';
import Achievements from './pages/Achievements';
import Profile from './pages/Profile';
import AdminDashboard from './pages/AdminDashboard';

// New component to block admin from learner routes
const LearnerOnlyRoute = ({ children }) => {
  const { isAdmin } = useAuth(); // Now this will work
  
  if (isAdmin()) {
    return <Navigate to="/admin" replace />;
  }
  
  return children;
};

function App() {
  return (
    <AuthProvider>
      <Router>
        <div className="min-h-screen bg-gray-50">
          <Routes>
            {/* Public Routes */}
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />

            {/* Protected Routes */}
            <Route path="/" element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            }>
              {/* Block admin from accessing learner routes */}
              <Route index element={
                <LearnerOnlyRoute>
                  <Home />
                </LearnerOnlyRoute>
              } />
              <Route path="courses" element={
                <LearnerOnlyRoute>
                  <Courses />
                </LearnerOnlyRoute>
              } />
              <Route path="courses/:id" element={
                <LearnerOnlyRoute>
                  <CourseDetail />
                </LearnerOnlyRoute>
              } />
              <Route path="achievements" element={
                <LearnerOnlyRoute>
                  <Achievements />
                </LearnerOnlyRoute>
              } />
              <Route path="profile" element={
                <LearnerOnlyRoute>
                  <Profile />
                </LearnerOnlyRoute>
              } />
            </Route>

            {/* Separate Admin Route - NOT nested in Dashboard */}
            <Route path="/admin" element={
              <ProtectedRoute requireAdmin={true}>
                <AdminDashboard />
              </ProtectedRoute>
            } />

            <Route path="/learn/:courseId/:unitId?/:screenId?" element={
              <ProtectedRoute>
                <Learning />
              </ProtectedRoute>
            } />

            {/* Catch all - redirect to home */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </div>
      </Router>
    </AuthProvider>
  );
}

export default App;