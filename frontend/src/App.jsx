import { Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import LandingPage from './pages/LandingPage';
import LoginPage from './pages/LoginPage';
import AdminDashboard from './pages/admin/Dashboard';
import AdminStudents from './pages/admin/Students';
import AdminRooms from './pages/admin/Rooms';
import AdminFees from './pages/admin/Fees';
import AdminComplaints from './pages/admin/Complaints';
import AdminLeaves from './pages/admin/Leaves';
import AdminNotices from './pages/admin/Notices';
import AdminWardens from './pages/admin/Wardens';
import WardenDashboard from './pages/warden/Dashboard';
import WardenStudents from './pages/warden/Students';
import WardenComplaints from './pages/warden/Complaints';
import WardenLeaves from './pages/warden/Leaves';
import WardenRooms from './pages/warden/Rooms';
import WardenNotices from './pages/warden/Notices';
import StudentDashboard from './pages/student/Dashboard';
import StudentRoom from './pages/student/Room';
import StudentFees from './pages/student/Fees';
import StudentComplaints from './pages/student/Complaints';
import StudentLeaves from './pages/student/Leaves';
import StudentNotices from './pages/student/Notices';
import StudentProfile from './pages/student/Profile';
import AppLayout from './components/layout/AppLayout';
import LoadingScreen from './components/common/LoadingScreen';

const ProtectedRoute = ({ children, roles }) => {
  const { user, loading } = useAuth();
  if (loading) return <LoadingScreen />;
  if (!user) return <Navigate to="/login" replace />;
  if (roles && !roles.includes(user.role)) {
    const redirectMap = { admin: '/admin', warden: '/warden', student: '/student' };
    return <Navigate to={redirectMap[user.role] || '/login'} replace />;
  }
  return children;
};

// Shows landing for guests, dashboard for logged-in users
const RootRedirect = () => {
  const { user, loading } = useAuth();
  if (loading) return <LoadingScreen />;
  if (!user) return <LandingPage />;
  const redirectMap = { admin: '/admin', warden: '/warden', student: '/student' };
  return <Navigate to={redirectMap[user.role] || '/login'} replace />;
};

export default function App() {
  return (
    <AuthProvider>
      <Routes>
        <Route path="/" element={<RootRedirect />} />
        <Route path="/login" element={<LoginPage />} />

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
        </Route>

        {/* Warden routes */}
        <Route path="/warden" element={<ProtectedRoute roles={['warden']}><AppLayout role="warden" /></ProtectedRoute>}>
          <Route index element={<WardenDashboard />} />
          <Route path="students" element={<WardenStudents />} />
          <Route path="rooms" element={<WardenRooms />} />
          <Route path="complaints" element={<WardenComplaints />} />
          <Route path="leaves" element={<WardenLeaves />} />
          <Route path="notices" element={<WardenNotices />} />
        </Route>

        {/* Student routes */}
        <Route path="/student" element={<ProtectedRoute roles={['student']}><AppLayout role="student" /></ProtectedRoute>}>
          <Route index element={<StudentDashboard />} />
          <Route path="room" element={<StudentRoom />} />
          <Route path="fees" element={<StudentFees />} />
          <Route path="complaints" element={<StudentComplaints />} />
          <Route path="leaves" element={<StudentLeaves />} />
          <Route path="notices" element={<StudentNotices />} />
          <Route path="profile" element={<StudentProfile />} />
        </Route>

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </AuthProvider>
  );
}