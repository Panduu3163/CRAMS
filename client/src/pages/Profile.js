import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import toast from 'react-hot-toast';
import LoadingSpinner from '../components/LoadingSpinner';
import {
  UserCircleIcon,
  PencilIcon,
  CheckIcon,
  XMarkIcon,
  KeyIcon,
  EnvelopeIcon,
  AcademicCapIcon,
  BuildingOfficeIcon
} from '@heroicons/react/24/outline';

const Profile = () => {
  const { user, updateProfile } = useAuth();
  const [loading, setLoading] = useState(false);
  const [editing, setEditing] = useState(false);
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    department: '',
    yearLevel: 1
  });

  useEffect(() => {
    if (user) {
      setFormData({
        firstName: user.firstName || '',
        lastName: user.lastName || '',
        department: user.department || '',
        yearLevel: user.yearLevel || 1
      });
    }
  }, [user]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name === 'yearLevel' ? parseInt(value) : value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    const result = await updateProfile(formData);
    
    if (result.success) {
      setEditing(false);
    }
    
    setLoading(false);
  };

  const handleCancel = () => {
    setFormData({
      firstName: user.firstName || '',
      lastName: user.lastName || '',
      department: user.department || '',
      yearLevel: user.yearLevel || 1
    });
    setEditing(false);
  };

  const departments = [
    'Computer Science',
    'Engineering',
    'Business Administration',
    'Mathematics',
    'Physics',
    'Chemistry',
    'Biology',
    'English',
    'History',
    'Psychology'
  ];

  if (!user) {
    return <LoadingSpinner text="Loading profile..." />;
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-primary-600 to-primary-700 rounded-lg p-6 text-white">
        <div className="flex items-center space-x-4">
          <div className="w-20 h-20 bg-white/20 rounded-full flex items-center justify-center">
            <UserCircleIcon className="h-12 w-12" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">{user.firstName} {user.lastName}</h1>
            <p className="text-primary-100 capitalize">{user.role}</p>
            {user.studentId && (
              <p className="text-primary-100">Student ID: {user.studentId}</p>
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Profile Information */}
        <div className="lg:col-span-2 card">
          <div className="p-6 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-900">Profile Information</h2>
              {!editing ? (
                <button
                  onClick={() => setEditing(true)}
                  className="btn btn-outline btn-sm"
                >
                  <PencilIcon className="h-4 w-4 mr-1" />
                  Edit
                </button>
              ) : (
                <div className="flex space-x-2">
                  <button
                    onClick={handleSubmit}
                    disabled={loading}
                    className="btn btn-primary btn-sm"
                  >
                    <CheckIcon className="h-4 w-4 mr-1" />
                    Save
                  </button>
                  <button
                    onClick={handleCancel}
                    disabled={loading}
                    className="btn btn-secondary btn-sm"
                  >
                    <XMarkIcon className="h-4 w-4 mr-1" />
                    Cancel
                  </button>
                </div>
              )}
            </div>
          </div>

          <div className="p-6">
            {editing ? (
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="label">First Name</label>
                    <input
                      type="text"
                      name="firstName"
                      className="input mt-1"
                      value={formData.firstName}
                      onChange={handleChange}
                      required
                    />
                  </div>
                  <div>
                    <label className="label">Last Name</label>
                    <input
                      type="text"
                      name="lastName"
                      className="input mt-1"
                      value={formData.lastName}
                      onChange={handleChange}
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="label">Department</label>
                  <select
                    name="department"
                    className="input mt-1"
                    value={formData.department}
                    onChange={handleChange}
                  >
                    <option value="">Select Department</option>
                    {departments.map(dept => (
                      <option key={dept} value={dept}>{dept}</option>
                    ))}
                  </select>
                </div>

                {user.role === 'student' && (
                  <div>
                    <label className="label">Year Level</label>
                    <select
                      name="yearLevel"
                      className="input mt-1"
                      value={formData.yearLevel}
                      onChange={handleChange}
                    >
                      <option value={1}>1st Year</option>
                      <option value={2}>2nd Year</option>
                      <option value={3}>3rd Year</option>
                      <option value={4}>4th Year</option>
                      <option value={5}>5th Year</option>
                    </select>
                  </div>
                )}
              </form>
            ) : (
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="flex items-center space-x-3">
                    <div className="bg-blue-100 p-2 rounded-full">
                      <UserCircleIcon className="h-5 w-5 text-blue-600" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-600">Full Name</p>
                      <p className="text-gray-900">{user.firstName} {user.lastName}</p>
                    </div>
                  </div>

                  <div className="flex items-center space-x-3">
                    <div className="bg-green-100 p-2 rounded-full">
                      <EnvelopeIcon className="h-5 w-5 text-green-600" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-600">Email</p>
                      <p className="text-gray-900">{user.email}</p>
                    </div>
                  </div>

                  <div className="flex items-center space-x-3">
                    <div className="bg-purple-100 p-2 rounded-full">
                      <BuildingOfficeIcon className="h-5 w-5 text-purple-600" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-600">Department</p>
                      <p className="text-gray-900">{user.department || 'Not specified'}</p>
                    </div>
                  </div>

                  <div className="flex items-center space-x-3">
                    <div className="bg-orange-100 p-2 rounded-full">
                      <AcademicCapIcon className="h-5 w-5 text-orange-600" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-600">Role</p>
                      <p className="text-gray-900 capitalize">{user.role}</p>
                    </div>
                  </div>

                  {user.studentId && (
                    <div className="flex items-center space-x-3">
                      <div className="bg-indigo-100 p-2 rounded-full">
                        <AcademicCapIcon className="h-5 w-5 text-indigo-600" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-600">Student ID</p>
                        <p className="text-gray-900">{user.studentId}</p>
                      </div>
                    </div>
                  )}

                  {user.role === 'student' && user.yearLevel && (
                    <div className="flex items-center space-x-3">
                      <div className="bg-pink-100 p-2 rounded-full">
                        <AcademicCapIcon className="h-5 w-5 text-pink-600" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-600">Year Level</p>
                        <p className="text-gray-900">Year {user.yearLevel}</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Account Settings */}
        <div className="space-y-6">
          {/* Account Security */}
          <div className="card">
            <div className="p-6 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">Account Security</h3>
            </div>
            <div className="p-6 space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="bg-red-100 p-2 rounded-full">
                    <KeyIcon className="h-5 w-5 text-red-600" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-900">Password</p>
                    <p className="text-xs text-gray-600">Last changed 30 days ago</p>
                  </div>
                </div>
                <button className="btn btn-outline btn-sm">
                  Change
                </button>
              </div>
            </div>
          </div>

          {/* Account Stats */}
          <div className="card">
            <div className="p-6 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">Account Statistics</h3>
            </div>
            <div className="p-6 space-y-4">
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Member since</span>
                <span className="text-sm font-medium text-gray-900">
                  {user.createdAt ? new Date(user.createdAt).toLocaleDateString() : 'N/A'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Last login</span>
                <span className="text-sm font-medium text-gray-900">Today</span>
              </div>
              {user.role === 'student' && (
                <>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Courses enrolled</span>
                    <span className="text-sm font-medium text-gray-900">0</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Total credits</span>
                    <span className="text-sm font-medium text-gray-900">0</span>
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Quick Actions */}
          <div className="card">
            <div className="p-6 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">Quick Actions</h3>
            </div>
            <div className="p-6 space-y-3">
              {user.role === 'student' && (
                <>
                  <button className="w-full btn btn-outline btn-sm text-left">
                    View My Schedule
                  </button>
                  <button className="w-full btn btn-outline btn-sm text-left">
                    Course Selections
                  </button>
                  <button className="w-full btn btn-outline btn-sm text-left">
                    Notifications
                  </button>
                </>
              )}
              {user.role === 'advisor' && (
                <>
                  <button className="w-full btn btn-outline btn-sm text-left">
                    Pending Reviews
                  </button>
                  <button className="w-full btn btn-outline btn-sm text-left">
                    My Students
                  </button>
                </>
              )}
              {user.role === 'admin' && (
                <>
                  <button className="w-full btn btn-outline btn-sm text-left">
                    User Management
                  </button>
                  <button className="w-full btn btn-outline btn-sm text-left">
                    System Reports
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;
