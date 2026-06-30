import { useEffect, useState } from 'react';
import { Building2, Users, Shield, CheckCircle2, Clock, Ban, TrendingUp, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import api from '../../api/axios';
import { PageHeader, Spinner } from '../../components/common/UI';

const STATUS_COLORS = {
  active:    { bg: '#dcfce7', text: '#166534' },
  inactive:  { bg: '#fef3c7', text: '#92400e' },
  suspended: { bg: '#fee2e2', text: '#991b1b' },
};

export default function SuperAdminDashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/hostels/dashboard').then(r => { setData(r.data.data); setLoading(false); });
  }, []);

  if (loading || !data) return <Spinner />;

  return (
    <div>
      <PageHeader title="Super Admin" subtitle="DormEase platform overview" />

      {/* Stats */}
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-4 mb-6">
        {[
          { label: 'Total Hostels',    value: data.totalHostels,    icon: Building2,    color: '#4f46e5' },
          { label: 'Pending Approval', value: data.pendingHostels,  icon: Clock,        color: '#d97706', alert: data.pendingHostels > 0 },
          { label: 'Active Hostels',   value: data.activeHostels,   icon: CheckCircle2, color: '#059669' },
          { label: 'Total Students',   value: data.totalStudents,   icon: Users,        color: '#7c3aed' },
        ].map(s => (
          <div key={s.label} className="card p-5" style={{ border: s.alert ? '1.5px solid #fde68a' : undefined }}>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: s.color + '15' }}>
                <s.icon size={18} style={{ color: s.color }} />
              </div>
              <div>
                <p className="text-2xl font-black" style={{ color: s.color }}>{s.value}</p>
                <p className="text-xs text-gray-500 font-medium">{s.label}</p>
              </div>
            </div>
            {s.alert && (
              <p className="text-xs text-amber-600 font-semibold mt-2">⚠ Needs your attention</p>
            )}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-5">
        {/* Pending approvals */}
        <div className="card overflow-hidden">
          <div className="p-4 border-b border-gray-100 flex justify-between items-center">
            <h3 className="font-bold text-gray-800 flex items-center gap-2">
              <Clock size={15} className="text-amber-500" /> Pending Approvals
              {data.pendingList.length > 0 && (
                <span className="px-2 py-0.5 bg-amber-100 text-amber-700 text-xs font-bold rounded-full">{data.pendingList.length}</span>
              )}
            </h3>
            <Link to="/superadmin/hostels?tab=pending" className="text-accent text-sm font-semibold">View All →</Link>
          </div>
          {data.pendingList.length === 0 ? (
            <div className="py-10 text-center text-gray-400 text-sm">No pending applications</div>
          ) : (
            <div className="divide-y divide-gray-50">
              {data.pendingList.map(h => (
                <div key={h._id} className="px-4 py-3 flex items-center justify-between hover:bg-gray-50">
                  <div>
                    <p className="font-semibold text-gray-900 text-sm">{h.name}</p>
                    <p className="text-xs text-gray-400">{h.contactName} · {h.address?.city}</p>
                  </div>
                  <Link to="/superadmin/hostels?tab=pending"
                    className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 flex items-center gap-1">
                    Review <ArrowRight size={11} />
                  </Link>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Active hostels */}
        <div className="card overflow-hidden">
          <div className="p-4 border-b border-gray-100 flex justify-between items-center">
            <h3 className="font-bold text-gray-800 flex items-center gap-2">
              <Building2 size={15} className="text-indigo-500" /> Active Hostels
            </h3>
            <Link to="/superadmin/hostels" className="text-accent text-sm font-semibold">View All →</Link>
          </div>
          {data.recentHostels.length === 0 ? (
            <div className="py-10 text-center text-gray-400 text-sm">No approved hostels yet</div>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100">
                  {['Hostel', 'Code', 'Students', 'Status'].map(h => (
                    <th key={h} className="text-left px-4 py-2.5 text-xs font-semibold text-gray-500">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {data.recentHostels.map(h => {
                  const sc = STATUS_COLORS[h.status] || STATUS_COLORS.inactive;
                  return (
                    <tr key={h._id} className="hover:bg-gray-50">
                      <td className="px-4 py-3">
                        <p className="font-semibold text-gray-900">{h.name}</p>
                        <p className="text-xs text-gray-400">{h.admin?.name || 'No admin'}</p>
                      </td>
                      <td className="px-4 py-3 font-mono text-xs font-bold text-indigo-600">{h.code}</td>
                      <td className="px-4 py-3 font-bold text-gray-700">{h.stats?.students ?? 0}</td>
                      <td className="px-4 py-3">
                        <span className="px-2 py-1 rounded-lg text-xs font-bold" style={{ background: sc.bg, color: sc.text }}>
                          {h.status}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}
