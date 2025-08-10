import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { 
  BookOpenIcon, 
  UserCircleIcon, 
  Bars3Icon, 
  XMarkIcon,
  HomeIcon,
  AcademicCapIcon,
  ChartBarIcon,
  BellIcon,
  Cog6ToothIcon,
  ArrowRightOnRectangleIcon,
  UserGroupIcon
} from '@heroicons/react/24/outline';

const Navbar = () => {
  const { user, logout, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/login');
    setIsMobileMenuOpen(false);
  };

  const getDashboardPath = () => {
    if (!user) return '/';
    switch (user.role) {
      case 'student': return '/student/dashboard';
      case 'advisor': return '/advisor/dashboard';
      case 'admin': return '/admin/dashboard';
      default: return '/';
    }
  };

  const getNavigationItems = () => {
    if (!isAuthenticated) return [];

    const commonItems = [
      { name: 'Dashboard', href: getDashboardPath(), icon: HomeIcon },
      { name: 'Courses', href: '/courses', icon: BookOpenIcon },
      { name: 'Profile', href: '/profile', icon: UserCircleIcon },
    ];

    const roleSpecificItems = {
      student: [
        { name: 'My Schedule', href: '/student/schedule', icon: AcademicCapIcon },
        { name: 'Notifications', href: '/student/notifications', icon: BellIcon },
      ],
      advisor: [
        { name: 'Students', href: '/advisor/students', icon: AcademicCapIcon },
        { name: 'Reviews', href: '/advisor/reviews', icon: ChartBarIcon },
      ],
      admin: [
        { name: 'Users', href: '/admin/users', icon: UserCircleIcon },
        { name: 'Assignments', href: '/admin/assignments', icon: UserGroupIcon },
        { name: 'Courses', href: '/admin/courses', icon: AcademicCapIcon },
        { name: 'Reports', href: '/admin/reports', icon: ChartBarIcon },
        { name: 'Settings', href: '/admin/settings', icon: Cog6ToothIcon },
      ]
    };

    return [...commonItems, ...(roleSpecificItems[user?.role] || [])];
  };

  const navigationItems = getNavigationItems();

  const isActiveLink = (href) => {
    return location.pathname === href;
  };

  if (!isAuthenticated) {
    return (
      <nav className="bg-white shadow-lg border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <Link to="/" className="flex items-center space-x-2">
                <div className="bg-primary-600 p-2 rounded-lg">
                  <AcademicCapIcon className="h-6 w-6 text-white" />
                </div>
                <span className="text-xl font-bold text-gray-900">CRAMS</span>
              </Link>
            </div>
            <div className="flex items-center space-x-4">
              <Link to="/admin/assignments" className="text-gray-300 hover:bg-gray-700 hover:text-white px-3 py-2 rounded-md text-sm font-medium flex items-center">
                <UserGroupIcon className="h-4 w-4 mr-2" />
                Assignments
              </Link>
              <Link to="/admin/courses" className="text-gray-300 hover:bg-gray-700 hover:text-white px-3 py-2 rounded-md text-sm font-medium flex items-center">
                <AcademicCapIcon className="h-4 w-4 mr-2" />
                Courses
              </Link>
              <Link
                to="/register"
                className="btn btn-primary btn-sm"
              >
                Register
              </Link>
            </div>
          </div>
        </div>
      </nav>
    );
  }

  return (
    <nav className="bg-white shadow-lg border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          {/* Logo and Brand */}
          <div className="flex items-center">
            <Link to={getDashboardPath()} className="flex items-center space-x-2">
              <div className="bg-primary-600 p-2 rounded-lg">
                <AcademicCapIcon className="h-6 w-6 text-white" />
              </div>
              <span className="text-xl font-bold text-gray-900">CRAMS</span>
            </Link>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-1">
            {navigationItems.map((item) => {
              const Icon = item.icon;
              return (
                <Link
                  key={item.name}
                  to={item.href}
                  className={`flex items-center space-x-1 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                    isActiveLink(item.href)
                      ? 'bg-primary-100 text-primary-700'
                      : 'text-gray-700 hover:text-primary-600 hover:bg-gray-100'
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  <span>{item.name}</span>
                </Link>
              );
            })}
          </div>

          {/* User Menu */}
          <div className="hidden md:flex items-center space-x-4">
            <div className="flex items-center space-x-2 text-sm text-gray-700">
              <div className="w-8 h-8 bg-primary-100 rounded-full flex items-center justify-center">
                <span className="text-primary-700 font-medium">
                  {user?.firstName?.charAt(0)}{user?.lastName?.charAt(0)}
                </span>
              </div>
              <div>
                <p className="font-medium">{user?.firstName} {user?.lastName}</p>
                <p className="text-xs text-gray-500 capitalize">{user?.role}</p>
              </div>
            </div>
            <button
              onClick={handleLogout}
              className="flex items-center space-x-1 text-gray-700 hover:text-red-600 px-3 py-2 rounded-md text-sm font-medium transition-colors"
            >
              <ArrowRightOnRectangleIcon className="h-4 w-4" />
              <span>Logout</span>
            </button>
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden flex items-center">
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="text-gray-700 hover:text-primary-600 p-2"
            >
              {isMobileMenuOpen ? (
                <XMarkIcon className="h-6 w-6" />
              ) : (
                <Bars3Icon className="h-6 w-6" />
              )}
            </button>
          </div>
        </div>

        {/* Mobile Navigation Menu */}
        {isMobileMenuOpen && (
          <div className="md:hidden border-t border-gray-200 py-4">
            <div className="space-y-2">
              {navigationItems.map((item) => {
                const Icon = item.icon;
                return (
                  <Link
                    key={item.name}
                    to={item.href}
                    onClick={() => setIsMobileMenuOpen(false)}
                    className={`flex items-center space-x-2 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                      isActiveLink(item.href)
                        ? 'bg-primary-100 text-primary-700'
                        : 'text-gray-700 hover:text-primary-600 hover:bg-gray-100'
                    }`}
                  >
                    <Icon className="h-5 w-5" />
                    <span>{item.name}</span>
                  </Link>
                );
              })}
            </div>
            
            {/* Mobile User Info */}
            <div className="mt-4 pt-4 border-t border-gray-200">
              <div className="flex items-center space-x-3 px-3 py-2">
                <div className="w-10 h-10 bg-primary-100 rounded-full flex items-center justify-center">
                  <span className="text-primary-700 font-medium">
                    {user?.firstName?.charAt(0)}{user?.lastName?.charAt(0)}
                  </span>
                </div>
                <div>
                  <p className="font-medium text-gray-900">{user?.firstName} {user?.lastName}</p>
                  <p className="text-sm text-gray-500 capitalize">{user?.role}</p>
                </div>
              </div>
              <button
                onClick={handleLogout}
                className="flex items-center space-x-2 w-full text-left px-3 py-2 text-sm font-medium text-red-600 hover:bg-red-50 rounded-md transition-colors"
              >
                <ArrowRightOnRectangleIcon className="h-5 w-5" />
                <span>Logout</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
};

export default Navbar;
