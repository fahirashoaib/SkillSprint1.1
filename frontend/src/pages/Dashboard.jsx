import React, { useState } from 'react';
import { Outlet, useLocation, Link, useNavigate } from 'react-router-dom';
import { Home, BookOpen, Trophy, Menu, X, User, LogOut, Settings } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const Dashboard = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout, isAdmin } = useAuth();

  // SEPARATE NAVIGATION FOR ADMIN VS LEARNER
  const getNavigation = () => {
    if (isAdmin()) {
      // ADMIN ONLY SEES ADMIN PANEL
      return [
        { name: 'Admin Dashboard', href: '/admin', icon: Settings }
      ];
    } else {
      // LEARNER SEES REGULAR TABS
      return [
        { name: 'Home', href: '/', icon: Home },
        { name: 'Courses', href: '/courses', icon: BookOpen },
        { name: 'Achievements', href: '/achievements', icon: Trophy },
        //{ name: 'Profile', href: '/profile', icon: User }
      ];
    }
  };

  const navigation = getNavigation();

  const isActive = (href) => {
    if (href === '/') {
      return location.pathname === '/';
    }
    return location.pathname.startsWith(href);
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };


  return (
    <div className="flex h-screen bg-gray-50">
      
      {/* Sidebar for desktop */}
      <div className="hidden md:flex md:w-64 md:flex-col">
        <div className="flex flex-col flex-grow pt-5 overflow-y-auto bg-white border-r">
          <div className="flex items-center flex-shrink-0 px-4">
            <div className="w-8 h-8 bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-sm">SS</span>
            </div>
            <span className="ml-2 text-xl font-bold text-gray-900">
              {isAdmin() ? 'Admin Portal' : 'SkillSprint'}
            </span>
          </div>

          {/* User Info 
          <div className="px-4 mt-6 pb-4 border-b">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                <User className="w-6 h-6 text-blue-600" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 truncate">
                  {user?.username}
                </p>
                <p className="text-xs text-gray-500 truncate">
                  {isAdmin() ? 'Administrator' : `Learner • ${user?.xp || 0} XP`}
                </p>
              </div>
            </div>
            
             Only show Profile link for learners
            {!isAdmin() && (
              <div className="mt-3 flex items-center justify-between text-sm">
                <span className="text-gray-600">XP: {user?.xp || 0}</span>
                <Link to="/profile" className="text-blue-600 hover:text-blue-700">
                  Profile
                </Link>
              </div>
            )}
          </div> */}


          <div className="mt-6 flex-grow flex flex-col">
            <nav className="flex-1 px-4 pb-4 space-y-2">
              {navigation.map((item) => (
                <Link
                  key={item.name}
                  to={item.href}
                  className={`group flex items-center px-4 py-3 text-sm font-medium rounded-lg transition-colors ${
                    isActive(item.href)
                      ? 'bg-blue-50 text-blue-700 border-r-2 border-blue-600'
                      : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                  }`}
                >
                  <item.icon className="w-5 h-5 mr-3" />
                  {item.name}
                </Link>
              ))}
            </nav>

            {/* Logout Button */}
            <div className="px-4 pb-4 border-t pt-4">
              <button
                onClick={handleLogout}
                className="w-full flex items-center px-4 py-3 text-sm font-medium text-red-600 hover:bg-red-50 rounded-lg transition-colors"
              >
                <LogOut className="w-5 h-5 mr-3" />
                Logout
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile sidebar */}
      {sidebarOpen && (
        <div className="fixed inset-0 flex z-40 md:hidden">
          <div className="fixed inset-0 bg-gray-600 bg-opacity-75" onClick={() => setSidebarOpen(false)}></div>
          <div className="relative flex-1 flex flex-col max-w-xs w-full bg-white">
            <div className="absolute top-0 right-0 -mr-12 pt-2">
              <button
                className="ml-1 flex items-center justify-center h-10 w-10 rounded-full focus:outline-none focus:ring-2 focus:ring-inset focus:ring-white"
                onClick={() => setSidebarOpen(false)}
              >
                <X className="h-6 w-6 text-white" />
              </button>
            </div>
            <div className="flex-1 h-0 pt-5 pb-4 overflow-y-auto">
              <div className="flex-shrink-0 flex items-center px-4 mb-6">
                <div className="w-8 h-8 bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg flex items-center justify-center">
                  <span className="text-white font-bold text-sm">SS</span>
                </div>
                <span className="ml-2 text-xl font-bold text-gray-900">
                  {isAdmin() ? 'Admin Portal' : 'SkillSprint'}
                </span>
              </div>

              {/* Mobile User Info */}
              <div className="px-4 pb-4 border-b mb-4">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                    <User className="w-6 h-6 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-900">{user?.username}</p>
                    <p className="text-xs text-gray-500">
                      {isAdmin() ? 'Administrator' : `${user?.xp || 0} XP`}
                    </p>
                  </div>
                </div>
              </div>

              <nav className="px-4 space-y-2">
                {navigation.map((item) => (
                  <Link
                    key={item.name}
                    to={item.href}
                    onClick={() => setSidebarOpen(false)}
                    className={`group flex items-center px-4 py-3 text-sm font-medium rounded-lg transition-colors ${
                      isActive(item.href)
                        ? 'bg-blue-50 text-blue-700'
                        : 'text-gray-600 hover:bg-gray-100'
                    }`}
                  >
                    <item.icon className="w-5 h-5 mr-3" />
                    {item.name}
                  </Link>
                ))}
              </nav>

              {/* Mobile Logout */}
              <div className="px-4 mt-4 pt-4 border-t">
                <button
                  onClick={() => {
                    setSidebarOpen(false);
                    handleLogout();
                  }}
                  className="w-full flex items-center px-4 py-3 text-sm font-medium text-red-600 hover:bg-red-50 rounded-lg"
                >
                  <LogOut className="w-5 h-5 mr-3" />
                  Logout
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Main content */}
      <div className="flex flex-col flex-1 overflow-hidden">
        {/* Top bar */}
        <div className="relative z-10 flex-shrink-0 flex h-16 bg-white shadow">
          <button
            className="px-4 border-r border-gray-200 text-gray-500 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-blue-500 md:hidden"
            onClick={() => setSidebarOpen(true)}
          >
            <Menu className="h-6 w-6" />
          </button>
          <div className="flex-1 px-4 flex justify-between items-center">
            <h1 className="text-2xl font-semibold text-gray-900">
              {navigation.find(item => isActive(item.href))?.name || 
               (isAdmin() ? 'Admin Portal' : 'SkillSprint')}
            </h1>

            {/* Desktop User Menu */}
            <div className="hidden md:flex items-center space-x-4">
              {!isAdmin() && (
                <span className="text-sm text-gray-600">
                  {user?.xp || 0} XP
                </span>
              )}
              <div className="relative">
                <button
                  onClick={() => setShowUserMenu(!showUserMenu)}
                  className="flex items-center space-x-2 text-gray-700 hover:text-gray-900"
                >
                  <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                    <User className="w-5 h-5 text-blue-600" />
                  </div>
                  <span className="text-sm font-medium">
                    {user?.username}
                  </span>
                </button>

                {showUserMenu && (
                  <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border py-1">
                    {/* Only show Profile for learners */}
                    {/* {!isAdmin() && (
                      <Link
                        to="/profile"
                        className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                        onClick={() => setShowUserMenu(false)}
                      >
                        Profile
                      </Link>
                    )} */}
                    <button
                      onClick={handleLogout}
                      className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50"
                    >
                      Logout
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Page content */}
        <main className="flex-1 relative overflow-y-auto focus:outline-none">
          <div className="py-6">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8">
              <Outlet />
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default Dashboard;