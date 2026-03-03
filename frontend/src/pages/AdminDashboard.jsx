import React, { useEffect, useState } from "react";
import { useAuth } from '../context/AuthContext';
import LoadingSpinner from '../components/LoadingSpinner';
import { Users, BookOpen, Target, BarChart3, Eye, Trash2, LogOut, User, Mail, Calendar, Shield, Activity } from 'lucide-react';

export default function AdminDashboard() {
    const [stats, setStats] = useState({ 
        users: { total: 0, learners: 0, admins: 0 }, 
        courses: 0
    });
    const [users, setUsers] = useState([]);
    const [courses, setCourses] = useState([]);
    const [selectedUser, setSelectedUser] = useState(null);
    const [showUserModal, setShowUserModal] = useState(false);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const { user, logout } = useAuth();

    useEffect(() => {
        loadAdminData();
    }, []);

    async function loadAdminData() {
        setLoading(true);
        setError("");
        try {
            const token = localStorage.getItem('token');
            const headers = {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            };

            const [statsRes, usersRes, coursesRes] = await Promise.all([
                fetch("/api/admin/stats", { headers }).then(res => {
                    if (!res.ok) throw new Error(`Stats: ${res.status}`);
                    return res.json();
                }),
                fetch("/api/admin/users?limit=8", { headers }).then(res => {
                    if (!res.ok) throw new Error(`Users: ${res.status}`);
                    return res.json();
                }),
                fetch("/api/admin/courses", { headers }).then(res => {
                    if (!res.ok) throw new Error(`Courses: ${res.status}`);
                    return res.json();
                })
            ]);

            setStats(statsRes);
            setUsers(usersRes);
            setCourses(coursesRes);
        } catch (err) {
            console.error('Admin API Error:', err);
            setError("Failed to load admin data. Please check if admin routes are implemented.");
        } finally {
            setLoading(false);
        }
    }

    // View User Details - Admin Perspective
    const handleViewUser = async (userId) => {
        try {
            const token = localStorage.getItem('token');
            const response = await fetch(`/api/admin/users/${userId}`, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });

            if (!response.ok) {
                throw new Error('Failed to fetch user details');
            }

            const userDetails = await response.json();
            setSelectedUser(userDetails);
            setShowUserModal(true);
        } catch (err) {
            console.error('View user error:', err);
            alert(`Failed to load user details: ${err.message}`);
        }
    };

    // Delete User Function
    const handleDeleteUser = async (userId, username) => {
        if (!window.confirm(`Are you sure you want to delete user "${username}"? This action cannot be undone.`)) {
            return;
        }

        try {
            const token = localStorage.getItem('token');
            const response = await fetch(`/api/admin/users/${userId}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || 'Failed to delete user');
            }

            // Remove user from local state
            setUsers(prevUsers => prevUsers.filter(user => user._id !== userId));
            
            // Update stats
            setStats(prevStats => ({
                ...prevStats,
                users: {
                    ...prevStats.users,
                    total: prevStats.users.total - 1,
                    learners: prevStats.users.learners - (users.find(u => u._id === userId)?.role === 'learner' ? 1 : 0),
                    admins: prevStats.users.admins - (users.find(u => u._id === userId)?.role === 'admin' ? 1 : 0)
                }
            }));

            alert(`User "${username}" has been deleted successfully.`);

        } catch (err) {
            console.error('Delete user error:', err);
            alert(`Failed to delete user: ${err.message}`);
        }
    };

    // Logout Function
    const handleLogout = () => {
        if (window.confirm("Are you sure you want to log out?")) {
            logout();
            window.location.href = '/login';
        }
    };

    if (user && user.role !== 'admin') {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="text-center">
                    <h2 className="text-2xl font-bold text-gray-900 mb-4">Access Denied</h2>
                    <p className="text-gray-600">Admin privileges required.</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 py-8">
            <div className="max-w-7xl mx-auto px-4">
                {/* Header with Logout Button */}
                <div className="flex justify-between items-center mb-8">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900">Admin Dashboard</h1>
                        <p className="text-gray-600 mt-2">Platform Management & Analytics</p>
                    </div>
                    <div className="flex space-x-3">
                        <button onClick={loadAdminData} className="btn-secondary">
                            Refresh Data
                        </button>
                        <button 
                            onClick={handleLogout}
                            className="bg-red-600 hover:bg-red-700 text-white font-medium py-2 px-4 rounded-lg transition-colors duration-200 flex items-center"
                        >
                            <LogOut className="w-4 h-4 mr-2" />
                            Logout
                        </button>
                    </div>
                </div>

                {loading ? (
                    <div className="flex justify-center py-12">
                        <LoadingSpinner size="lg" />
                    </div>
                ) : error ? (
                    <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6">
                        <p className="font-semibold">Admin Dashboard Error</p>
                        <p>{error}</p>
                        <p className="text-sm mt-2">Make sure your backend has the admin routes implemented.</p>
                    </div>
                ) : (
                    <>
                        {/* Stats Overview - ADMIN ONLY METRICS */}
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                            <div className="card text-center">
                                <Users className="w-8 h-8 text-blue-600 mx-auto mb-2" />
                                <h3 className="text-lg font-semibold text-gray-900">Total Users</h3>
                                <p className="text-3xl font-bold text-blue-600">{stats.users?.total || 0}</p>
                                <div className="flex justify-between text-sm text-gray-600 mt-2">
                                    <span>{stats.users?.learners || 0} learners</span>
                                    <span>{stats.users?.admins || 0} admins</span>
                                </div>
                            </div>

                            <div className="card text-center">
                                <BookOpen className="w-8 h-8 text-green-600 mx-auto mb-2" />
                                <h3 className="text-lg font-semibold text-gray-900">Total Courses</h3>
                                <p className="text-3xl font-bold text-green-600">{stats.courses || 0}</p>
                            </div>

                            <div className="card text-center">
                                <Target className="w-8 h-8 text-purple-600 mx-auto mb-2" />
                                <h3 className="text-lg font-semibold text-gray-900">Course Completions</h3>
                                <p className="text-3xl font-bold text-purple-600">
                                    {courses.reduce((sum, course) => sum + (course.completions || 0), 0)}
                                </p>
                            </div>

                            <div className="card text-center">
                                <Activity className="w-8 h-8 text-orange-600 mx-auto mb-2" />
                                <h3 className="text-lg font-semibold text-gray-900">Active Learners</h3>
                                <p className="text-3xl font-bold text-orange-600">
                                    {courses.reduce((sum, course) => sum + (course.inProgress || 0), 0)}
                                </p>
                            </div>
                        </div>

                        {/* Users Table - ADMIN ONLY VIEW */}
                        <div className="card">
                            <h3 className="text-xl font-bold text-gray-900 mb-6">User Management</h3>
                            <div className="overflow-x-auto">
                                <table className="w-full">
                                    <thead className="bg-gray-50">
                                        <tr>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">User</th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Role</th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Joined</th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody className="bg-white divide-y divide-gray-200">
                                        {users.length === 0 ? (
                                            <tr>
                                                <td colSpan="5" className="px-6 py-4 text-center text-gray-500">
                                                    No users found
                                                </td>
                                            </tr>
                                        ) : (
                                            users.map((userItem) => (
                                                <tr key={userItem._id} className="hover:bg-gray-50">
                                                    <td className="px-6 py-4 whitespace-nowrap">
                                                        <div>
                                                            <p className="font-medium text-gray-900">{userItem.username}</p>
                                                            <p className="text-sm text-gray-500">{userItem.email}</p>
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap">
                                                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                                                            userItem.role === 'admin' 
                                                                ? 'bg-purple-100 text-purple-800'
                                                                : 'bg-green-100 text-green-800'
                                                        }`}>
                                                            {userItem.role}
                                                        </span>
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                        {new Date(userItem.createdAt).toLocaleDateString()}
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap">
                                                        {userItem.role === 'learner' ? (
                                                            <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                                                                userItem.completedCourses?.length > 0 
                                                                    ? 'bg-green-100 text-green-800'
                                                                    : 'bg-blue-100 text-blue-800'
                                                            }`}>
                                                                {userItem.completedCourses?.length > 0 ? 'Active Learner' : 'New Learner'}
                                                            </span>
                                                        ) : (
                                                            <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-purple-100 text-purple-800">
                                                                Administrator
                                                            </span>
                                                        )}
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                                        <button 
                                                            onClick={() => handleViewUser(userItem._id)}
                                                            className="text-blue-600 hover:text-blue-900 mr-3 flex items-center"
                                                        >
                                                            <Eye className="w-4 h-4 mr-1" />
                                                            View
                                                        </button>
                                                        <button 
                                                            onClick={() => handleDeleteUser(userItem._id, userItem.username)}
                                                            className="text-red-600 hover:text-red-900 flex items-center"
                                                            disabled={userItem._id === user?._id}
                                                        >
                                                            <Trash2 className="w-4 h-4 mr-1" />
                                                            Delete
                                                        </button>
                                                    </td>
                                                </tr>
                                            ))
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>

                        {/* Course Management Section */}
                        <div className="card mt-8">
                            <h3 className="text-xl font-bold text-gray-900 mb-6">Course Analytics</h3>
                            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                                {courses.map((course) => (
                                    <div key={course._id} className="border border-gray-200 rounded-lg p-4">
                                        <h4 className="font-semibold text-gray-900 mb-2">{course.title}</h4>
                                        <div className="flex justify-between text-sm text-gray-600 mb-3">
                                            <span>{course.category}</span>
                                            <span className={`px-2 py-1 text-xs rounded-full ${
                                                course.difficulty === 'Beginner' 
                                                    ? 'bg-green-100 text-green-800'
                                                    : course.difficulty === 'Intermediate'
                                                    ? 'bg-yellow-100 text-yellow-800'
                                                    : 'bg-red-100 text-red-800'
                                            }`}>
                                                {course.difficulty}
                                            </span>
                                        </div>
                                        <div className="space-y-2 text-sm">
                                            <div className="flex justify-between">
                                                <span>Completions:</span>
                                                <span className="font-medium text-green-600">{course.completions || 0}</span>
                                            </div>
                                            <div className="flex justify-between">
                                                <span>In Progress:</span>
                                                <span className="font-medium text-blue-600">{course.inProgress || 0}</span>
                                            </div>
                                            <div className="flex justify-between">
                                                <span>Total Duration:</span>
                                                <span className="font-medium text-gray-600">{course.totalDuration} min</span>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </>
                )}

                {/* User Details Modal - ADMIN PERSPECTIVE */}
                {showUserModal && selectedUser && (
                    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
                        <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                            <div className="p-6">
                                <div className="flex justify-between items-center mb-6">
                                    <h3 className="text-2xl font-bold text-gray-900">User Management</h3>
                                    <button 
                                        onClick={() => setShowUserModal(false)}
                                        className="text-gray-400 hover:text-gray-600"
                                    >
                                        ✕
                                    </button>
                                </div>
                                
                                <div className="space-y-6">
                                    {/* Basic Info */}
                                    <div className="flex items-center space-x-4">
                                        <div className={`w-16 h-16 rounded-full flex items-center justify-center ${
                                            selectedUser.role === 'admin' ? 'bg-purple-100' : 'bg-blue-100'
                                        }`}>
                                            <Shield className={`w-8 h-8 ${
                                                selectedUser.role === 'admin' ? 'text-purple-600' : 'text-blue-600'
                                            }`} />
                                        </div>
                                        <div>
                                            <h4 className="text-xl font-semibold text-gray-900">{selectedUser.username}</h4>
                                            <p className="text-gray-600 flex items-center">
                                                <Mail className="w-4 h-4 mr-2" />
                                                {selectedUser.email}
                                            </p>
                                            <p className="text-gray-600 flex items-center">
                                                <Calendar className="w-4 h-4 mr-2" />
                                                Joined {new Date(selectedUser.createdAt).toLocaleDateString()}
                                            </p>
                                        </div>
                                    </div>

                                    {/* Role and Status */}
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="text-center p-4 bg-gray-50 rounded-lg">
                                            <p className="text-lg font-bold capitalize text-gray-900">{selectedUser.role}</p>
                                            <p className="text-sm text-gray-600">User Role</p>
                                        </div>
                                        <div className="text-center p-4 bg-gray-50 rounded-lg">
                                            <p className="text-lg font-bold text-gray-900">
                                                {selectedUser.role === 'learner' 
                                                    ? (selectedUser.completedCourses?.length > 0 ? 'Active' : 'New')
                                                    : 'Administrator'
                                                }
                                            </p>
                                            <p className="text-sm text-gray-600">Status</p>
                                        </div>
                                    </div>

                                    {/* Learner Analytics (Only for learners) */}
                                    {selectedUser.role === 'learner' && (
                                        <div>
                                            <h5 className="font-semibold text-gray-900 mb-3">Learning Analytics</h5>
                                            <div className="grid grid-cols-3 gap-4">
                                                <div className="text-center p-3 bg-blue-50 rounded-lg">
                                                    <p className="text-lg font-bold text-blue-600">{selectedUser.completedCourses?.length || 0}</p>
                                                    <p className="text-xs text-gray-600">Courses Completed</p>
                                                </div>
                                                <div className="text-center p-3 bg-green-50 rounded-lg">
                                                    <p className="text-lg font-bold text-green-600">{selectedUser.xp || 0}</p>
                                                    <p className="text-xs text-gray-600">Total XP</p>
                                                </div>
                                                <div className="text-center p-3 bg-purple-50 rounded-lg">
                                                    <p className="text-lg font-bold text-purple-600">{selectedUser.currentProgress?.length || 0}</p>
                                                    <p className="text-xs text-gray-600">Progress Items</p>
                                                </div>
                                            </div>
                                        </div>
                                    )}

                                    {/* Recent Activity */}
                                    <div>
                                        <h5 className="font-semibold text-gray-900 mb-3">
                                            {selectedUser.role === 'learner' ? 'Learning Activity' : 'Administrative Account'}
                                        </h5>
                                        {selectedUser.role === 'learner' && selectedUser.completedCourses && selectedUser.completedCourses.length > 0 ? (
                                            <div className="space-y-2">
                                                {selectedUser.completedCourses.slice(0, 3).map((course, index) => (
                                                    <div key={index} className="flex justify-between items-center p-3 bg-green-50 rounded">
                                                        <span className="text-gray-900">
                                                            {course.courseId?.title || `Course ${course.courseId}`}
                                                        </span>
                                                        <span className="text-sm text-gray-600">
                                                            Completed {new Date(course.completedAt).toLocaleDateString()}
                                                        </span>
                                                    </div>
                                                ))}
                                            </div>
                                        ) : selectedUser.role === 'learner' ? (
                                            <p className="text-gray-500 text-center py-4">No courses completed yet</p>
                                        ) : (
                                            <p className="text-gray-500 text-center py-4">Administrative account - No learning data</p>
                                        )}
                                    </div>

                                    <div className="flex justify-end space-x-3 pt-4">
                                        <button 
                                            onClick={() => setShowUserModal(false)}
                                            className="btn-secondary"
                                        >
                                            Close
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}