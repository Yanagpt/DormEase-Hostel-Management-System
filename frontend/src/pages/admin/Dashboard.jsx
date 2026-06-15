import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Users, Building2, DollarSign, AlertCircle, CalendarDays, TrendingUp, Clock, CheckCircle2 } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts';
import api from '../../api/axios';
import { StatCard, PageHeader, Badge, Spinner } from '../../components/common/UI';
import { useAuth } from '../../contexts/AuthContext';

const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
const COLORS = ['#4f46e5','#059669','#d97706','#e94560'];

export default function AdminDashboard() {
  const { user } = useAuth();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/dashboard/admin').then(r => setData(r.data.data)).finally(() => setLoading(false));
  }, []);

  if (loading) return <Spinner />;
  if (!data) return null;

  const revenueData = MONTHS.map((m, i) => {
    const match = data.monthlyRevenue?.find(r => r._id === i + 1);
    return { month: m, amount: match?.total || 0 };
  }).slice(0, 6);

  const roomPieData = [
    { name: 'Occupied', value: data.rooms.occupied },
    { name: 'Available', value: data.rooms.available },
    { name: 'Maintenance', value: data.rooms.maintenance },
  ].filter(d => d.value > 0);

  return (
    <div>
      <PageHeader
        title="Admin Dashboard"
        subtitle={`Welcome back, ${user?.name}. Here's what's happening.`}
      />

      {/* Stats grid */}
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-4 mb-6">
        <StatCard label="Total Students" value={data.students.total} sub={`${data.students.active} active`} icon={Users} color="#4f46e5" trend={5} />
        <StatCard label="Room Occupancy" value={`${data.rooms.occupancyRate}%`} sub={`${data.rooms.totalOccupants}/${data.rooms.totalCapacity} beds`} icon={Building2} color="#7c3aed" />
        <StatCard label="Pending Fees" value={`₹${(data.payments.totalRevenue / 100000).toFixed(1)}L`} sub={`${data.payments.pending} students due`} icon={DollarSign} color="#d97706" />
        <StatCard label="Open Complaints" value={data.complaints.open} sub={`${data.complaints.inProgress} in progress`} icon={AlertCircle} color="#e94560" />
      </div>

      <div className="grid grid-cols-3 gap-4 mb-6">
        <StatCard label="Pending Leaves" value={data.leaves.pending} icon={CalendarDays} color="#0d9488" />
        <StatCard label="Overdue Payments" value={data.payments.overdue} icon={Clock} color="#e94560" />
        <StatCard label="Total Wardens" value={data.wardens} icon={Users} color="#4f46e5" />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-2 gap-5 mb-5">
        <div className="card p-5">
          <h3 className="section-title mb-4">Monthly Fee Collection (2026)</h3>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={revenueData} margin={{ top: 5, right: 5, bottom: 5, left: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="month" tick={{ fontSize: 11 }} />
              <YAxis tickFormatter={v => `₹${(v/1000).toFixed(0)}k`} tick={{ fontSize: 11 }} />
              <Tooltip formatter={v => [`₹${v.toLocaleString()}`, 'Collected']} />
              <Bar dataKey="amount" fill="#4f46e5" radius={[4,4,0,0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="card p-5">
          <h3 className="section-title mb-4">Room Status Distribution</h3>
          <ResponsiveContainer width="100%" height={200}>
            <PieChart>
              <Pie data={roomPieData} cx="50%" cy="50%" innerRadius={50} outerRadius={80} paddingAngle={3} dataKey="value">
                {roomPieData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
              </Pie>
              <Legend wrapperStyle={{ fontSize: '12px' }} />
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="card p-5">
        <div className="flex justify-between items-center mb-4">
          <h3 className="section-title">Recent Complaints</h3>
          <Link to="/admin/complaints" className="text-xs text-accent font-semibold hover:underline">View all</Link>
        </div>
        {data.recentActivity?.length === 0 ? (
          <p className="text-sm text-gray-400 py-4 text-center">No recent activity</p>
        ) : (
          <div className="space-y-1">
            {data.recentActivity?.map((c, i) => (
              <div key={i} className="flex items-center gap-3 p-3 rounded-xl hover:bg-gray-50 transition-colors">
                <div className="w-2 h-2 rounded-full bg-accent flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-gray-800 truncate">{c.title}</p>
                  <p className="text-xs text-gray-400">{c.student?.name}</p>
                </div>
                <Badge label={c.status} variant={c.status} />
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}