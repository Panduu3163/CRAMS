import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import axios from 'axios';
import toast from 'react-hot-toast';
import LoadingSpinner from '../../components/LoadingSpinner';
import {
  UserGroupIcon,
  LinkIcon,
  AcademicCapIcon,
  UsersIcon,
  TrashIcon,
  PlusIcon
} from '@heroicons/react/24/outline';

const AdminAssignments = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState({
    assignments: [],
    students: [],
    advisors: []
  });
  const [showAssignmentModal, setShowAssignmentModal] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState('');
  const [selectedAdvisor, setSelectedAdvisor] = useState('');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [assignmentsRes, usersRes] = await Promise.all([
        axios.get('/admin/advisor-assignments'),
        axios.get('/admin/users')
      ]);

      // Separate students and advisors from users
      const students = usersRes.data.users.filter(user => user.role === 'student');
      const advisors = usersRes.data.users.filter(user => user.role === 'advisor');

      setData({
        assignments: assignmentsRes.data.assignments || [],
        students: students,
        advisors: advisors
      });
    } catch (error) {
      console.error('Error fetching data:', error);
      toast.error('Failed to load assignment data');
    } finally {
      setLoading(false);
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
      fetchData();
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
      fetchData();
    } catch (error) {
      console.error('Error removing assignment:', error);
      toast.error('Failed to remove assignment');
    }
  };

  if (loading) {
    return <LoadingSpinner text="Loading assignments..." />;
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 flex items-center">
                <UserGroupIcon className="h-8 w-8 text-primary-600 mr-3" />
                Student-Advisor Assignments
              </h1>
              <p className="mt-2 text-gray-600">
                Manage student-advisor assignments and relationships
              </p>
            </div>
            <button
              onClick={() => setShowAssignmentModal(true)}
              className="btn btn-primary flex items-center space-x-2"
            >
              <PlusIcon className="h-5 w-5" />
              <span>Assign Student to Advisor</span>
            </button>
          </div>
        </div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="bg-blue-100 p-3 rounded-full">
                <AcademicCapIcon className="h-6 w-6 text-blue-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Students</p>
                <p className="text-2xl font-bold text-gray-900">{data.students.length}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="bg-green-100 p-3 rounded-full">
                <UsersIcon className="h-6 w-6 text-green-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Advisors</p>
                <p className="text-2xl font-bold text-gray-900">{data.advisors.length}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="bg-purple-100 p-3 rounded-full">
                <LinkIcon className="h-6 w-6 text-purple-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Active Assignments</p>
                <p className="text-2xl font-bold text-gray-900">{data.assignments.length}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Current Assignments */}
        <div className="bg-white rounded-lg shadow mb-8">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-xl font-semibold text-gray-900">Current Assignments</h2>
          </div>
          <div className="p-6">
            {data.assignments.length === 0 ? (
              <div className="text-center py-12">
                <UserGroupIcon className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No assignments found</h3>
                <p className="text-gray-500 mb-6">Get started by assigning students to advisors</p>
                <button
                  onClick={() => setShowAssignmentModal(true)}
                  className="btn btn-primary"
                >
                  Create First Assignment
                </button>
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
                      <tr key={assignment.id} className="hover:bg-gray-50">
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
          <div className="bg-white rounded-lg shadow p-6">
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

          <div className="bg-white rounded-lg shadow p-6">
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
    </div>
  );
};

export default AdminAssignments;
