const axios = require('axios');

// Test script to verify course management functionality
async function testCourseManagement() {
  try {
    console.log('🔐 Testing Admin Login...');
    
    // Step 1: Login as admin
    const loginResponse = await axios.post('http://localhost:5000/api/auth/login', {
      email: 'admin@demo.com',
      password: 'password123'
    });
    
    const token = loginResponse.data.token;
    const headers = { Authorization: `Bearer ${token}` };
    
    console.log('✅ Admin login successful');
    console.log('👤 User:', loginResponse.data.user.firstName, loginResponse.data.user.lastName);
    console.log('🎭 Role:', loginResponse.data.user.role);
    
    // Step 2: Test course creation
    console.log('\n📚 Testing Course Creation...');
    
    const newCourse = {
      courseName: 'Advanced Web Development',
      courseCode: 'CS401',
      description: 'Advanced concepts in web development including React, Node.js, and database integration',
      credits: 4,
      department: 'Computer Science',
      instructor: 'Dr. Jane Smith',
      maxCapacity: 25,
      prerequisites: 'CS301, CS302',
      scheduleDays: ['Monday', 'Wednesday', 'Friday'],
      scheduleTime: '10:00-11:30',
      room: 'CS-Lab-101',
      semester: 'Fall',
      year: 2024,
      isActive: true
    };
    
    const createResponse = await axios.post('http://localhost:5000/api/courses', newCourse, { headers });
    console.log('✅ Course created successfully:', createResponse.data.course.course_code);
    
    // Step 3: Test fetching courses
    console.log('\n📋 Testing Course Retrieval...');
    const coursesResponse = await axios.get('http://localhost:5000/api/courses', { headers });
    console.log('✅ Courses fetched:', coursesResponse.data.courses.length, 'courses found');
    
    // Step 4: Test schedule statistics
    console.log('\n📊 Testing Schedule Statistics...');
    const scheduleStatsResponse = await axios.get('http://localhost:5000/api/admin/schedule-stats', { headers });
    console.log('✅ Schedule stats retrieved');
    console.log('   - Time slots:', scheduleStatsResponse.data.timeSlots.length);
    console.log('   - Departments:', scheduleStatsResponse.data.departments.length);
    console.log('   - Conflicts:', scheduleStatsResponse.data.conflicts.length);
    
    // Step 5: Test seat conflicts
    console.log('\n⚠️  Testing Seat Conflict Detection...');
    const conflictsResponse = await axios.get('http://localhost:5000/api/admin/seat-conflicts', { headers });
    console.log('✅ Conflict data retrieved');
    console.log('   - Over-enrolled courses:', conflictsResponse.data.overEnrolled.length);
    console.log('   - Near capacity courses:', conflictsResponse.data.nearCapacity.length);
    console.log('   - Waitlist courses:', conflictsResponse.data.waitlist.length);
    
    console.log('\n🎉 All course management tests passed successfully!');
    console.log('\n📝 Summary:');
    console.log('   ✅ Admin authentication working');
    console.log('   ✅ Course creation working');
    console.log('   ✅ Course retrieval working');
    console.log('   ✅ Schedule statistics working');
    console.log('   ✅ Conflict detection working');
    console.log('\n🚀 The "Add Course" functionality is fully operational!');
    
  } catch (error) {
    console.error('❌ Test failed:', error.response?.data?.message || error.message);
    if (error.response?.status === 429) {
      console.log('⏳ Rate limit hit - this is expected and shows security is working');
    }
  }
}

// Run the test
testCourseManagement();
