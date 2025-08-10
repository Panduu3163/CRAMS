import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import axios from 'axios';
import toast from 'react-hot-toast';
import LoadingSpinner from '../../components/LoadingSpinner';
import {
  BookOpenIcon,
  ClockIcon,
  CheckCircleIcon,
  XCircleIcon,
  ExclamationTriangleIcon,
  PlusIcon,
  BellIcon,
  CalendarIcon,
  UserIcon
} from '@heroicons/react/24/outline';

const StudentDashboard = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState({
    selections: [],
    notifications: [],
    schedule: [],
    availableCourses: []
  });
  const [showCourseModal, setShowCourseModal] = useState(false);
  const [selectedCourse, setSelectedCourse] = useState(null);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const [selectionsRes, notificationsRes, scheduleRes, coursesRes] = await Promise.all([
        axios.get('/student/selections'),
        axios.get('/student/notifications'),
        axios.get('/student/schedule'),
        axios.get('/courses?limit=5')
      ]);

      setData({
        selections: selectionsRes.data.selections,
        notifications: notificationsRes.data.notifications.slice(0, 5),
        schedule: scheduleRes.data.schedule,
        availableCourses: coursesRes.data.courses.slice(0, 6)
      });
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      toast.error('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  const handleSelectCourse = async (courseId) => {
    try {
      await axios.post('/student/select-course', { courseId });
      toast.success('Course selected successfully!');
      fetchDashboardData();
      setShowCourseModal(false);
    } catch (error) {
      const message = error.response?.data?.message || 'Failed to select course';
      toast.error(message);
    }
  };

  const handleRemoveSelection = async (selectionId) => {
    try {
      await axios.delete(`/student/selections/${selectionId}`);
      toast.success('Course selection removed');
      fetchDashboardData();
    } catch (error) {
      toast.error('Failed to remove selection');
    }
  };

  const getStatusBadge = (status) => {
    const badges = {
      pending: { color: 'bg-yellow-100 text-yellow-800', icon: ClockIcon, text: 'Pending' },
      approved: { color: 'bg-green-100 text-green-800', icon: CheckCircleIcon, text: 'Approved' },
      rejected: { color: 'bg-red-100 text-red-800', icon: XCircleIcon, text: 'Rejected' },
      waitlisted: { color: 'bg-blue-100 text-blue-800', icon: ExclamationTriangleIcon, text: 'Waitlisted' }
    };
    
    const badge = badges[status] || badges.pending;
    const Icon = badge.icon;
    
    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${badge.color}`}>
        <Icon className="w-3 h-3 mr-1" />
        {badge.text}
      </span>
    );
  };

  if (loading) {
    return <LoadingSpinner text="Loading your dashboard..." />;
  }

  const stats = {
    totalSelections: data.selections.length,
    approvedCourses: data.selections.filter(s => s.status === 'approved').length,
    pendingReviews: data.selections.filter(s => s.status === 'pending').length,
    unreadNotifications: data.notifications.filter(n => !n.is_read).length
  };

  return (
    <div className="space-y-6">
      {/* Welcome Header */}
      <div className="bg-gradient-to-r from-primary-600 to-primary-700 rounded-lg p-6 text-white">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Welcome back, {user?.firstName}!</h1>
            <p className="text-primary-100 mt-1">
              Student ID: {user?.studentId} • {user?.department} • Year {user?.yearLevel}
            </p>
          </div>
          <div className="hidden md:block">
            <div className="bg-white/20 p-3 rounded-full">
              <UserIcon className="h-8 w-8" />
            </div>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="card p-6">
          <div className="flex items-center">
            <div className="bg-blue-100 p-3 rounded-full">
              <BookOpenIcon className="h-6 w-6 text-blue-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Selections</p>
              <p className="text-2xl font-bold text-gray-900">{stats.totalSelections}</p>
            </div>
          </div>
        </div>

        <div className="card p-6">
          <div className="flex items-center">
            <div className="bg-green-100 p-3 rounded-full">
              <CheckCircleIcon className="h-6 w-6 text-green-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Approved Courses</p>
              <p className="text-2xl font-bold text-gray-900">{stats.approvedCourses}</p>
            </div>
          </div>
        </div>

        <div className="card p-6">
          <div className="flex items-center">
            <div className="bg-yellow-100 p-3 rounded-full">
              <ClockIcon className="h-6 w-6 text-yellow-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Pending Reviews</p>
              <p className="text-2xl font-bold text-gray-900">{stats.pendingReviews}</p>
            </div>
          </div>
        </div>

        <div className="card p-6">
          <div className="flex items-center">
            <div className="bg-purple-100 p-3 rounded-full">
              <BellIcon className="h-6 w-6 text-purple-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Notifications</p>
              <p className="text-2xl font-bold text-gray-900">{stats.unreadNotifications}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Course Selections */}
        <div className="card">
          <div className="p-6 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-900">My Course Selections</h2>
              <button
                onClick={() => setShowCourseModal(true)}
                className="btn btn-primary btn-sm"
              >
                <PlusIcon className="h-4 w-4 mr-1" />
                Add Course
              </button>
            </div>
          </div>
          <div className="p-6">
            {data.selections.length === 0 ? (
              <div className="text-center py-8">
                <BookOpenIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500">No course selections yet</p>
                <button
                  onClick={() => setShowCourseModal(true)}
                  className="btn btn-primary btn-sm mt-2"
                >
                  Select Your First Course
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                {data.selections.slice(0, 5).map((selection) => (
                  <div key={selection.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                    <div className="flex-1">
                      <h3 className="font-medium text-gray-900">
                        {selection.course_code} - {selection.course_name}
                      </h3>
                      <p className="text-sm text-gray-600">
                        {selection.credits} credits • {selection.schedule_days} {selection.schedule_time}
                      </p>
                      {selection.advisor_comments && (
                        <p className="text-sm text-gray-600 mt-1">
                          <strong>Advisor:</strong> {selection.advisor_comments}
                        </p>
                      )}
                    </div>
                    <div className="flex items-center space-x-2">
                      {getStatusBadge(selection.status)}
                      {selection.status === 'pending' && (
                        <button
                          onClick={() => handleRemoveSelection(selection.id)}
                          className="text-red-600 hover:text-red-800 text-sm"
                        >
                          Remove
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Recent Notifications */}
        <div className="card">
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">Recent Notifications</h2>
          </div>
          <div className="p-6">
            {data.notifications.length === 0 ? (
              <div className="text-center py-8">
                <BellIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500">No notifications</p>
              </div>
            ) : (
              <div className="space-y-4">
                {data.notifications.map((notification) => (
                  <div key={notification.id} className={`p-4 rounded-lg border ${
                    notification.is_read ? 'bg-gray-50 border-gray-200' : 'bg-blue-50 border-blue-200'
                  }`}>
                    <h4 className="font-medium text-gray-900">{notification.title}</h4>
                    <p className="text-sm text-gray-600 mt-1">{notification.message}</p>
                    <p className="text-xs text-gray-500 mt-2">
                      {new Date(notification.created_at).toLocaleDateString()}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Current Schedule */}
      {data.schedule.length > 0 && (
        <div className="card">
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900 flex items-center">
              <CalendarIcon className="h-5 w-5 mr-2" />
              Current Schedule
            </h2>
          </div>
          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {data.schedule.map((course, index) => (
                <div key={index} className="p-4 bg-gradient-to-r from-primary-50 to-primary-100 rounded-lg">
                  <h3 className="font-medium text-gray-900">{course.course_code}</h3>
                  <p className="text-sm text-gray-600">{course.course_name}</p>
                  <p className="text-sm text-primary-700 mt-1">
                    {course.schedule_days} • {course.schedule_time}
                  </p>
                  <p className="text-xs text-gray-500">
                    {course.instructor} • {course.credits} credits
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Course Selection Modal */}
      {showCourseModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-hidden">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold text-gray-900">Select a Course</h2>
                <button
                  onClick={() => setShowCourseModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <XCircleIcon className="h-6 w-6" />
                </button>
              </div>
            </div>
            <div className="p-6 overflow-y-auto max-h-[70vh]">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {data.availableCourses.map((course) => (
                  <div key={course.id} className="card p-4">
                    <div className="flex justify-between items-start mb-2">
                      <h3 className="font-medium text-gray-900">{course.course_code}</h3>
                      <span className={`px-2 py-1 text-xs rounded-full ${
                        course.available_seats > 0 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {course.available_seats > 0 ? `${course.available_seats} seats` : 'Full'}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600 mb-2">{course.course_name}</p>
                    <p className="text-sm text-gray-500 mb-3">
                      {course.credits} credits • {course.schedule_days} {course.schedule_time}
                    </p>
                    <p className="text-sm text-gray-500 mb-3">
                      Instructor: {course.instructor || 'TBA'}
                    </p>
                    <button
                      onClick={() => handleSelectCourse(course.id)}
                      disabled={course.available_seats === 0}
                      className="w-full btn btn-primary btn-sm disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {course.available_seats > 0 ? 'Select Course' : 'Course Full'}
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default StudentDashboard;
