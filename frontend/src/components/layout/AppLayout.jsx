import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import {
  Home, Building2, Users, DollarSign, AlertCircle, CalendarDays,
  Bell, Settings, LogOut, User2, Shield, CheckCircle2, Plus, UserCheck,
} from 'lucide-react';
import toast from 'react-hot-toast';

const NAV = {
  superadmin: [
    { label: 'Dashboard',      icon: Home,      to: '/superadmin' },
    { label: 'Manage Hostels', icon: Building2, to: '/superadmin/hostels' },
  ],
  admin: [
    { label: 'Dashboard', icon: Home, to: '/admin' },
    { label: 'Students', icon: Users, to: '/admin/students' },
    { label: 'Rooms', icon: Building2, to: '/admin/rooms' },
    { label: 'Fee Management', icon: DollarSign, to: '/admin/fees' },
    { label: 'Complaints', icon: AlertCircle, to: '/admin/complaints' },
    { label: 'Leave Requests', icon: CalendarDays, to: '/admin/leaves' },
    { label: 'Notices', icon: Bell, to: '/admin/notices' },
    { label: 'Wardens', icon: Shield, to: '/admin/wardens' },
    { label: 'Attendance', icon: UserCheck, to: '/admin/attendance' },
    { label: 'Approvals', icon: CheckCircle2, to: '/admin/approvals' },
    { label: 'Settings', icon: Settings, to: '/admin/settings' },
  ],
  warden: [
    { label: 'Dashboard', icon: Home, to: '/warden' },
    { label: 'Students', icon: Users, to: '/warden/students' },
    { label: 'Rooms', icon: Building2, to: '/warden/rooms' },
    { label: 'Complaints', icon: AlertCircle, to: '/warden/complaints' },
    { label: 'Leave Requests', icon: CalendarDays, to: '/warden/leaves' },
    { label: 'Notices', icon: Bell, to: '/warden/notices' },
    { label: 'Attendance', icon: UserCheck, to: '/warden/attendance' },
  ],
  student: [
    { label: 'Dashboard', icon: Home, to: '/student' },
    { label: 'My Room', icon: Building2, to: '/student/room' },
    { label: 'Fees', icon: DollarSign, to: '/student/fees' },
    { label: 'Complaints', icon: AlertCircle, to: '/student/complaints' },
    { label: 'Leave Requests', icon: CalendarDays, to: '/student/leaves' },
    { label: 'Notices', icon: Bell, to: '/student/notices' },
    { label: 'Attendance', icon: UserCheck, to: '/student/attendance' },
    { label: 'Profile', icon: Settings, to: '/student/profile' },
  ],
};

const ROLE_LABELS = { superadmin: 'Super Admin', admin: 'Admin Panel', warden: 'Warden Panel', student: 'Student Portal' };

export default function AppLayout({ role }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const nav = NAV[role] || [];

  const handleLogout = () => {
    logout();
    toast.success('Signed out successfully');
    navigate('/login');
  };

  return (
    <div className="flex min-h-screen bg-slate-50">
      {/* Sidebar */}
      <aside className="w-60 min-h-screen bg-primary flex flex-col sticky top-0 h-screen overflow-y-auto flex-shrink-0">
        {/* Brand */}
        <div className="px-5 py-6 border-b border-white/5">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-accent flex items-center justify-center text-white font-bold text-base flex-shrink-0">D</div>
            <div>
              <div className="text-white font-bold text-[0.95rem]">DormEase</div>
              <div className="text-white/50 text-[0.7rem]">{ROLE_LABELS[role]}</div>
            </div>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3 py-4 flex flex-col gap-0.5">
          {nav.map(({ label, icon: Icon, to }) => (
            <NavLink
              key={to}
              to={to}
              end={to === `/${role}`}
              className={({ isActive }) =>
                `sidebar-link ${isActive ? 'sidebar-link-active' : 'sidebar-link-inactive'}`
              }
            >
              <Icon size={16} className="flex-shrink-0" />
              <span>{label}</span>
            </NavLink>
          ))}
        </nav>

        {/* User */}
        <div className="px-3 pb-5 border-t border-white/5 pt-3">
          <div className="flex items-center gap-2.5 px-2 py-2 mb-2">
            <div className="w-8 h-8 rounded-full bg-accent flex items-center justify-center text-white font-bold text-xs flex-shrink-0">
              {(user?.name || 'U')[0].toUpperCase()}
            </div>
            <div className="min-w-0">
              <div className="text-white text-[0.82rem] font-semibold truncate">{user?.name}</div>
              <div className="text-white/50 text-[0.7rem] capitalize">{role}</div>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="flex items-center gap-2 w-full px-3 py-2 rounded-lg border border-white/10 text-white/60 hover:bg-accent/20 hover:text-red-300 transition-colors text-[0.82rem] font-medium"
          >
            <LogOut size={13} /> Sign Out
          </button>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 min-w-0 p-8 overflow-x-hidden">
        <Outlet />
      </main>
    </div>
  );
}