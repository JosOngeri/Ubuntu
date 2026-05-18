import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useParams } from 'react-router-dom';
import { ThemeProvider } from './contexts/ThemeContext';
import { AuthProvider } from './contexts/AuthContext';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

// Recruitment Pages
import JobPostingManagement from './pages/recruitment/JobPostingManagement';
import PublicJobBoard from './pages/recruitment/PublicJobBoard';
import JobApplicationForm from './pages/recruitment/JobApplicationForm';
import ApplicantReviewDashboard from './pages/recruitment/ApplicantReviewDashboard';
import MyApplications from './pages/recruitment/MyApplications';
import ProfileView from './pages/recruitment/ProfileView';
import ProfileUpdateForm from './pages/recruitment/ProfileUpdateForm';
import JobDetail from './pages/recruitment/JobDetail';
import ApplicantDetail from './pages/recruitment/ApplicantDetail';

// Auth Pages
import Login from './pages/auth/Login';
import Register from './pages/auth/Register';
import ForgotPassword from './pages/auth/ForgotPassword';
import ResetPassword from './pages/auth/ResetPassword';
import Unauthorized from './pages/Unauthorized';
import ProtectedRoute from './components/ProtectedRoute';

// Admin Pages
import AdminDashboard from './pages/admin/Dashboard';
import AdminEmployees from './pages/admin/Employees';
import AdminUsers from './pages/admin/Users';
import Permissions from './pages/admin/Permissions';
import UserDetail from './pages/admin/UserDetail';
import EmployeeDetail from './pages/admin/EmployeeDetail';

// Manager & Employee Pages
import ManagerDashboard from './pages/manager/Dashboard';
import EmployeeDashboard from './pages/employee/Dashboard';
import Punch from './pages/employee/Punch';
import AttendancePage from './pages/shared/Attendance';
import AttendanceDetail from './pages/shared/AttendanceDetail';

// Wrappers for dynamic routes
function JobApplicationFormWrapper() {
  const { jobId } = useParams();
  return <JobApplicationForm jobId={jobId} />;
}

function ApplicantReviewDashboardWrapper() {
  const { jobId } = useParams();
  return <ApplicantReviewDashboard jobId={jobId} />;
}

function ApplicantDetailWrapper() {
  const { jobId, applicantId } = useParams();
  return <ApplicantDetail jobId={jobId} applicantId={applicantId} />;
}

function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <Router>
          <Routes>
            {/* Public Routes */}
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
            <Route path="/reset-password" element={<ResetPassword />} />
            <Route path="/unauthorized" element={<Unauthorized />} />

            {/* Admin Routes */}
            <Route
              path="/admin/dashboard"
              element={
                <ProtectedRoute allowedRoles={['admin']}>
                  <AdminDashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/employees"
              element={
                <ProtectedRoute allowedRoles={['admin']}>
                  <AdminEmployees />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/employees/:employeeId"
              element={
                <ProtectedRoute allowedRoles={['admin']}>
                  <EmployeeDetail />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/users"
              element={
                <ProtectedRoute allowedRoles={['admin']}>
                  <AdminUsers />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/users/:userId"
              element={
                <ProtectedRoute allowedRoles={['admin']}>
                  <UserDetail />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/permissions"
              element={
                <ProtectedRoute allowedRoles={['admin']}>
                  <Permissions />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/attendance"
              element={
                <ProtectedRoute allowedRoles={['admin']}>
                  <AttendancePage role="admin" />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/attendance/:attendanceId"
              element={
                <ProtectedRoute allowedRoles={['admin']}>
                  <AttendanceDetail />
                </ProtectedRoute>
              }
            />

            {/* Manager Routes */}
            <Route
              path="/manager/dashboard"
              element={
                <ProtectedRoute allowedRoles={['manager', 'supervisor']}>
                  <ManagerDashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/manager/attendance"
              element={
                <ProtectedRoute allowedRoles={['manager', 'supervisor']}>
                  <AttendancePage role="manager" />
                </ProtectedRoute>
              }
            />
            <Route
              path="/manager/attendance/:attendanceId"
              element={
                <ProtectedRoute allowedRoles={['manager', 'supervisor']}>
                  <AttendanceDetail />
                </ProtectedRoute>
              }
            />

            {/* Employee Routes */}
            <Route
              path="/employee/dashboard"
              element={
                <ProtectedRoute allowedRoles={['employee']}>
                  <EmployeeDashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/employee/attendance"
              element={
                <ProtectedRoute allowedRoles={['employee']}>
                  <AttendancePage role="employee" />
                </ProtectedRoute>
              }
            />
            <Route
              path="/employee/punch"
              element={
                <ProtectedRoute allowedRoles={['employee']}>
                  <Punch />
                </ProtectedRoute>
              }
            />
            <Route
              path="/employee/attendance/:attendanceId"
              element={
                <ProtectedRoute allowedRoles={['employee']}>
                  <AttendanceDetail />
                </ProtectedRoute>
              }
            />

            {/* Recruitment Portal Routes */}
            <Route
              path="/recruitment/jobs"
              element={
                <ProtectedRoute allowedRoles={['admin', 'manager', 'hr']}>
                  <JobPostingManagement />
                </ProtectedRoute>
              }
            />
            <Route
              path="/recruitment/jobs/:jobId"
              element={
                <ProtectedRoute allowedRoles={['admin', 'manager', 'hr']}>
                  <JobDetail />
                </ProtectedRoute>
              }
            />
            <Route path="/recruitment/jobs-board" element={<PublicJobBoard />} />
            <Route path="/recruitment/apply/:jobId" element={<JobApplicationFormWrapper />} />
            <Route
              path="/recruitment/my-applications"
              element={
                <ProtectedRoute allowedRoles={['admin', 'manager', 'hr', 'employee', 'supervisor']}>
                  <MyApplications />
                </ProtectedRoute>
              }
            />
            <Route
              path="/recruitment/jobs/:jobId/applicants"
              element={
                <ProtectedRoute allowedRoles={['admin', 'manager', 'hr']}>
                  <ApplicantReviewDashboardWrapper />
                </ProtectedRoute>
              }
            />
            <Route
              path="/recruitment/jobs/:jobId/applicants/:applicantId"
              element={
                <ProtectedRoute allowedRoles={['admin', 'manager', 'hr']}>
                  <ApplicantDetailWrapper />
                </ProtectedRoute>
              }
            />
            <Route
              path="/profile/view"
              element={
                <ProtectedRoute allowedRoles={['admin', 'manager', 'hr', 'employee']}>
                  <ProfileView />
                </ProtectedRoute>
              }
            />
            <Route
              path="/profile/update"
              element={
                <ProtectedRoute allowedRoles={['admin', 'manager', 'hr', 'employee']}>
                  <ProfileUpdateForm />
                </ProtectedRoute>
              }
            />

            {/* Root redirect */}
            <Route path="/" element={<Navigate to="/login" replace />} />
            <Route path="*" element={<Navigate to="/login" replace />} />
          </Routes>

          <ToastContainer
            position="top-right"
            autoClose={3000}
            hideProgressBar={false}
            newestOnTop={true}
            closeOnClick
            rtl={false}
            pauseOnFocusLoss
            draggable
            pauseOnHover
            theme="light"
          />
        </Router>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;