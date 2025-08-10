import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import axios from 'axios';
import toast from 'react-hot-toast';
import LoadingSpinner from '../../components/LoadingSpinner';
import {
  UserGroupIcon,
  ClockIcon,
  CheckCircleIcon,
  XCircleIcon,
  ChartBarIcon,
  EyeIcon,
  ChatBubbleLeftRightIcon
} from '@heroicons/react/24/outline';

const AdvisorDashboard = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState({
    pendingSelections: [],
    students: [],
    statistics: {}
  });
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [reviewModal, setReviewModal] = useState({ show: false, selection: null });
  const [reviewData, setReviewData] = useState({ status: '', comments: '' });

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const [pendingRes, studentsRes, statsRes] = await Promise.all([
        axios.get('/advisor/pending-selections'),
        axios.get('/advisor/students'),
        axios.get('/advisor/statistics')
      ]);

      setData({
        pendingSelections: pendingRes.data.selections,
        students: studentsRes.data.students,
        statistics: statsRes.data.statistics
      });
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      toast.error('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  const handleReviewSelection = async () => {
    try {
      await axios.put(`/advisor/selections/${reviewModal.selection.id}/review`, reviewData);
      toast.success(`Selection ${reviewData.status} successfully`);
      setReviewModal({ show: false, selection: null });
      setReviewData({ status: '', comments: '' });
      fetchDashboardData();
    } catch (error) {
      const message = error.response?.data?.message || 'Failed to review selection';
      toast.error(message);
    }
  };

  const openReviewModal = (selection) => {
    setReviewModal({ show: true, selection });
    setReviewData({ status: '', comments: '' });
  };

  const handleBulkApprove = async (selectionIds) => {
    try {
      await axios.put('/advisor/selections/bulk-review', {
        selectionIds,
        status: 'approved',
        comments: 'Bulk approved'
      });
      toast.success('Selections approved successfully');
      fetchDashboardData();
    } catch (error) {
      toast.error('Failed to bulk approve selections');
    }
  };

  if (loading) {
    return <LoadingSpinner text="Loading advisor dashboard..." />;
  }

  const stats = data.statistics;

  return (
    <div className="space-y-6">
      {/* Welcome Header */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-700 rounded-lg p-6 text-white">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Advisor Dashboard</h1>
            <p className="text-blue-100 mt-1">
              Welcome, {user?.firstName} {user?.lastName} • {user?.department}
            </p>
          </div>
          <div className="hidden md:block">
            <div className="bg-white/20 p-3 rounded-full">
              <UserGroupIcon className="h-8 w-8" />
            </div>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="card p-6">
          <div className="flex items-center">
            <div className="bg-yellow-100 p-3 rounded-full">
              <ClockIcon className="h-6 w-6 text-yellow-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Pending Reviews</p>
              <p className="text-2xl font-bold text-gray-900">{stats.pendingSelections || 0}</p>
            </div>
          </div>
        </div>

        <div className="card p-6">
          <div className="flex items-center">
            <div className="bg-green-100 p-3 rounded-full">
              <CheckCircleIcon className="h-6 w-6 text-green-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Approved</p>
              <p className="text-2xl font-bold text-gray-900">{stats.approvedSelections || 0}</p>
            </div>
          </div>
        </div>

        <div className="card p-6">
          <div className="flex items-center">
            <div className="bg-red-100 p-3 rounded-full">
              <XCircleIcon className="h-6 w-6 text-red-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Rejected</p>
              <p className="text-2xl font-bold text-gray-900">{stats.rejectedSelections || 0}</p>
            </div>
          </div>
        </div>

        <div className="card p-6">
          <div className="flex items-center">
            <div className="bg-blue-100 p-3 rounded-full">
              <UserGroupIcon className="h-6 w-6 text-blue-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Assigned Students</p>
              <p className="text-2xl font-bold text-gray-900">{stats.assignedStudents || 0}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Pending Course Selections */}
        <div className="lg:col-span-2 card">
          <div className="p-6 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-900">Pending Course Selections</h2>
              {data.pendingSelections.length > 0 && (
                <button
                  onClick={() => handleBulkApprove(data.pendingSelections.map(s => s.id))}
                  className="btn btn-primary btn-sm"
                >
                  Approve All
                </button>
              )}
            </div>
          </div>
          <div className="p-6">
            {data.pendingSelections.length === 0 ? (
              <div className="text-center py-8">
                <ClockIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500">No pending reviews</p>
              </div>
            ) : (
              <div className="space-y-4">
                {data.pendingSelections.map((selection) => (
                  <div key={selection.id} className="border border-gray-200 rounded-lg p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-2">
                          <h3 className="font-medium text-gray-900">
                            {selection.course_code} - {selection.course_name}
                          </h3>
                          <span className="px-2 py-1 text-xs bg-yellow-100 text-yellow-800 rounded-full">
                            Pending
                          </span>
                        </div>
                        <p className="text-sm text-gray-600 mb-1">
                          Student: {selection.student_first_name} {selection.student_last_name} ({selection.student_id})
                        </p>
                        <p className="text-sm text-gray-600 mb-1">
                          {selection.credits} credits • {selection.schedule_days} {selection.schedule_time}
                        </p>
                        <p className="text-sm text-gray-500">
                          Submitted: {new Date(selection.selected_at).toLocaleDateString()}
                        </p>
                        {selection.current_enrollment >= selection.max_capacity && (
                          <p className="text-sm text-red-600 mt-1">⚠️ Course is at capacity</p>
                        )}
                      </div>
                      <div className="flex space-x-2">
                        <button
                          onClick={() => openReviewModal(selection)}
                          className="btn btn-outline btn-sm"
                        >
                          <EyeIcon className="h-4 w-4 mr-1" />
                          Review
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Assigned Students */}
        <div className="card">
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">My Students</h2>
          </div>
          <div className="p-6">
            {data.students.length === 0 ? (
              <div className="text-center py-8">
                <UserGroupIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500">No assigned students</p>
              </div>
            ) : (
              <div className="space-y-3">
                {data.students.slice(0, 8).map((student) => (
                  <div key={student.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div>
                      <p className="font-medium text-gray-900">
                        {student.first_name} {student.last_name}
                      </p>
                      <p className="text-sm text-gray-600">{student.student_id}</p>
                      <p className="text-xs text-gray-500">Year {student.year_level}</p>
                    </div>
                    <button
                      onClick={() => setSelectedStudent(student)}
                      className="text-primary-600 hover:text-primary-800 text-sm"
                    >
                      View
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Review Modal */}
      {reviewModal.show && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-2xl w-full">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold text-gray-900">Review Course Selection</h2>
                <button
                  onClick={() => setReviewModal({ show: false, selection: null })}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <XCircleIcon className="h-6 w-6" />
                </button>
              </div>
            </div>
            <div className="p-6">
              {reviewModal.selection && (
                <div className="space-y-4">
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <h3 className="font-medium text-gray-900 mb-2">
                      {reviewModal.selection.course_code} - {reviewModal.selection.course_name}
                    </h3>
                    <p className="text-sm text-gray-600">
                      Student: {reviewModal.selection.student_first_name} {reviewModal.selection.student_last_name}
                    </p>
                    <p className="text-sm text-gray-600">
                      Schedule: {reviewModal.selection.schedule_days} {reviewModal.selection.schedule_time}
                    </p>
                    <p className="text-sm text-gray-600">
                      Enrollment: {reviewModal.selection.current_enrollment}/{reviewModal.selection.max_capacity}
                    </p>
                  </div>

                  <div>
                    <label className="label">Decision</label>
                    <select
                      className="input mt-1"
                      value={reviewData.status}
                      onChange={(e) => setReviewData({ ...reviewData, status: e.target.value })}
                    >
                      <option value="">Select decision</option>
                      <option value="approved">Approve</option>
                      <option value="rejected">Reject</option>
                    </select>
                  </div>

                  <div>
                    <label className="label">Comments</label>
                    <textarea
                      className="input mt-1"
                      rows={3}
                      placeholder="Add comments for the student..."
                      value={reviewData.comments}
                      onChange={(e) => setReviewData({ ...reviewData, comments: e.target.value })}
                    />
                  </div>

                  <div className="flex space-x-3">
                    <button
                      onClick={handleReviewSelection}
                      disabled={!reviewData.status}
                      className="btn btn-primary btn-md disabled:opacity-50"
                    >
                      Submit Review
                    </button>
                    <button
                      onClick={() => setReviewModal({ show: false, selection: null })}
                      className="btn btn-secondary btn-md"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Student Detail Modal */}
      {selectedStudent && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-3xl w-full max-h-[90vh] overflow-hidden">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold text-gray-900">
                  {selectedStudent.first_name} {selectedStudent.last_name}
                </h2>
                <button
                  onClick={() => setSelectedStudent(null)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <XCircleIcon className="h-6 w-6" />
                </button>
              </div>
            </div>
            <div className="p-6 overflow-y-auto">
              <div className="grid grid-cols-2 gap-4 mb-6">
                <div>
                  <p className="text-sm font-medium text-gray-600">Student ID</p>
                  <p className="text-gray-900">{selectedStudent.student_id}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-600">Email</p>
                  <p className="text-gray-900">{selectedStudent.email}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-600">Department</p>
                  <p className="text-gray-900">{selectedStudent.department}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-600">Year Level</p>
                  <p className="text-gray-900">Year {selectedStudent.year_level}</p>
                </div>
              </div>
              
              <div className="text-center py-8">
                <ChatBubbleLeftRightIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500">Student course selections would be displayed here</p>
                <p className="text-sm text-gray-400">Feature available in full implementation</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdvisorDashboard;
