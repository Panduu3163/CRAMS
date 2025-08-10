import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { toast } from 'react-hot-toast';
import {
  PlusIcon,
  PencilIcon,
  TrashIcon,
  ExclamationTriangleIcon,
  ClockIcon,
  UsersIcon,
  CheckCircleIcon,
  XCircleIcon,
  CalendarIcon,
  MapPinIcon,
  UserGroupIcon,
  AcademicCapIcon,
  BookOpenIcon
} from '@heroicons/react/24/outline';
import CourseModal from '../../components/CourseModal';

const AdminCourseManagement = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState({
    courses: [],
    conflicts: [],
    scheduleStats: {}
  });
  const [activeTab, setActiveTab] = useState('courses');
  const [showCourseModal, setShowCourseModal] = useState(false);
  const [editingCourse, setEditingCourse] = useState(null);
  const [courseForm, setCourseForm] = useState({
    code: '',
    name: '',
    description: '',
    credits: 3,
    department: '',
    instructor: '',
    maxCapacity: 30,
    schedule: {
      days: [],
      startTime: '',
      endTime: '',
      room: ''
    },
    prerequisites: ''
  });

  const departments = [
    'Computer Science',
    'Mathematics',
    'Physics',
    'Chemistry',
    'Biology',
    'Engineering',
    'Business Administration',
    'Psychology',
    'English Literature',
    'History'
  ];

  const daysOfWeek = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      
      // Fetch courses
      const coursesRes = await axios.get('/api/courses', {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });

      // Fetch schedule statistics
      const scheduleRes = await axios.get('/api/admin/schedule-stats', {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });

      // Fetch seat conflicts
      const conflictsRes = await axios.get('/api/admin/seat-conflicts', {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });

      setData({
        courses: coursesRes.data.courses || [],
        conflicts: conflictsRes.data.overEnrolled || [],
        nearCapacity: conflictsRes.data.nearCapacity || [],
        waitlist: conflictsRes.data.waitlist || [],
        scheduleStats: {
          popularTimeSlots: scheduleRes.data.timeSlots || [],
          departmentDistribution: scheduleRes.data.departments || [],
          scheduleConflicts: scheduleRes.data.conflicts || []
        }
      });
    } catch (error) {
      console.error('Error fetching data:', error);
      toast.error('Failed to load course management data');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateCourse = async () => {
    try {
      const courseData = {
        courseName: courseForm.name,
        courseCode: courseForm.code,
        description: courseForm.description,
        credits: courseForm.credits,
        department: courseForm.department,
        instructor: courseForm.instructor,
        maxCapacity: courseForm.maxCapacity,
        prerequisites: courseForm.prerequisites,
        scheduleDays: courseForm.schedule.days,
        scheduleTime: `${courseForm.schedule.startTime}-${courseForm.schedule.endTime}`,
        room: courseForm.schedule.room,
        semester: 'Fall',
        year: 2024,
        isActive: true
      };

      if (editingCourse) {
        await axios.put(`/api/courses/${editingCourse.id}`, courseData, {
          headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
        });
        toast.success('Course updated successfully');
      } else {
        await axios.post('/api/courses', courseData, {
          headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
        });
        toast.success('Course created successfully');
      }

      setShowCourseModal(false);
      setEditingCourse(null);
      resetCourseForm();
      fetchData();
    } catch (error) {
      console.error('Error saving course:', error);
      toast.error(error.response?.data?.message || 'Failed to save course');
    }
  };

  const handleIncreaseCapacity = async (courseId, newCapacity) => {
    try {
      const response = await axios.put(`/api/admin/courses/${courseId}/capacity`, 
        { newCapacity },
        { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } }
      );
      
      toast.success(response.data.message);
      if (response.data.autoApproved > 0) {
        toast.success(`${response.data.autoApproved} students automatically approved!`);
      }
      fetchData();
    } catch (error) {
      console.error('Error increasing capacity:', error);
      toast.error(error.response?.data?.message || 'Failed to increase capacity');
    }
  };

  const handleResolveConflict = async (courseId, action, options = {}) => {
    try {
      const response = await axios.post(`/api/admin/resolve-conflict/${courseId}`, 
        { action, ...options },
        { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } }
      );
      
      toast.success(response.data.message);
      fetchData();
    } catch (error) {
      console.error('Error resolving conflict:', error);
      toast.error(error.response?.data?.message || 'Failed to resolve conflict');
    }
  };

  const handleEditCourse = (course) => {
    setEditingCourse(course);
    setCourseForm({
      code: course.code,
      name: course.name,
      description: course.description,
      credits: course.credits,
      department: course.department,
      instructor: course.instructor,
      maxCapacity: course.max_capacity,
      schedule: course.schedule ? JSON.parse(course.schedule) : {
        days: [],
        startTime: '',
        endTime: '',
        room: ''
      },
      prerequisites: course.prerequisites || ''
    });
    setShowCourseModal(true);
  };

  const handleDeleteCourse = async (courseId) => {
    if (!window.confirm('Are you sure you want to delete this course? This action cannot be undone.')) return;
    
    try {
      await axios.delete(`/admin/courses/${courseId}`);
      toast.success('Course deleted successfully');
      fetchData();
    } catch (error) {
      console.error('Error deleting course:', error);
      toast.error('Failed to delete course');
    }
  };

  const handleCapacityAdjustment = async (courseId, newCapacity) => {
    try {
      await axios.put(`/admin/courses/${courseId}`, { maxCapacity: newCapacity });
      toast.success('Course capacity updated successfully');
      fetchData();
    } catch (error) {
      console.error('Error updating capacity:', error);
      toast.error('Failed to update capacity');
    }
  };

  const resetCourseForm = () => {
    setCourseForm({
      code: '',
      name: '',
      description: '',
      credits: 3,
      department: '',
      instructor: '',
      maxCapacity: 30,
      schedule: {
        days: [],
        startTime: '',
        endTime: '',
        room: ''
      },
      prerequisites: ''
    });
  };

  const handleScheduleDayToggle = (day) => {
    setCourseForm(prev => ({
      ...prev,
      schedule: {
        ...prev.schedule,
        days: prev.schedule.days.includes(day)
          ? prev.schedule.days.filter(d => d !== day)
          : [...prev.schedule.days, day]
      }
    }));
  };

  if (loading) {
    return <LoadingSpinner text="Loading course management..." />;
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 flex items-center">
                <BookOpenIcon className="h-8 w-8 text-primary-600 mr-3" />
                Course Management
              </h1>
              <p className="mt-2 text-gray-600">
                Manage course offerings, schedules, and resolve conflicts
              </p>
            </div>
            <button
              onClick={() => setShowCourseModal(true)}
              className="btn btn-primary flex items-center space-x-2"
            >
              <PlusIcon className="h-5 w-5" />
              <span>Add New Course</span>
            </button>
          </div>
        </div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="bg-blue-100 p-3 rounded-full">
                <BookOpenIcon className="h-6 w-6 text-blue-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Courses</p>
                <p className="text-2xl font-bold text-gray-900">{data.courses?.length || 0}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="bg-red-100 p-3 rounded-full">
                <ExclamationTriangleIcon className="h-6 w-6 text-red-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Schedule Conflicts</p>
                <p className="text-2xl font-bold text-gray-900">{data.scheduleStats?.scheduleConflicts?.length || 0}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="bg-orange-100 p-3 rounded-full">
                <UsersIcon className="h-6 w-6 text-orange-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Over-Enrolled</p>
                <p className="text-2xl font-bold text-gray-900">{data.conflicts?.length || 0}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="bg-green-100 p-3 rounded-full">
                <CheckCircleIcon className="h-6 w-6 text-green-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Available Slots</p>
                <p className="text-2xl font-bold text-gray-900">{data.courses?.reduce((total, course) => total + Math.max(0, course.max_capacity - course.current_enrollment), 0) || 0}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="border-b border-gray-200 mb-8">
          <nav className="-mb-px flex space-x-8">
            {[
              { id: 'courses', name: 'Course Offerings', icon: BookOpenIcon },
              { id: 'schedules', name: 'Schedule Management', icon: CalendarIcon },
              { id: 'conflicts', name: 'Conflict Resolution', icon: ExclamationTriangleIcon }
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

        {/* Course Offerings Tab */}
        {activeTab === 'courses' && (
          <div className="bg-white rounded-lg shadow">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-xl font-semibold text-gray-900">Course Offerings</h2>
            </div>
            <div className="p-6">
              {data.courses.length === 0 ? (
                <div className="text-center py-12">
                  <BookOpenIcon className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No courses found</h3>
                  <p className="text-gray-500 mb-6">Get started by adding your first course</p>
                  <button
                    onClick={() => setShowCourseModal(true)}
                    className="btn btn-primary"
                  >
                    Add First Course
                  </button>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Course
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Instructor
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Schedule
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Enrollment
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Status
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {data.courses.map((course) => {
                        const schedule = course.schedule ? JSON.parse(course.schedule) : null;
                        const isOverEnrolled = course.current_enrollment > course.max_capacity;
                        const enrollmentPercentage = (course.current_enrollment / course.max_capacity) * 100;
                        
                        return (
                          <tr key={course.id} className="hover:bg-gray-50">
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div>
                                <div className="text-sm font-medium text-gray-900">
                                  {course.code} - {course.name}
                                </div>
                                <div className="text-sm text-gray-500">
                                  {course.department} • {course.credits} credits
                                </div>
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                              {course.instructor}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {schedule ? (
                                <div>
                                  <div>{schedule.days?.join(', ')}</div>
                                  <div>{schedule.startTime} - {schedule.endTime}</div>
                                  <div className="text-xs">{schedule.room}</div>
                                </div>
                              ) : (
                                'Not scheduled'
                              )}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="flex items-center">
                                <div className="flex-1">
                                  <div className="text-sm font-medium text-gray-900">
                                    {course.current_enrollment} / {course.max_capacity}
                                  </div>
                                  <div className="w-full bg-gray-200 rounded-full h-2 mt-1">
                                    <div
                                      className={`h-2 rounded-full ${
                                        isOverEnrolled ? 'bg-red-500' : 
                                        enrollmentPercentage > 80 ? 'bg-yellow-500' : 'bg-green-500'
                                      }`}
                                      style={{ width: `${Math.min(enrollmentPercentage, 100)}%` }}
                                    ></div>
                                  </div>
                                </div>
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              {isOverEnrolled ? (
                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                                  Over-enrolled
                                </span>
                              ) : enrollmentPercentage > 80 ? (
                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                                  Nearly full
                                </span>
                              ) : (
                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                  Available
                                </span>
                              )}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                              <div className="flex space-x-2">
                                <button
                                  onClick={() => handleEditCourse(course)}
                                  className="text-primary-600 hover:text-primary-900"
                                >
                                  <PencilIcon className="h-4 w-4" />
                                </button>
                                <button
                                  onClick={() => handleDeleteCourse(course.id)}
                                  className="text-red-600 hover:text-red-900"
                                >
                                  <TrashIcon className="h-4 w-4" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Schedule Management Tab */}
        {activeTab === 'schedules' && (
          <div className="space-y-6">
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Schedule Overview</h2>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Time Slot Usage */}
                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-3">Popular Time Slots</h3>
                  <div className="space-y-2">
                    {['9:00 AM - 10:30 AM', '10:30 AM - 12:00 PM', '1:00 PM - 2:30 PM', '2:30 PM - 4:00 PM'].map((timeSlot, index) => {
                      const usage = Math.floor(Math.random() * 8) + 1;
                      return (
                        <div key={timeSlot} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                          <span className="text-sm font-medium text-gray-900">{timeSlot}</span>
                          <div className="flex items-center space-x-2">
                            <span className="text-sm text-gray-500">{usage} courses</span>
                            <div className="w-20 bg-gray-200 rounded-full h-2">
                              <div
                                className="bg-primary-500 h-2 rounded-full"
                                style={{ width: `${(usage / 8) * 100}%` }}
                              ></div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Room Utilization */}
                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-3">Room Utilization</h3>
                  <div className="space-y-2">
                    {['Room A101', 'Room B205', 'Lab C301', 'Auditorium D'].map((room, index) => {
                      const utilization = Math.floor(Math.random() * 100) + 1;
                      return (
                        <div key={room} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                          <span className="text-sm font-medium text-gray-900">{room}</span>
                          <div className="flex items-center space-x-2">
                            <span className="text-sm text-gray-500">{utilization}%</span>
                            <div className="w-20 bg-gray-200 rounded-full h-2">
                              <div
                                className={`h-2 rounded-full ${
                                  utilization > 80 ? 'bg-red-500' : 
                                  utilization > 60 ? 'bg-yellow-500' : 'bg-green-500'
                                }`}
                                style={{ width: `${utilization}%` }}
                              ></div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Conflict Resolution Tab */}
        {activeTab === 'conflicts' && (
          <div className="space-y-6">
            {/* Over-enrolled Courses */}
            <div className="bg-white rounded-lg shadow">
              <div className="px-6 py-4 border-b border-gray-200">
                <h2 className="text-xl font-semibold text-gray-900 flex items-center">
                  <ExclamationTriangleIcon className="h-6 w-6 text-red-500 mr-2" />
                  Over-enrolled Courses ({data.conflicts?.length || 0})
                </h2>
              </div>
              <div className="p-6">
                {(!data.conflicts || data.conflicts.length === 0) ? (
                  <div className="text-center py-12">
                    <CheckCircleIcon className="h-16 w-16 text-green-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No over-enrollment conflicts</h3>
                    <p className="text-gray-500">All courses are within their capacity limits</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {data.conflicts.map((course) => (
                      <div key={course.id} className="border border-red-200 rounded-lg p-4 bg-red-50">
                        <div className="flex items-start justify-between">
                          <div className="flex">
                            <ExclamationTriangleIcon className="h-5 w-5 text-red-500 mt-0.5 mr-3" />
                            <div>
                              <h4 className="text-sm font-medium text-red-900">
                                {course.course_code} - {course.course_name}
                              </h4>
                              <p className="text-sm text-red-700 mt-1">
                                Current enrollment: {course.current_enrollment} / {course.max_capacity}
                                ({course.overflow} over capacity)
                              </p>
                              <p className="text-sm text-red-600 mt-1">
                                Pending requests: {course.pending_requests}
                              </p>
                            </div>
                          </div>
                          <div className="flex space-x-2">
                            <button
                              onClick={() => {
                                const newCapacity = prompt(
                                  `Enter new capacity for ${course.course_code} (current: ${course.max_capacity}):`
                                );
                                if (newCapacity && parseInt(newCapacity) > course.max_capacity) {
                                  handleIncreaseCapacity(course.id, parseInt(newCapacity));
                                }
                              }}
                              className="text-sm bg-blue-100 text-blue-700 px-3 py-1 rounded-md hover:bg-blue-200"
                            >
                              Increase Capacity
                            </button>
                            <button
                              onClick={() => handleResolveConflict(course.id, 'increase_capacity', {
                                newCapacity: course.current_enrollment + 5
                              })}
                              className="text-sm bg-green-100 text-green-700 px-3 py-1 rounded-md hover:bg-green-200"
                            >
                              Auto-resolve (+5)
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Near Capacity Courses */}
            <div className="bg-white rounded-lg shadow">
              <div className="px-6 py-4 border-b border-gray-200">
                <h2 className="text-xl font-semibold text-gray-900 flex items-center">
                  <ClockIcon className="h-6 w-6 text-yellow-500 mr-2" />
                  Near Capacity Courses ({data.nearCapacity?.length || 0})
                </h2>
              </div>
              <div className="p-6">
                {(!data.nearCapacity || data.nearCapacity.length === 0) ? (
                  <div className="text-center py-8">
                    <p className="text-gray-500">No courses are near capacity</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {data.nearCapacity.map((course) => (
                      <div key={course.id} className="border border-yellow-200 rounded-lg p-4 bg-yellow-50">
                        <div className="flex items-start justify-between">
                          <div>
                            <h4 className="text-sm font-medium text-yellow-900">
                              {course.course_code} - {course.course_name}
                            </h4>
                            <p className="text-sm text-yellow-700 mt-1">
                              {course.current_enrollment} / {course.max_capacity} enrolled
                            </p>
                            <p className="text-sm text-yellow-600">
                              {course.remaining_seats} seats remaining
                            </p>
                            {course.pending_requests > 0 && (
                              <p className="text-sm text-yellow-600">
                                {course.pending_requests} pending requests
                              </p>
                            )}
                          </div>
                          <div className="w-16 h-16">
                            <div className="relative w-full h-full">
                              <svg className="w-full h-full transform -rotate-90" viewBox="0 0 36 36">
                                <path
                                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                                  fill="none"
                                  stroke="#e5e7eb"
                                  strokeWidth="2"
                                />
                                <path
                                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                                  fill="none"
                                  stroke="#f59e0b"
                                  strokeWidth="2"
                                  strokeDasharray={`${(course.current_enrollment / course.max_capacity) * 100}, 100`}
                                />
                              </svg>
                              <div className="absolute inset-0 flex items-center justify-center">
                                <span className="text-xs font-medium text-yellow-700">
                                  {Math.round((course.current_enrollment / course.max_capacity) * 100)}%
                                </span>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Waitlist Statistics */}
            <div className="bg-white rounded-lg shadow">
              <div className="px-6 py-4 border-b border-gray-200">
                <h2 className="text-xl font-semibold text-gray-900 flex items-center">
                  <UserGroupIcon className="h-6 w-6 text-blue-500 mr-2" />
                  Waitlist Overview ({data.waitlist?.length || 0})
                </h2>
              </div>
              <div className="p-6">
                {(!data.waitlist || data.waitlist.length === 0) ? (
                  <div className="text-center py-8">
                    <p className="text-gray-500">No courses have active waitlists</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Course
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Capacity
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Waitlist
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Actions
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {data.waitlist.map((course) => (
                          <tr key={course.id} className="hover:bg-gray-50">
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-sm font-medium text-gray-900">
                                {course.course_code}
                              </div>
                              <div className="text-sm text-gray-500">
                                {course.course_name}
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                              {course.current_enrollment} / {course.max_capacity}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                {course.waitlist_count} students
                              </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                              <button
                                onClick={() => {
                                  const increase = prompt(
                                    `How many seats to add to ${course.course_code}?`,
                                    course.waitlist_count.toString()
                                  );
                                  if (increase && parseInt(increase) > 0) {
                                    handleIncreaseCapacity(course.id, course.max_capacity + parseInt(increase));
                                  }
                                }}
                                className="text-primary-600 hover:text-primary-900"
                              >
                                Increase Capacity
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
          </div>
        )}
      </div>

      {/* Course Modal */}
      <CourseModal
        show={showCourseModal}
        onClose={() => {
          setShowCourseModal(false);
          setEditingCourse(null);
          resetCourseForm();
        }}
        courseForm={courseForm}
        setCourseForm={setCourseForm}
        onSave={handleCreateCourse}
        editingCourse={editingCourse}
        departments={departments}
        daysOfWeek={daysOfWeek}
      />
    </div>
  );
};

export default AdminCourseManagement;
