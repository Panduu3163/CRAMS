import React from 'react';
import { XCircleIcon } from '@heroicons/react/24/outline';

const CourseModal = ({ 
  show, 
  onClose, 
  courseForm, 
  setCourseForm, 
  onSave, 
  editingCourse,
  departments,
  daysOfWeek 
}) => {
  if (!show) return null;

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

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg max-w-2xl w-full p-6 max-h-screen overflow-y-auto">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold text-gray-900">
            {editingCourse ? 'Edit Course' : 'Add New Course'}
          </h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <XCircleIcon className="h-6 w-6" />
          </button>
        </div>

        <div className="space-y-4">
          {/* Basic Course Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Course Code
              </label>
              <input
                type="text"
                value={courseForm.code}
                onChange={(e) => setCourseForm(prev => ({ ...prev, code: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                placeholder="CS101"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Credits
              </label>
              <input
                type="number"
                value={courseForm.credits}
                onChange={(e) => setCourseForm(prev => ({ ...prev, credits: parseInt(e.target.value) }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                min="1"
                max="6"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Course Name
            </label>
            <input
              type="text"
              value={courseForm.name}
              onChange={(e) => setCourseForm(prev => ({ ...prev, name: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
              placeholder="Introduction to Programming"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Description
            </label>
            <textarea
              value={courseForm.description}
              onChange={(e) => setCourseForm(prev => ({ ...prev, description: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
              rows="3"
              placeholder="Course description..."
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Department
              </label>
              <select
                value={courseForm.department}
                onChange={(e) => setCourseForm(prev => ({ ...prev, department: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
              >
                <option value="">Select Department</option>
                {departments.map(dept => (
                  <option key={dept} value={dept}>{dept}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Max Capacity
              </label>
              <input
                type="number"
                value={courseForm.maxCapacity}
                onChange={(e) => setCourseForm(prev => ({ ...prev, maxCapacity: parseInt(e.target.value) }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                min="1"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Instructor
            </label>
            <input
              type="text"
              value={courseForm.instructor}
              onChange={(e) => setCourseForm(prev => ({ ...prev, instructor: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
              placeholder="Dr. John Smith"
            />
          </div>

          {/* Schedule Section */}
          <div className="border-t pt-4">
            <h4 className="text-md font-medium text-gray-900 mb-3">Schedule</h4>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Days of Week
                </label>
                <div className="flex flex-wrap gap-2">
                  {daysOfWeek.map(day => (
                    <button
                      key={day}
                      type="button"
                      onClick={() => handleScheduleDayToggle(day)}
                      className={`px-3 py-1 rounded-md text-sm font-medium ${
                        courseForm.schedule.days.includes(day)
                          ? 'bg-primary-100 text-primary-700 border-primary-200'
                          : 'bg-gray-100 text-gray-700 border-gray-200'
                      } border`}
                    >
                      {day.substring(0, 3)}
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Start Time
                  </label>
                  <input
                    type="time"
                    value={courseForm.schedule.startTime}
                    onChange={(e) => setCourseForm(prev => ({
                      ...prev,
                      schedule: { ...prev.schedule, startTime: e.target.value }
                    }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    End Time
                  </label>
                  <input
                    type="time"
                    value={courseForm.schedule.endTime}
                    onChange={(e) => setCourseForm(prev => ({
                      ...prev,
                      schedule: { ...prev.schedule, endTime: e.target.value }
                    }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Room
                  </label>
                  <input
                    type="text"
                    value={courseForm.schedule.room}
                    onChange={(e) => setCourseForm(prev => ({
                      ...prev,
                      schedule: { ...prev.schedule, room: e.target.value }
                    }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                    placeholder="A101"
                  />
                </div>
              </div>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Prerequisites
            </label>
            <input
              type="text"
              value={courseForm.prerequisites}
              onChange={(e) => setCourseForm(prev => ({ ...prev, prerequisites: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
              placeholder="CS100, MATH101"
            />
          </div>
        </div>

        <div className="flex space-x-3 mt-6">
          <button
            onClick={onClose}
            className="btn btn-secondary btn-md flex-1"
          >
            Cancel
          </button>
          <button
            onClick={onSave}
            className="btn btn-primary btn-md flex-1"
          >
            {editingCourse ? 'Update Course' : 'Create Course'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default CourseModal;
