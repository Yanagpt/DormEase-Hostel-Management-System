import { useEffect, useState } from 'react';
import { Building2, DollarSign, AlertCircle, TrendingUp, Bell, CalendarDays } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import api from '../../api/axios';
import { StatCard, PageHeader, Badge, Spinner } from '../../components/common/UI';
import { useAuth } from '../../contexts/AuthContext';

export default function StudentDashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/dashboard/student').then(r => setData(r.data.data)).finally(() => setLoading(false));
  }, []);

  if (loading) return <Spinner />;
  if (!data) return null;

  const { student, stats, recentComplaints, recentLeaves, recentNotices } = data;
  const room = student?.room;

  const quickActions = [
    { label: 'Pay Fees', sub: 'View pending dues', color: 'bg-purple-50 text-purple-700', to: '/student/fees' },
    { label: 'Raise Complaint', sub: 'Report an issue', color: 'bg-amber-50 text-amber-700', to: '/student/complaints' },
    { label: 'Apply for Leave', sub: 'Request leave approval', color: 'bg-emerald-50 text-emerald-700', to: '/student/leaves' },
    { label: 'View Notices', sub: 'Check announcements', color: 'bg-blue-50 text-blue-700', to: '/student/notices' },
  ];

  return (
    <div>
      <PageHeader title="Dashboard" subtitle={`Welcome back, ${user?.name}!`} />

      {/* Stats */}
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-4 mb-6">
        <StatCard label="My Room" value={room?.roomNumber || 'N/A'} sub={room ? `Floor ${room.floor} · Block ${room.block}` : 'Not assigned'} icon={Building2} color="#7c3aed" />
        <StatCard label="Fee Status" value={student?.feeStatus === 'paid' ? 'Paid' : 'Pending'} sub="Current semester" icon={DollarSign} color={student?.feeStatus === 'paid' ? '#059669' : '#d97706'} />
        <StatCard label="Complaints" value={stats.openComplaints} sub="Open issues" icon={AlertCircle} color="#d97706" />
        <StatCard label="Attendance" value={student?.attendance != null ? `${student.attendance}%` : '—'} sub="Last 30 days" icon={TrendingUp} color="#0d9488" />
      </div>

      <div className="grid grid-cols-3 gap-5">
        {/* Recent Activity */}
        <div className="col-span-2 space-y-4">
          {/* Recent Complaints */}
          <div className="card p-5">
            <div className="flex justify-between items-center mb-3">
              <h3 className="section-title">Recent Complaints</h3>
              <button onClick={() => navigate('/student/complaints')} className="text-xs text-accent font-semibold hover:underline">View all</button>
            </div>
            {recentComplaints.length === 0 ? (
              <p className="text-sm text-gray-400 py-3 text-center">No complaints yet</p>
            ) : (
              <div className="space-y-2">
                {recentComplaints.slice(0, 3).map(c => (
                  <div key={c._id} className="flex items-center gap-3 p-3 rounded-xl bg-gray-50">
                    <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: c.status === 'resolved' ? '#059669' : c.status === 'in-progress' ? '#d97706' : '#e94560' }} />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-gray-800 truncate">{c.title}</p>
                      <p className="text-xs text-gray-400">{new Date(c.createdAt).toLocaleDateString('en-IN')}</p>
                    </div>
                    <Badge label={c.status} variant={c.status} />
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Notices */}
          <div className="card p-5">
            <div className="flex justify-between items-center mb-3">
              <h3 className="section-title">Latest Notices</h3>
              <button onClick={() => navigate('/student/notices')} className="text-xs text-accent font-semibold hover:underline">View all</button>
            </div>
            {recentNotices.length === 0 ? (
              <p className="text-sm text-gray-400 py-3 text-center">No notices</p>
            ) : (
              <div className="space-y-3">
                {recentNotices.slice(0, 3).map(n => (
                  <div key={n._id} className="border-b border-gray-50 pb-3 last:border-0 last:pb-0">
                    <div className="flex items-center gap-2 mb-1">
                      <Badge label={n.tag} variant={n.tag === 'important' ? 'red' : n.tag === 'event' ? 'purple' : 'blue'} />
                      <span className="text-xs text-gray-400">{new Date(n.createdAt).toLocaleDateString('en-IN')}</span>
                    </div>
                    <p className="text-sm font-semibold text-gray-800">{n.title}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Quick Actions */}
        <div>
          <h3 className="section-title mb-3">Quick Actions</h3>
          <div className="space-y-3">
            {quickActions.map(a => (
              <button key={a.to} onClick={() => navigate(a.to)}
                className={`w-full p-4 rounded-2xl text-left transition-all hover:-translate-y-0.5 hover:shadow-md ${a.color}`}>
                <p className="font-bold text-sm">{a.label}</p>
                <p className="text-xs opacity-70 mt-0.5">{a.sub}</p>
              </button>
            ))}
          </div>

          {/* Room Info */}
          {room && (
            <div className="card p-4 mt-4">
              <h4 className="text-xs font-bold text-gray-400 uppercase mb-3">Room Info</h4>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between"><span className="text-gray-500">Room</span><span className="font-semibold">{room.roomNumber}</span></div>
                <div className="flex justify-between"><span className="text-gray-500">Floor</span><span className="font-semibold">Floor {room.floor}</span></div>
                <div className="flex justify-between"><span className="text-gray-500">Type</span><span className="font-semibold capitalize">{room.type}</span></div>
                <div className="flex justify-between"><span className="text-gray-500">Rent</span><span className="font-semibold">₹{room.monthlyRent?.toLocaleString()}/mo</span></div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
