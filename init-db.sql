-- CRAMS Database Initialization Script
-- This script creates the database schema and inserts sample data

-- Create tables
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    role VARCHAR(20) NOT NULL CHECK (role IN ('student', 'advisor', 'admin')),
    student_id VARCHAR(20) UNIQUE,
    department VARCHAR(100),
    year_level INTEGER,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS courses (
    id SERIAL PRIMARY KEY,
    course_code VARCHAR(20) UNIQUE NOT NULL,
    course_name VARCHAR(200) NOT NULL,
    description TEXT,
    credits INTEGER NOT NULL,
    department VARCHAR(100) NOT NULL,
    prerequisites TEXT[],
    max_capacity INTEGER NOT NULL,
    current_enrollment INTEGER DEFAULT 0,
    schedule_days VARCHAR(20) NOT NULL,
    schedule_time VARCHAR(20) NOT NULL,
    instructor VARCHAR(100),
    semester VARCHAR(20) NOT NULL,
    year INTEGER NOT NULL,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS course_selections (
    id SERIAL PRIMARY KEY,
    student_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    course_id INTEGER REFERENCES courses(id) ON DELETE CASCADE,
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'waitlisted')),
    advisor_id INTEGER REFERENCES users(id),
    advisor_comments TEXT,
    priority INTEGER DEFAULT 1,
    selected_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    reviewed_at TIMESTAMP,
    UNIQUE(student_id, course_id)
);

