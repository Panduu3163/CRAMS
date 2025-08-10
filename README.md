# CRAMS - Course Registration and Advising Management System

A comprehensive full-stack web application for managing university course registration and academic advising processes.

## 🎯 Features

### For Students
- **Course Selection**: Browse and select courses with real-time availability
- **Schedule Conflict Detection**: Automatic detection of time conflicts
- **Advisor Communication**: Submit course plans for advisor approval
- **Real-time Notifications**: Get updates on course approvals/rejections
- **Personal Dashboard**: View course selections, schedule, and notifications

### For Advisors
- **Student Management**: View and manage assigned students
- **Course Review**: Approve or reject student course selections
- **Bulk Operations**: Process multiple selections efficiently
- **Student Progress Tracking**: Monitor student academic progress
- **Communication Tools**: Provide feedback to students

### For Administrators
- **User Management**: Create and manage student, advisor, and admin accounts
- **Course Management**: Add, edit, and manage course offerings
- **System Analytics**: View enrollment statistics and system reports
- **Advisor Assignments**: Assign advisors to students
- **System Configuration**: Manage system settings and policies

## 🛠️ Technology Stack

### Backend
- **Node.js** with Express.js framework
- **PostgreSQL** database
- **JWT** authentication with role-based access control
- **bcryptjs** for password hashing
- **nodemailer** for email notifications
- **helmet** and **cors** for security

### Frontend
- **React.js** with hooks and context API
- **Tailwind CSS** for modern, responsive UI
- **Heroicons** for consistent iconography
- **React Router** for navigation
- **Axios** for API communication
- **React Hot Toast** for notifications

### Security & Performance
- Rate limiting and request validation
- SQL injection prevention
- XSS protection
- CORS configuration
- Environment-based configuration

## 🚀 Quick Start

