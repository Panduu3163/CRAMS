import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import axios from 'axios';
import toast from 'react-hot-toast';
import LoadingSpinner from '../components/LoadingSpinner';
import {
  BookOpenIcon,
  MagnifyingGlassIcon,
  FunnelIcon,
  PlusIcon,
  ClockIcon,
  UserIcon,
  ExclamationTriangleIcon
} from '@heroicons/react/24/outline';

const Courses = () => {
  const { user, isStudent } = useAuth();
  const [loading, setLoading] = useState(true);
  const [courses, setCourses] = useState([]);
  const [filteredCourses, setFilteredCourses] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [filters, setFilters] = useState({
    search: '',
    department: '',
    semester: '',
    year: new Date().getFullYear()
  });
  const [selectedCourses, setSelectedCourses] = useState([]);
  const [conflicts, setConflicts] = useState([]);

  useEffect(() => {
    fetchCourses();
    fetchDepartments();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [courses, filters]);

  const fetchCourses = async () => {
    try {
      setLoading(true);
      const response = await axios.get('/courses', {
        params: {
          department: filters.department,
          semester: filters.semester,
          year: filters.year,
          search: filters.search
        }
      });
      setCourses(response.data.courses);
    } catch (error) {
      console.error('Error fetching courses:', error);
      toast.error('Failed to load courses');
    } finally {
      setLoading(false);
    }
  };

  const fetchDepartments = async () => {
    try {
      const response = await axios.get('/courses/meta/departments');
      setDepartments(response.data.departments);
    } catch (error) {
      console.error('Error fetching departments:', error);
    }
  };

  const applyFilters = () => {
    let filtered = courses;

    if (filters.search) {
      filtered = filtered.filter(course =>
        course.course_name.toLowerCase().includes(filters.search.toLowerCase()) ||
        course.course_code.toLowerCase().includes(filters.search.toLowerCase()) ||
        course.description?.toLowerCase().includes(filters.search.toLowerCase())
      );
    }

    if (filters.department) {
      filtered = filtered.filter(course => course.department === filters.department);
    }

    if (filters.semester) {
      filtered = filtered.filter(course => course.semester === filters.semester);
    }

    setFilteredCourses(filtered);
  };

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const handleCourseSelect = (course) => {
    if (selectedCourses.find(c => c.id === course.id)) {
      setSelectedCourses(prev => prev.filter(c => c.id !== course.id));
    } else {
      setSelectedCourses(prev => [...prev, course]);
    }
  };

  const checkConflicts = async () => {
    if (selectedCourses.length < 2) {
      setConflicts([]);
      return;
    }

    try {
      const response = await axios.post('/courses/check-conflicts', {
        courseIds: selectedCourses.map(c => c.id)
      });
      setConflicts(response.data.conflicts || []);
    } catch (error) {
      console.error('Error checking conflicts:', error);
    }
  };

  const handleSelectCourse = async (courseId) => {
    try {
      await axios.post('/student/select-course', { courseId });
      toast.success('Course selected successfully!');
      fetchCourses(); // Refresh to update enrollment numbers
    } catch (error) {
      const message = error.response?.data?.message || 'Failed to select course';
      toast.error(message);
    }
  };

  useEffect(() => {
    checkConflicts();
  }, [selectedCourses]);

  if (loading) {
    return <LoadingSpinner text="Loading courses..." />;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Course Catalog</h1>
          <p className="text-gray-600 mt-1">Browse and select courses for registration</p>
        </div>
        {isStudent && selectedCourses.length > 0 && (
          <div className="bg-primary-50 border border-primary-200 rounded-lg p-3">
            <p className="text-sm text-primary-700">
              {selectedCourses.length} course{selectedCourses.length !== 1 ? 's' : ''} selected
            </p>
          </div>
        )}
      </div>

      {/* Filters */}
      <div className="card p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Search */}
          <div>
            <label className="label">Search</label>
            <div className="relative mt-1">
              <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type="text"
                className="input pl-10"
                placeholder="Search courses..."
                value={filters.search}
                onChange={(e) => handleFilterChange('search', e.target.value)}
              />
            </div>
          </div>

          {/* Department */}
          <div>
            <label className="label">Department</label>
            <select
              className="input mt-1"
              value={filters.department}
              onChange={(e) => handleFilterChange('department', e.target.value)}
            >
              <option value="">All Departments</option>
              {departments.map(dept => (
                <option key={dept} value={dept}>{dept}</option>
              ))}
            </select>
          </div>

          {/* Semester */}
          <div>
            <label className="label">Semester</label>
            <select
              className="input mt-1"
              value={filters.semester}
              onChange={(e) => handleFilterChange('semester', e.target.value)}
            >
              <option value="">All Semesters</option>
              <option value="Fall">Fall</option>
              <option value="Spring">Spring</option>
              <option value="Summer">Summer</option>
            </select>
          </div>

          {/* Year */}
          <div>
            <label className="label">Year</label>
            <select
              className="input mt-1"
              value={filters.year}
              onChange={(e) => handleFilterChange('year', parseInt(e.target.value))}
            >
              <option value={new Date().getFullYear()}>{new Date().getFullYear()}</option>
              <option value={new Date().getFullYear() + 1}>{new Date().getFullYear() + 1}</option>
            </select>
          </div>
        </div>
      </div>

      {/* Conflicts Warning */}
      {conflicts.length > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-start">
            <ExclamationTriangleIcon className="h-5 w-5 text-red-600 mt-0.5 mr-3 flex-shrink-0" />
            <div>
              <h3 className="text-sm font-medium text-red-800">Schedule Conflicts Detected</h3>
              <div className="mt-2 text-sm text-red-700">
                {conflicts.map((conflict, index) => (
                  <p key={index} className="mb-1">
                    {conflict.course1.code} conflicts with {conflict.course2.code} 
                    ({conflict.course1.schedule})
                  </p>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Course Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredCourses.map((course) => (
          <div key={course.id} className={`card p-6 transition-all duration-200 ${
            selectedCourses.find(c => c.id === course.id) 
              ? 'ring-2 ring-primary-500 bg-primary-50' 
              : 'hover:shadow-md'
          }`}>
            {/* Course Header */}
            <div className="flex justify-between items-start mb-4">
              <div>
                <h3 className="text-lg font-semibold text-gray-900">{course.course_code}</h3>
                <p className="text-sm text-gray-600">{course.course_name}</p>
              </div>
              <div className="text-right">
                <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                  course.available_seats > 0 
                    ? 'bg-green-100 text-green-800' 
                    : 'bg-red-100 text-red-800'
                }`}>
                  {course.available_seats > 0 ? `${course.available_seats} seats` : 'Full'}
                </span>
              </div>
            </div>

            {/* Course Details */}
            <div className="space-y-2 text-sm text-gray-600 mb-4">
              <div className="flex items-center">
                <BookOpenIcon className="h-4 w-4 mr-2" />
                <span>{course.credits} Credits</span>
              </div>
              <div className="flex items-center">
                <ClockIcon className="h-4 w-4 mr-2" />
                <span>{course.schedule_days} {course.schedule_time}</span>
              </div>
              <div className="flex items-center">
                <UserIcon className="h-4 w-4 mr-2" />
                <span>{course.instructor || 'TBA'}</span>
              </div>
              <p className="text-gray-500">{course.department}</p>
            </div>

            {/* Course Description */}
            {course.description && (
              <p className="text-sm text-gray-600 mb-4 line-clamp-3">
                {course.description}
              </p>
            )}

            {/* Prerequisites */}
            {course.prerequisites && course.prerequisites.length > 0 && (
              <div className="mb-4">
                <p className="text-xs font-medium text-gray-700 mb-1">Prerequisites:</p>
                <p className="text-xs text-gray-600">
                  {course.prerequisites.join(', ')}
                </p>
              </div>
            )}

            {/* Enrollment Progress */}
            <div className="mb-4">
              <div className="flex justify-between text-xs text-gray-600 mb-1">
                <span>Enrollment</span>
                <span>{course.current_enrollment}/{course.max_capacity}</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className={`h-2 rounded-full ${
                    course.current_enrollment >= course.max_capacity 
                      ? 'bg-red-500' 
                      : course.current_enrollment / course.max_capacity > 0.8 
                        ? 'bg-yellow-500' 
                        : 'bg-green-500'
                  }`}
                  style={{
                    width: `${Math.min((course.current_enrollment / course.max_capacity) * 100, 100)}%`
                  }}
                ></div>
              </div>
            </div>

            {/* Actions */}
            {isStudent && (
              <div className="flex space-x-2">
                <button
                  onClick={() => handleCourseSelect(course)}
                  className={`flex-1 btn btn-sm ${
                    selectedCourses.find(c => c.id === course.id)
                      ? 'btn-secondary'
                      : 'btn-outline'
                  }`}
                >
                  {selectedCourses.find(c => c.id === course.id) ? 'Selected' : 'Select'}
                </button>
                <button
                  onClick={() => handleSelectCourse(course.id)}
                  disabled={course.available_seats === 0}
                  className="flex-1 btn btn-primary btn-sm disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <PlusIcon className="h-4 w-4 mr-1" />
                  {course.available_seats > 0 ? 'Enroll' : 'Full'}
                </button>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* No Results */}
      {filteredCourses.length === 0 && (
        <div className="text-center py-12">
          <BookOpenIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No courses found</h3>
          <p className="text-gray-600">Try adjusting your search criteria</p>
        </div>
      )}

      {/* Selected Courses Summary (for students) */}
      {isStudent && selectedCourses.length > 0 && (
        <div className="fixed bottom-6 right-6 bg-white rounded-lg shadow-lg border border-gray-200 p-4 max-w-sm">
          <h3 className="font-medium text-gray-900 mb-2">Selected Courses ({selectedCourses.length})</h3>
          <div className="space-y-2 max-h-40 overflow-y-auto">
            {selectedCourses.map(course => (
              <div key={course.id} className="flex justify-between items-center text-sm">
                <span>{course.course_code}</span>
                <button
                  onClick={() => handleCourseSelect(course)}
                  className="text-red-600 hover:text-red-800"
                >
                  Remove
                </button>
              </div>
            ))}
          </div>
          <div className="mt-3 pt-3 border-t border-gray-200">
            <p className="text-sm text-gray-600">
              Total Credits: {selectedCourses.reduce((sum, course) => sum + course.credits, 0)}
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default Courses;
