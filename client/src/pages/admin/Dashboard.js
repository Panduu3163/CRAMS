import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import axios from 'axios';
import toast from 'react-hot-toast';
import LoadingSpinner from '../../components/LoadingSpinner';
import {
  UsersIcon,
  BookOpenIcon,
  ChartBarIcon,
  Cog6ToothIcon,
  PlusIcon,
  PencilIcon,
  TrashIcon,
  UserPlusIcon,
  AcademicCapIcon,
  UserGroupIcon,
  LinkIcon
} from '@heroicons/react/24/outline';

const AdminDashboard = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState({
    statistics: {},
    recentActivities: [],
    users: [],
    courses: [],
    assignments: [],
    students: [],
    advisors: []
  });
  const [activeTab, setActiveTab] = useState('overview');
  const [showUserModal, setShowUserModal] = useState(false);
  const [showCourseModal, setShowCourseModal] = useState(false);
  const [showAssignmentModal, setShowAssignmentModal] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [editingCourse, setEditingCourse] = useState(null);
  const [selectedStudent, setSelectedStudent] = useState('');
  const [selectedAdvisor, setSelectedAdvisor] = useState('');

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const [dashboardRes, usersRes, coursesRes, assignmentsRes] = await Promise.all([
        axios.get('/admin/dashboard'),
        axios.get('/admin/users?limit=10'),
        axios.get('/courses?limit=10'),
        axios.get('/admin/advisor-assignments')
      ]);

      // Separate students and advisors from users
      const students = usersRes.data.users.filter(user => user.role === 'student');
      const advisors = usersRes.data.users.filter(user => user.role === 'advisor');

      setData({
        statistics: dashboardRes.data.statistics,
        recentActivities: dashboardRes.data.statistics.recentActivities || [],
        users: usersRes.data.users,
        courses: coursesRes.data.courses,
        assignments: assignmentsRes.data.assignments || [],
        students: students,
        advisors: advisors
      });
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      toast.error('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteUser = async (userId) => {
    if (!window.confirm('Are you sure you want to delete this user?')) return;
    
    try {
      await axios.delete(`/admin/users/${userId}`);
      toast.success('User deleted successfully');
      fetchDashboardData();
    } catch (error) {
      toast.error('Failed to delete user');
    }
  };

  const handleAssignAdvisor = async () => {
    if (!selectedStudent || !selectedAdvisor) {
      toast.error('Please select both a student and an advisor');
      return;
    }

    try {
      await axios.post('/admin/assign-advisor', {
        studentId: selectedStudent,
        advisorId: selectedAdvisor
      });
      
      toast.success('Advisor assigned successfully');
      setShowAssignmentModal(false);
      setSelectedStudent('');
      setSelectedAdvisor('');
      fetchDashboardData();
    } catch (error) {
      console.error('Error assigning advisor:', error);
      toast.error(error.response?.data?.message || 'Failed to assign advisor');
    }
  };

  const handleRemoveAssignment = async (assignmentId) => {
    if (!window.confirm('Are you sure you want to remove this assignment?')) return;
    
    try {
      await axios.delete(`/admin/advisor-assignments/${assignmentId}`);
      toast.success('Assignment removed successfully');
      fetchDashboardData();
    } catch (error) {
      console.error('Error removing assignment:', error);
      toast.error('Failed to remove assignment');
    }
  };

  const handleDeleteCourse = async (courseId) => {
    if (!window.confirm('Are you sure you want to delete this course?')) return;
    
    try {
      await axios.delete(`/courses/${courseId}`);
      toast.success('Course deleted successfully');
      fetchDashboardData();
    } catch (error) {
      toast.error('Failed to delete course');
    }
  };

  if (loading) {
    return <LoadingSpinner text="Loading admin dashboard..." />;
  }

  const stats = data.statistics;
  const userStats = stats.users || {};
  const enrollmentStats = stats.enrollment || {};

  return (
    <div className="space-y-6">
      {/* Welcome Header */}
      <div className="bg-gradient-to-r from-purple-600 to-purple-700 rounded-lg p-6 text-white">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Admin Dashboard</h1>
            <p className="text-purple-100 mt-1">
              Welcome, {user?.firstName} {user?.lastName} • System Administrator
            </p>
          </div>
          <div className="hidden md:block">
            <div className="bg-white/20 p-3 rounded-full">
              <Cog6ToothIcon className="h-8 w-8" />
            </div>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          {[
            { id: 'overview', name: 'Overview', icon: ChartBarIcon },
            { id: 'users', name: 'Users', icon: UsersIcon },
            { id: 'courses', name: 'Courses', icon: BookOpenIcon },
            { id: 'assignments', name: 'Assignments', icon: UserGroupIcon },
            { id: 'reports', name: 'Reports', icon: ChartBarIcon }
          ].map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center space-x-2 py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === tab.id
                    ? 'border-primary-500 text-primary-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <Icon className="h-5 w-5" />
                <span>{tab.name}</span>
              </button>
            );
          })}
        </nav>
      </div>

      {/* Overview Tab */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="card p-6">
              <div className="flex items-center">
                <div className="bg-blue-100 p-3 rounded-full">
                  <UsersIcon className="h-6 w-6 text-blue-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Total Students</p>
                  <p className="text-2xl font-bold text-gray-900">{userStats.student || 0}</p>
                </div>
              </div>
            </div>

            <div className="card p-6">
              <div className="flex items-center">
                <div className="bg-green-100 p-3 rounded-full">
                  <AcademicCapIcon className="h-6 w-6 text-green-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Total Advisors</p>
                  <p className="text-2xl font-bold text-gray-900">{userStats.advisor || 0}</p>
                </div>
              </div>
            </div>

            <div className="card p-6">
              <div className="flex items-center">
                <div className="bg-purple-100 p-3 rounded-full">
                  <BookOpenIcon className="h-6 w-6 text-purple-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Active Courses</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.totalCourses || 0}</p>
                </div>
              </div>
            </div>

            <div className="card p-6">
              <div className="flex items-center">
                <div className="bg-orange-100 p-3 rounded-full">
                  <ChartBarIcon className="h-6 w-6 text-orange-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Enrollment Rate</p>
                  <p className="text-2xl font-bold text-gray-900">{enrollmentStats.utilizationRate || 0}%</p>
                </div>
              </div>
            </div>
          </div>

          {/* Recent Activities */}
          <div className="card">
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900">Recent Activities</h2>
            </div>
            <div className="p-6">
              {data.recentActivities.length === 0 ? (
                <div className="text-center py-8">
                  <ChartBarIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500">No recent activities</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {data.recentActivities.slice(0, 10).map((activity, index) => (
                    <div key={index} className="flex items-center space-x-4 p-3 bg-gray-50 rounded-lg">
                      <div className="flex-1">
                        <p className="text-sm font-medium text-gray-900">
                          {activity.course_code} - {activity.course_name}
                        </p>
                        <p className="text-sm text-gray-600">
                          Student: {activity.student_first_name} {activity.student_last_name}
                        </p>
                        {activity.advisor_first_name && (
                          <p className="text-sm text-gray-600">
                            Advisor: {activity.advisor_first_name} {activity.advisor_last_name}
                          </p>
                        )}
                      </div>
                      <div className="text-right">
                        <span className={`px-2 py-1 text-xs rounded-full ${
                          activity.status === 'approved' ? 'bg-green-100 text-green-800' :
                          activity.status === 'rejected' ? 'bg-red-100 text-red-800' :
                          'bg-yellow-100 text-yellow-800'
                        }`}>
                          {activity.status}
                        </span>
                        <p className="text-xs text-gray-500 mt-1">
                          {new Date(activity.reviewed_at || activity.selected_at).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Users Tab */}
      {activeTab === 'users' && (
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-semibold text-gray-900">User Management</h2>
            <button
              onClick={() => setShowUserModal(true)}
              className="btn btn-primary btn-md"
            >
              <UserPlusIcon className="h-5 w-5 mr-2" />
              Add User
            </button>
          </div>

          <div className="card">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      User
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Role
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Department
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Created
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {data.users.map((user) => (
                    <tr key={user.id}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="w-10 h-10 bg-primary-100 rounded-full flex items-center justify-center">
                            <span className="text-primary-700 font-medium text-sm">
                              {user.first_name?.charAt(0)}{user.last_name?.charAt(0)}
                            </span>
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-medium text-gray-900">
                              {user.first_name} {user.last_name}
                            </div>
                            <div className="text-sm text-gray-500">{user.email}</div>
                            {user.student_id && (
                              <div className="text-sm text-gray-500">ID: {user.student_id}</div>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                          user.role === 'admin' ? 'bg-purple-100 text-purple-800' :
                          user.role === 'advisor' ? 'bg-blue-100 text-blue-800' :
                          'bg-green-100 text-green-800'
                        }`}>
                          {user.role}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {user.department || 'N/A'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {new Date(user.created_at).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <button
                          onClick={() => setEditingUser(user)}
                          className="text-primary-600 hover:text-primary-900 mr-3"
                        >
                          <PencilIcon className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteUser(user.id)}
                          className="text-red-600 hover:text-red-900"
                        >
                          <TrashIcon className="h-4 w-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Courses Tab */}
      {activeTab === 'courses' && (
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-semibold text-gray-900">Course Management</h2>
            <button
              onClick={() => setShowCourseModal(true)}
              className="btn btn-primary btn-md"
            >
              <PlusIcon className="h-5 w-5 mr-2" />
              Add Course
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {data.courses.map((course) => (
              <div key={course.id} className="card p-6">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="text-lg font-medium text-gray-900">{course.course_code}</h3>
                    <p className="text-sm text-gray-600">{course.course_name}</p>
                  </div>
                  <div className="flex space-x-2">
                    <button
                      onClick={() => setEditingCourse(course)}
                      className="text-primary-600 hover:text-primary-800"
                    >
                      <PencilIcon className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => handleDeleteCourse(course.id)}
                      className="text-red-600 hover:text-red-800"
                    >
                      <TrashIcon className="h-4 w-4" />
                    </button>
                  </div>
                </div>
                <div className="space-y-2 text-sm text-gray-600">
                  <p>Credits: {course.credits}</p>
                  <p>Department: {course.department}</p>
                  <p>Schedule: {course.schedule_days} {course.schedule_time}</p>
                  <p>Instructor: {course.instructor || 'TBA'}</p>
                  <p>Enrollment: {course.current_enrollment}/{course.max_capacity}</p>
                </div>
                <div className="mt-4">
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-primary-600 h-2 rounded-full"
                      style={{
                        width: `${Math.min((course.current_enrollment / course.max_capacity) * 100, 100)}%`
                      }}
                    ></div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Assignments Tab */}
      {activeTab === 'assignments' && (
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-semibold text-gray-900">Student-Advisor Assignments</h2>
            <button
              onClick={() => setShowAssignmentModal(true)}
              className="btn btn-primary flex items-center space-x-2"
            >
              <LinkIcon className="h-5 w-5" />
              <span>Assign Student to Advisor</span>
            </button>
          </div>

          {/* Current Assignments */}
          <div className="card">
            <div className="p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Current Assignments</h3>
              {data.assignments.length === 0 ? (
                <div className="text-center py-8">
                  <UserGroupIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500">No assignments found</p>
                  <p className="text-sm text-gray-400 mt-1">Click "Assign Student to Advisor" to create assignments</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Student
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Advisor
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Assigned Date
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {data.assignments.map((assignment) => (
                        <tr key={assignment.id}>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center">
                              <div className="bg-blue-100 p-2 rounded-full mr-3">
                                <AcademicCapIcon className="h-5 w-5 text-blue-600" />
                              </div>
                              <div>
                                <div className="text-sm font-medium text-gray-900">
                                  {assignment.student_first_name} {assignment.student_last_name}
                                </div>
                                <div className="text-sm text-gray-500">
                                  {assignment.student_email}
                                </div>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center">
                              <div className="bg-green-100 p-2 rounded-full mr-3">
                                <UsersIcon className="h-5 w-5 text-green-600" />
                              </div>
                              <div>
                                <div className="text-sm font-medium text-gray-900">
                                  {assignment.advisor_first_name} {assignment.advisor_last_name}
                                </div>
                                <div className="text-sm text-gray-500">
                                  {assignment.advisor_email}
                                </div>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {new Date(assignment.assigned_at).toLocaleDateString()}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                            <button
                              onClick={() => handleRemoveAssignment(assignment.id)}
                              className="text-red-600 hover:text-red-900 flex items-center space-x-1"
                            >
                              <TrashIcon className="h-4 w-4" />
                              <span>Remove</span>
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>

          {/* Quick Assignment Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="card p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
                <AcademicCapIcon className="h-6 w-6 text-blue-600 mr-2" />
                Students Without Advisors
              </h3>
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {data.students.filter(student => 
                  !data.assignments.some(assignment => assignment.student_id === student.id)
                ).map(student => (
                  <div key={student.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div>
                      <div className="text-sm font-medium text-gray-900">
                        {student.first_name} {student.last_name}
                      </div>
                      <div className="text-xs text-gray-500">{student.email}</div>
                    </div>
                    <button
                      onClick={() => {
                        setSelectedStudent(student.id);
                        setShowAssignmentModal(true);
                      }}
                      className="btn btn-sm btn-primary"
                    >
                      Assign
                    </button>
                  </div>
                ))}
                {data.students.filter(student => 
                  !data.assignments.some(assignment => assignment.student_id === student.id)
                ).length === 0 && (
                  <p className="text-sm text-gray-500 text-center py-4">
                    All students have advisors assigned
                  </p>
                )}
              </div>
            </div>

            <div className="card p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
                <UsersIcon className="h-6 w-6 text-green-600 mr-2" />
                Available Advisors
              </h3>
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {data.advisors.map(advisor => {
                  const assignedStudents = data.assignments.filter(assignment => assignment.advisor_id === advisor.id);
                  return (
                    <div key={advisor.id} className="p-3 bg-gray-50 rounded-lg">
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="text-sm font-medium text-gray-900">
                            {advisor.first_name} {advisor.last_name}
                          </div>
                          <div className="text-xs text-gray-500">{advisor.email}</div>
                        </div>
                        <div className="text-xs text-gray-500">
                          {assignedStudents.length} student{assignedStudents.length !== 1 ? 's' : ''}
                        </div>
                      </div>
                    </div>
                  );
                })}
                {data.advisors.length === 0 && (
                  <p className="text-sm text-gray-500 text-center py-4">
                    No advisors available
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Reports Tab */}
      {activeTab === 'reports' && (
        <div className="space-y-6">
          <h2 className="text-xl font-semibold text-gray-900">System Reports</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="card p-6 text-center">
              <ChartBarIcon className="h-12 w-12 text-blue-600 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">Enrollment Report</h3>
              <p className="text-sm text-gray-600 mb-4">Course enrollment statistics and trends</p>
              <button className="btn btn-primary btn-sm">Generate Report</button>
            </div>

            <div className="card p-6 text-center">
              <UsersIcon className="h-12 w-12 text-green-600 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">Advisor Activity</h3>
              <p className="text-sm text-gray-600 mb-4">Advisor review activity and performance</p>
              <button className="btn btn-primary btn-sm">Generate Report</button>
            </div>

            <div className="card p-6 text-center">
              <AcademicCapIcon className="h-12 w-12 text-purple-600 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">Student Progress</h3>
              <p className="text-sm text-gray-600 mb-4">Student course selection progress</p>
              <button className="btn btn-primary btn-sm">Generate Report</button>
            </div>
          </div>
        </div>
      )}

      {/* Assignment Modal */}
      {showAssignmentModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <div className="flex items-center mb-4">
              <LinkIcon className="h-6 w-6 text-primary-600 mr-2" />
              <h3 className="text-lg font-semibold text-gray-900">Assign Student to Advisor</h3>
            </div>
            
            <div className="space-y-4">
              {/* Student Selection */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Select Student
                </label>
                <select
                  value={selectedStudent}
                  onChange={(e) => setSelectedStudent(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                >
                  <option value="">Choose a student...</option>
                  {data.students.map((student) => (
                    <option key={student.id} value={student.id}>
                      {student.first_name} {student.last_name} ({student.email})
                    </option>
                  ))}
                </select>
              </div>

              {/* Advisor Selection */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Select Advisor
                </label>
                <select
                  value={selectedAdvisor}
                  onChange={(e) => setSelectedAdvisor(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                >
                  <option value="">Choose an advisor...</option>
                  {data.advisors.map((advisor) => {
                    const assignedCount = data.assignments.filter(assignment => assignment.advisor_id === advisor.id).length;
                    return (
                      <option key={advisor.id} value={advisor.id}>
                        {advisor.first_name} {advisor.last_name} ({assignedCount} students)
                      </option>
                    );
                  })}
                </select>
              </div>

              {/* Assignment Preview */}
              {selectedStudent && selectedAdvisor && (
                <div className="bg-blue-50 p-4 rounded-lg">
                  <h4 className="text-sm font-medium text-blue-900 mb-2">Assignment Preview</h4>
                  <div className="text-sm text-blue-800">
                    <div className="flex items-center mb-1">
                      <AcademicCapIcon className="h-4 w-4 mr-1" />
                      <span className="font-medium">Student:</span>
                      <span className="ml-1">
                        {data.students.find(s => s.id == selectedStudent)?.first_name} {data.students.find(s => s.id == selectedStudent)?.last_name}
                      </span>
                    </div>
                    <div className="flex items-center">
                      <UsersIcon className="h-4 w-4 mr-1" />
                      <span className="font-medium">Advisor:</span>
                      <span className="ml-1">
                        {data.advisors.find(a => a.id == selectedAdvisor)?.first_name} {data.advisors.find(a => a.id == selectedAdvisor)?.last_name}
                      </span>
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className="flex space-x-3 mt-6">
              <button
                onClick={() => {
                  setShowAssignmentModal(false);
                  setSelectedStudent('');
                  setSelectedAdvisor('');
                }}
                className="btn btn-secondary btn-md flex-1"
              >
                Cancel
              </button>
              <button
                onClick={handleAssignAdvisor}
                disabled={!selectedStudent || !selectedAdvisor}
                className="btn btn-primary btn-md flex-1 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Assign Advisor
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modals would be implemented here for creating/editing users and courses */}
      {showUserModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Add New User</h3>
            <p className="text-gray-600 mb-4">User creation form would be implemented here</p>
            <div className="flex space-x-3">
              <button
                onClick={() => setShowUserModal(false)}
                className="btn btn-secondary btn-md"
              >
                Cancel
              </button>
              <button className="btn btn-primary btn-md">Create User</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;