### Prerequisites
- Node.js (v16 or higher)
- PostgreSQL (v12 or higher)
- npm or yarn

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd TOOLS PROJECT FINAL
   ```

2. **Install backend dependencies**
   ```bash
   npm install
   ```

3. **Install frontend dependencies**
   ```bash
   cd client
   npm install
   cd ..
   ```

4. **Set up environment variables**
   ```bash
   cp .env.example .env
   ```
   Edit `.env` with your configuration:
   ```env
   PORT=5000
   NODE_ENV=development
   
   # Database Configuration
   DB_HOST=localhost
   DB_PORT=5432
   DB_NAME=crams_db
   DB_USER=postgres
   DB_PASSWORD=your_password_here
   
   # JWT Configuration
   JWT_SECRET=your_jwt_secret_key_here
   JWT_EXPIRE=7d
   
   # Email Configuration
   EMAIL_HOST=smtp.gmail.com
   EMAIL_PORT=587
   EMAIL_USER=your_email@gmail.com
   EMAIL_PASS=your_app_password_here
   
   # Frontend URL
   CLIENT_URL=http://localhost:3000
   ```

5. **Set up PostgreSQL database**
   ```bash
   createdb crams_db
   ```

6. **Start the application**
   
   Backend (from root directory):
   ```bash
   npm run dev
   ```
   
   Frontend (from client directory):
   ```bash
   cd client
   npm start
   ```

7. **Access the application**
   - Frontend: http://localhost:3000
   - Backend API: http://localhost:5000

## 📝 API Documentation

### Authentication Endpoints
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - User login
- `GET /api/auth/profile` - Get current user profile
- `PUT /api/auth/profile` - Update user profile

### Course Endpoints
- `GET /api/courses` - Get all courses (with filters)
- `GET /api/courses/:id` - Get specific course
- `POST /api/courses` - Create new course (Admin only)
- `PUT /api/courses/:id` - Update course (Admin only)
- `DELETE /api/courses/:id` - Delete course (Admin only)
- `POST /api/courses/check-conflicts` - Check schedule conflicts

### Student Endpoints
- `GET /api/student/selections` - Get student's course selections
- `POST /api/student/select-course` - Select a course
- `DELETE /api/student/selections/:id` - Remove course selection
- `GET /api/student/notifications` - Get notifications
- `GET /api/student/schedule` - Get approved course schedule

### Advisor Endpoints
- `GET /api/advisor/pending-selections` - Get pending course selections
- `PUT /api/advisor/selections/:id/review` - Review course selection
- `GET /api/advisor/students` - Get assigned students
- `GET /api/advisor/statistics` - Get advisor statistics

### Admin Endpoints
- `GET /api/admin/dashboard` - Get admin dashboard data
- `GET /api/admin/users` - Get all users
- `POST /api/admin/users` - Create new user
- `PUT /api/admin/users/:id` - Update user
- `DELETE /api/admin/users/:id` - Delete user
- `POST /api/admin/assign-advisor` - Assign advisor to student

## 🗄️ Database Schema

### Users Table
- `id` (Primary Key)
- `email` (Unique)
- `password` (Hashed)
- `first_name`, `last_name`
- `role` (student, advisor, admin)
- `student_id` (For students)
- `department`
- `year_level` (For students)
- `created_at`, `updated_at`

### Courses Table
- `id` (Primary Key)
- `course_code` (Unique)
- `course_name`
- `description`
- `credits`
- `department`
- `prerequisites` (Array)
- `max_capacity`
- `current_enrollment`
- `schedule_days`, `schedule_time`
- `instructor`
- `semester`, `year`
- `is_active`

### Course Selections Table
- `id` (Primary Key)
- `student_id` (Foreign Key)
- `course_id` (Foreign Key)
- `status` (pending, approved, rejected, waitlisted)
- `advisor_id` (Foreign Key)
- `advisor_comments`
- `priority`
- `selected_at`, `reviewed_at`

## 🎨 UI Components

### Design System
- **Colors**: Primary blue palette with semantic colors
- **Typography**: Inter font family with consistent sizing
- **Spacing**: 4px base unit with Tailwind spacing scale
- **Components**: Reusable button, input, card, and modal components
- **Icons**: Heroicons for consistent iconography
- **Responsive**: Mobile-first responsive design

### Key Components
- **Navbar**: Role-based navigation with user menu
- **Dashboard**: Role-specific dashboards with statistics
- **Course Cards**: Rich course information display
- **Modals**: Accessible modal dialogs for forms
- **Notifications**: Toast notifications for user feedback
- **Loading States**: Consistent loading indicators

## 🔐 Security Features

- **Authentication**: JWT-based authentication with refresh tokens
- **Authorization**: Role-based access control (RBAC)
- **Password Security**: bcrypt hashing with salt rounds
- **Rate Limiting**: API rate limiting to prevent abuse
- **Input Validation**: Server-side validation for all inputs
- **SQL Injection Prevention**: Parameterized queries
- **XSS Protection**: Content Security Policy headers
- **CORS**: Configured for specific origins

## 🚀 Deployment

### Using Docker (Recommended)
```bash
docker-compose up -d
```

### Manual Deployment
1. Set up PostgreSQL database
2. Configure environment variables for production
3. Build frontend: `cd client && npm run build`
4. Start backend: `npm start`
5. Serve frontend build files

### Environment Variables for Production
```env
NODE_ENV=production
DB_HOST=your_production_db_host
JWT_SECRET=your_production_jwt_secret
CLIENT_URL=https://your-frontend-domain.com
```

## 🧪 Testing

### Running Tests
```bash
# Backend tests
npm test

# Frontend tests
cd client
npm test
```

### Test Coverage
- Unit tests for API endpoints
- Integration tests for database operations
- Frontend component tests
- End-to-end user flow tests

## 📊 System Requirements

### Minimum Requirements
- **CPU**: 1 core, 2.0 GHz
- **RAM**: 2 GB
- **Storage**: 10 GB
- **Database**: PostgreSQL 12+
- **Node.js**: v16+

### Recommended Requirements
- **CPU**: 2+ cores, 2.5+ GHz
- **RAM**: 4+ GB
- **Storage**: 20+ GB SSD
- **Database**: PostgreSQL 14+
- **Node.js**: v18+

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/new-feature`
3. Commit changes: `git commit -am 'Add new feature'`
4. Push to branch: `git push origin feature/new-feature`
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

For support and questions:
- Create an issue on GitHub
- Contact the development team
- Check the documentation wiki

## 🔄 Version History

### v1.0.0 (Current)
- Initial release with core functionality
- Student course selection and advisor review
- Admin panel for system management
- Real-time notifications and conflict detection
- Responsive web interface

---

**CRAMS** - Streamlining university course registration and academic advising processes.