CREATE TABLE IF NOT EXISTS notifications (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    title VARCHAR(200) NOT NULL,
    message TEXT NOT NULL,
    type VARCHAR(50) NOT NULL,
    is_read BOOLEAN DEFAULT false,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS advisor_assignments (
    id SERIAL PRIMARY KEY,
    student_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    advisor_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    assigned_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(student_id, advisor_id)
);

-- Insert sample data
-- Sample admin user (password: admin123)
INSERT INTO users (email, password, first_name, last_name, role, department) VALUES
('admin@crams.edu', '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj6hsxq9w5KS', 'System', 'Administrator', 'admin', 'Administration');

-- Sample advisor users (password: advisor123)
INSERT INTO users (email, password, first_name, last_name, role, department) VALUES
('advisor1@crams.edu', '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj6hsxq9w5KS', 'Dr. Sarah', 'Johnson', 'advisor', 'Computer Science'),
('advisor2@crams.edu', '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj6hsxq9w5KS', 'Prof. Michael', 'Chen', 'advisor', 'Engineering'),
('advisor3@crams.edu', '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj6hsxq9w5KS', 'Dr. Emily', 'Davis', 'advisor', 'Mathematics');

-- Sample student users (password: student123)
INSERT INTO users (email, password, first_name, last_name, role, student_id, department, year_level) VALUES
('student1@crams.edu', '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj6hsxq9w5KS', 'John', 'Smith', 'student', 'CS2024001', 'Computer Science', 2),
('student2@crams.edu', '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj6hsxq9w5KS', 'Alice', 'Brown', 'student', 'CS2024002', 'Computer Science', 3),
('student3@crams.edu', '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj6hsxq9w5KS', 'Bob', 'Wilson', 'student', 'ENG2024001', 'Engineering', 1),
('student4@crams.edu', '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj6hsxq9w5KS', 'Emma', 'Taylor', 'student', 'MATH2024001', 'Mathematics', 2);

-- Sample courses
INSERT INTO courses (course_code, course_name, description, credits, department, prerequisites, max_capacity, schedule_days, schedule_time, instructor, semester, year) VALUES
-- Computer Science Courses
('CS101', 'Introduction to Programming', 'Basic programming concepts using Python', 3, 'Computer Science', '{}', 30, 'MWF', '09:00-10:00', 'Dr. Sarah Johnson', 'Fall', 2024),
('CS201', 'Data Structures', 'Fundamental data structures and algorithms', 4, 'Computer Science', '{CS101}', 25, 'TTh', '11:00-12:30', 'Prof. David Lee', 'Fall', 2024),
('CS301', 'Database Systems', 'Design and implementation of database systems', 3, 'Computer Science', '{CS201}', 20, 'MWF', '14:00-15:00', 'Dr. Maria Garcia', 'Fall', 2024),
('CS401', 'Software Engineering', 'Software development methodologies and practices', 4, 'Computer Science', '{CS201}', 18, 'TTh', '09:30-11:00', 'Prof. James Wilson', 'Fall', 2024),

-- Engineering Courses
('ENG101', 'Engineering Fundamentals', 'Introduction to engineering principles', 3, 'Engineering', '{}', 35, 'MWF', '08:00-09:00', 'Prof. Michael Chen', 'Fall', 2024),
('ENG201', 'Thermodynamics', 'Basic principles of thermodynamics', 4, 'Engineering', '{ENG101}', 25, 'TTh', '13:00-14:30', 'Dr. Robert Kim', 'Fall', 2024),
('ENG301', 'Fluid Mechanics', 'Study of fluid behavior and properties', 3, 'Engineering', '{ENG201}', 20, 'MWF', '10:00-11:00', 'Prof. Lisa Zhang', 'Fall', 2024),

-- Mathematics Courses
('MATH101', 'Calculus I', 'Differential calculus and applications', 4, 'Mathematics', '{}', 40, 'MWF', '11:00-12:00', 'Dr. Emily Davis', 'Fall', 2024),
('MATH201', 'Calculus II', 'Integral calculus and series', 4, 'Mathematics', '{MATH101}', 35, 'TTh', '08:00-09:30', 'Prof. Alan Smith', 'Fall', 2024),
('MATH301', 'Linear Algebra', 'Vector spaces and linear transformations', 3, 'Mathematics', '{MATH201}', 25, 'MWF', '13:00-14:00', 'Dr. Jennifer Brown', 'Fall', 2024),

-- General Education
('ENG100', 'English Composition', 'Academic writing and communication skills', 3, 'English', '{}', 25, 'TTh', '10:00-11:30', 'Prof. Mary Johnson', 'Fall', 2024),
('HIST101', 'World History', 'Survey of world civilizations', 3, 'History', '{}', 30, 'MWF', '15:00-16:00', 'Dr. Thomas Anderson', 'Fall', 2024);

-- Sample advisor assignments
INSERT INTO advisor_assignments (student_id, advisor_id) VALUES
(4, 2), -- John Smith -> Dr. Sarah Johnson
(5, 2), -- Alice Brown -> Dr. Sarah Johnson
(6, 3), -- Bob Wilson -> Prof. Michael Chen
(7, 4); -- Emma Taylor -> Dr. Emily Davis

-- Sample course selections
INSERT INTO course_selections (student_id, course_id, status, priority) VALUES
(4, 1, 'approved', 1), -- John Smith -> CS101
(4, 8, 'pending', 2),  -- John Smith -> MATH101
(5, 2, 'approved', 1), -- Alice Brown -> CS201
(5, 3, 'pending', 2),  -- Alice Brown -> CS301
(6, 5, 'approved', 1), -- Bob Wilson -> ENG101
(6, 8, 'approved', 2), -- Bob Wilson -> MATH101
(7, 8, 'pending', 1),  -- Emma Taylor -> MATH101
(7, 9, 'pending', 2);  -- Emma Taylor -> MATH201

-- Sample notifications
INSERT INTO notifications (user_id, title, message, type) VALUES
(4, 'Course Approved', 'Your selection for CS101 - Introduction to Programming has been approved.', 'course_approval'),
(5, 'Course Approved', 'Your selection for CS201 - Data Structures has been approved.', 'course_approval'),
(6, 'Course Approved', 'Your selection for ENG101 - Engineering Fundamentals has been approved.', 'course_approval'),
(6, 'Course Approved', 'Your selection for MATH101 - Calculus I has been approved.', 'course_approval'),
(4, 'New Course Available', 'CS401 - Software Engineering is now available for registration.', 'course_announcement');

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
CREATE INDEX IF NOT EXISTS idx_courses_department ON courses(department);
CREATE INDEX IF NOT EXISTS idx_courses_semester_year ON courses(semester, year);
CREATE INDEX IF NOT EXISTS idx_course_selections_student ON course_selections(student_id);
CREATE INDEX IF NOT EXISTS idx_course_selections_status ON course_selections(status);
CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_advisor_assignments_student ON advisor_assignments(student_id);
CREATE INDEX IF NOT EXISTS idx_advisor_assignments_advisor ON advisor_assignments(advisor_id);

-- Update current enrollment counts
UPDATE courses SET current_enrollment = (
    SELECT COUNT(*) FROM course_selections 
    WHERE course_selections.course_id = courses.id 
    AND course_selections.status = 'approved'
);

COMMIT;
