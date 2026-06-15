// Warden Dashboard
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Users, Building2, AlertCircle, CalendarDays, CheckCircle2, Clock } from 'lucide-react';
import api from '../../api/axios';
import { StatCard, PageHeader, Badge, Spinner } from '../../components/common/UI';
import { useAuth } from '../../contexts/AuthContext';

export default function WardenDashboard() {
  const { user } = useAuth();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/dashboard/warden').then(r => setData(r.data.data)).finally(() => setLoading(false));
  }, []);

  if (loading) return <Spinner />;
  if (!data) return null;

  const occupied = data.roomStats.find(r => r._id === 'full')?.count || 0;
  const available = data.roomStats.find(r => r._id === 'available')?.count || 0;

  return (
    <div>
      <PageHeader title="Warden Dashboard" subtitle={`Welcome, ${user?.name}. Here's today's overview.`} />

      <div className="grid grid-cols-2 xl:grid-cols-4 gap-4 mb-6">
        <StatCard label="Active Students" value={data.students} icon={Users} color="#4f46e5" />
        <StatCard label="Occupied Rooms" value={occupied} icon={Building2} color="#7c3aed" />
        <StatCard label="Open Complaints" value={data.complaints.open} sub={`${data.complaints.inProgress} in progress`} icon={AlertCircle} color="#e94560" />
        <StatCard label="Pending Leaves" value={data.leaves.pending} icon={CalendarDays} color="#d97706" />
      </div>

      <div className="grid grid-cols-2 gap-5">
        {/* Recent Complaints */}
        <div className="card p-5">
          <div className="flex justify-between items-center mb-4">
            <h3 className="section-title">Urgent Complaints</h3>
            <Link to="/warden/complaints" className="text-xs text-accent font-semibold hover:underline">View all</Link>
          </div>
          {data.recentComplaints.length === 0 ? <p className="text-sm text-gray-400 py-4 text-center">No open complaints</p> : (
            <div className="space-y-2">
              {data.recentComplaints.map(c => (
                <div key={c._id} className="flex items-center gap-3 p-3 rounded-xl hover:bg-gray-50 transition-colors">
                  <div className="w-2 h-2 rounded-full bg-accent flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-gray-800 truncate">{c.title}</p>
                    <p className="text-xs text-gray-400">{c.student?.name} · Room {c.room?.roomNumber}</p>
                  </div>
                  <Badge label={c.priority} variant={c.priority} />
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Pending Leaves */}
        <div className="card p-5">
          <div className="flex justify-between items-center mb-4">
            <h3 className="section-title">Pending Leaves</h3>
            <Link to="/warden/leaves" className="text-xs text-accent font-semibold hover:underline">View all</Link>
          </div>
          {data.recentLeaves.length === 0 ? <p className="text-sm text-gray-400 py-4 text-center">No pending requests</p> : (
            <div className="space-y-2">
              {data.recentLeaves.map(l => (
                <div key={l._id} className="flex items-center gap-3 p-3 rounded-xl hover:bg-gray-50 transition-colors">
                  <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-700 font-bold text-xs flex-shrink-0">
                    {l.student?.name?.[0]}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-gray-800">{l.student?.name}</p>
                    <p className="text-xs text-gray-400">{new Date(l.fromDate).toLocaleDateString('en-IN')} – {new Date(l.toDate).toLocaleDateString('en-IN')}</p>
                  </div>
                  <Badge label={l.status} variant={l.status} />
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}