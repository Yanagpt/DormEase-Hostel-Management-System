import { Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import LandingPage from './pages/LandingPage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import AdminDashboard from './pages/admin/Dashboard';
import AdminStudents from './pages/admin/Students';
import AdminRooms from './pages/admin/Rooms';
import AdminFees from './pages/admin/Fees';
import AdminComplaints from './pages/admin/Complaints';
import AdminLeaves from './pages/admin/Leaves';
import AdminNotices from './pages/admin/Notices';
import AdminApprovals from './pages/admin/Approvals';
import AdminSettings from './pages/admin/Settings';
import AdminAttendance from './pages/admin/Attendance';
import AdminWardens from './pages/admin/Wardens';
import WardenDashboard from './pages/warden/Dashboard';
import WardenStudents from './pages/warden/Students';
import WardenComplaints from './pages/warden/Complaints';
import WardenLeaves from './pages/warden/Leaves';
import WardenRooms from './pages/warden/Rooms';
import WardenNotices from './pages/warden/Notices';
import WardenAttendance from './pages/warden/Attendance';
import StudentDashboard from './pages/student/Dashboard';
import StudentRoom from './pages/student/Room';
import StudentFees from './pages/student/Fees';
import StudentComplaints from './pages/student/Complaints';
import StudentLeaves from './pages/student/Leaves';
import StudentNotices from './pages/student/Notices';
import StudentProfile from './pages/student/Profile';
import StudentAttendance from './pages/student/Attendance';
import AppLayout from './components/layout/AppLayout';
import SuperAdminDashboard from './pages/superadmin/Dashboard';
import SuperAdminHostels from './pages/superadmin/Hostels';
import RegisterHostelPage from './pages/RegisterHostelPage';
import LoadingScreen from './components/common/LoadingScreen';

const ROLE_MAP = { superadmin: '/superadmin', admin: '/admin', warden: '/warden', student: '/student' };

// Redirects logged-in users to their dashboard; shows loader during auth check
const ProtectedRoute = ({ children, roles }) => {
  const { user, loading } = useAuth();
  if (loading) return <LoadingScreen />;
  if (!user) return <Navigate to="/login" replace />;
  if (roles && !roles.includes(user.role)) {
    return <Navigate to={ROLE_MAP[user.role] || '/login'} replace />;
  }
  return children;
};

// Prevents logged-in users from seeing /login or /register
const PublicOnlyRoute = ({ children }) => {
  const { user, loading } = useAuth();
  if (loading) return <LoadingScreen />;
  if (user) return <Navigate to={ROLE_MAP[user.role] || '/'} replace />;
  return children;
};

// Root: show landing for guests, redirect to dashboard for logged-in users
const RootRedirect = () => {
  const { user, loading } = useAuth();
  if (loading) return <LoadingScreen />;
  if (!user) return <LandingPage />;
  return <Navigate to={ROLE_MAP[user.role] || '/login'} replace />;
};

export default function App() {
  return (
    <AuthProvider>
      <Routes>
        <Route path="/" element={<RootRedirect />} />
        <Route path="/login" element={<PublicOnlyRoute><LoginPage /></PublicOnlyRoute>} />
        <Route path="/register-hostel" element={<RegisterHostelPage />} />
        <Route path="/register" element={<PublicOnlyRoute><RegisterPage /></PublicOnlyRoute>} />

        {/* Super Admin routes */}
        <Route path="/superadmin" element={<ProtectedRoute roles={['superadmin']}><AppLayout role="superadmin" /></ProtectedRoute>}>
          <Route index element={<SuperAdminDashboard />} />
          <Route path="hostels" element={<SuperAdminHostels />} />
        </Route>

        {/* Admin routes */}
        <Route path="/admin" element={<ProtectedRoute roles={['admin']}><AppLayout role="admin" /></ProtectedRoute>}>
          <Route index element={<AdminDashboard />} />
          <Route path="students" element={<AdminStudents />} />
          <Route path="rooms" element={<AdminRooms />} />
          <Route path="fees" element={<AdminFees />} />
          <Route path="complaints" element={<AdminComplaints />} />
          <Route path="leaves" element={<AdminLeaves />} />
          <Route path="notices" element={<AdminNotices />} />
          <Route path="wardens" element={<AdminWardens />} />
          <Route path="attendance" element={<AdminAttendance />} />
          <Route path="approvals" element={<AdminApprovals />} />
          <Route path="settings" element={<AdminSettings />} />
        </Route>

        {/* Warden routes */}
        <Route path="/warden" element={<ProtectedRoute roles={['warden']}><AppLayout role="warden" /></ProtectedRoute>}>
          <Route index element={<WardenDashboard />} />
          <Route path="students" element={<WardenStudents />} />
          <Route path="rooms" element={<WardenRooms />} />
          <Route path="complaints" element={<WardenComplaints />} />
          <Route path="leaves" element={<WardenLeaves />} />
          <Route path="notices" element={<WardenNotices />} />
          <Route path="attendance" element={<WardenAttendance />} />
        </Route>

        {/* Student routes */}
        <Route path="/student" element={<ProtectedRoute roles={['student']}><AppLayout role="student" /></ProtectedRoute>}>
          <Route index element={<StudentDashboard />} />
          <Route path="room" element={<StudentRoom />} />
          <Route path="fees" element={<StudentFees />} />
          <Route path="complaints" element={<StudentComplaints />} />
          <Route path="leaves" element={<StudentLeaves />} />
          <Route path="notices" element={<StudentNotices />} />
          <Route path="attendance" element={<StudentAttendance />} />
          <Route path="profile" element={<StudentProfile />} />
        </Route>

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </AuthProvider>
  );
}