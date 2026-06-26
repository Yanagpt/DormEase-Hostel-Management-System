import { useEffect, useState, useCallback } from 'react';
import { CalendarDays, ChevronLeft, ChevronRight, BarChart2, Users, CheckCircle2, XCircle, Clock, TrendingUp } from 'lucide-react';
import api from '../../api/axios';
import { PageHeader, Spinner } from '../../components/common/UI';
import toast from 'react-hot-toast';

const STATUS_CONFIG = {
  present: { label: 'Present', color: '#059669', bg: '#dcfce7' },
  late:    { label: 'Late',    color: '#d97706', bg: '#fef3c7' },
  absent:  { label: 'Absent',  color: '#dc2626', bg: '#fee2e2' },
  leave:   { label: 'Leave',   color: '#7c3aed', bg: '#ede9fe' },
};

const MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December'];

function PctBar({ value, color = '#6366f1' }) {
  const pct = value ?? 0;
  const bg = pct >= 75 ? '#059669' : pct >= 50 ? '#d97706' : '#dc2626';
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 bg-gray-100 rounded-full h-1.5">
        <div className="h-1.5 rounded-full transition-all" style={{ width: `${pct}%`, background: bg }} />
      </div>
      <span className="text-xs font-bold w-9 text-right" style={{ color: bg }}>
        {value !== null ? `${pct}%` : '—'}
      </span>
    </div>
  );
}

export default function AdminAttendance() {
  const now = new Date();
  const [tab, setTab] = useState('overview'); // 'overview' | 'daily'
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [year, setYear] = useState(now.getFullYear());
  const [overview, setOverview] = useState([]);
  const [daily, setDaily] = useState([]);
  const [dailySummary, setDailySummary] = useState({});
  const [selectedDate, setSelectedDate] = useState(now.toISOString().slice(0, 10));
  const [loading, setLoading] = useState(true);
  const [sortBy, setSortBy] = useState('name');
  const [editing, setEditing] = useState(null); // { studentId, date, status }
  const [savingEdit, setSavingEdit] = useState(false);

  const loadOverview = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get(`/attendance/overview?month=${month}&year=${year}`);
      setOverview(res.data.data);
    } catch { toast.error('Failed to load overview.'); }
    finally { setLoading(false); }
  }, [month, year]);

  const loadDaily = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get(`/attendance/date/${selectedDate}`);
      setDaily(res.data.data);
    } catch { toast.error('Failed to load daily records.'); }
    finally { setLoading(false); }
  }, [selectedDate]);

  useEffect(() => {
    if (tab === 'overview') loadOverview();
    else loadDaily();
  }, [tab, loadOverview, loadDaily]);

  const prevMonth = () => {
    if (month === 1) { setMonth(12); setYear(y => y - 1); }
    else setMonth(m => m - 1);
  };
  const nextMonth = () => {
    if (month === 12) { setMonth(1); setYear(y => y + 1); }
    else setMonth(m => m + 1);
  };

  const saveEdit = async () => {
    if (!editing) return;
    setSavingEdit(true);
    try {
      await api.post('/attendance/mark', {
        studentId: editing.studentId,
        date: editing.date,
        status: editing.status,
      });
      toast.success('Updated!');
      setEditing(null);
      loadDaily();
    } catch { toast.error('Update failed.'); }
    finally { setSavingEdit(false); }
  };

  const sorted = [...overview].sort((a, b) => {
    if (sortBy === 'name') return (a.name || '').localeCompare(b.name || '');
    if (sortBy === 'pct') return (b.percentage ?? -1) - (a.percentage ?? -1);
    if (sortBy === 'absent') return b.absent - a.absent;
    return 0;
  });

  // Stats for overview
  const avgPct = overview.length > 0
    ? Math.round(overview.filter(s => s.percentage !== null).reduce((acc, s) => acc + s.percentage, 0) / overview.filter(s => s.percentage !== null).length)
    : null;
  const lowAttendance = overview.filter(s => s.percentage !== null && s.percentage < 75).length;

  if (loading) return <Spinner />;

  return (
    <div>
      <PageHeader title="Attendance" subtitle="View and manage student attendance records" />

      {/* Tabs */}
      <div className="flex gap-2 mb-6">
        {[
          { key: 'overview', label: 'Monthly Overview', icon: BarChart2 },
          { key: 'daily',    label: 'Daily Records',   icon: CalendarDays },
        ].map(t => (
          <button key={t.key} onClick={() => setTab(t.key)}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all ${tab === t.key ? 'bg-accent text-white shadow-sm' : 'bg-white text-gray-500 hover:bg-gray-50 border border-gray-200'}`}>
            <t.icon size={15} /> {t.label}
          </button>
        ))}
      </div>

      {/* ── MONTHLY OVERVIEW ── */}
      {tab === 'overview' && (
        <>
          {/* Month nav + stats */}
          <div className="flex flex-wrap gap-4 items-center justify-between mb-5">
            <div className="flex items-center gap-3">
              <button onClick={prevMonth} className="w-8 h-8 rounded-lg border border-gray-200 flex items-center justify-center hover:bg-gray-50">
                <ChevronLeft size={15} />
              </button>
              <span className="font-bold text-gray-800 text-sm w-36 text-center">{MONTHS[month - 1]} {year}</span>
              <button onClick={nextMonth} className="w-8 h-8 rounded-lg border border-gray-200 flex items-center justify-center hover:bg-gray-50">
                <ChevronRight size={15} />
              </button>
            </div>
            <div className="flex gap-3">
              <div className="card px-4 py-2 flex items-center gap-2">
                <TrendingUp size={14} className="text-accent" />
                <span className="text-sm font-bold text-gray-700">Avg: <span className="text-accent">{avgPct !== null ? `${avgPct}%` : '—'}</span></span>
              </div>
              <div className="card px-4 py-2 flex items-center gap-2">
                <XCircle size={14} className="text-red-500" />
                <span className="text-sm font-bold text-gray-700">Below 75%: <span className="text-red-500">{lowAttendance}</span></span>
              </div>
            </div>
          </div>

          {/* Sort */}
          <div className="flex gap-2 mb-3">
            <span className="text-xs text-gray-500 self-center">Sort:</span>
            {[['name','Name'],['pct','Attendance %'],['absent','Most Absent']].map(([k,l]) => (
              <button key={k} onClick={() => setSortBy(k)}
                className={`px-3 py-1 rounded-lg text-xs font-semibold transition-colors ${sortBy === k ? 'bg-accent text-white' : 'bg-gray-100 text-gray-600'}`}>
                {l}
              </button>
            ))}
          </div>

          <div className="card overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100">
                  {['Student', 'Room', 'Present', 'Late', 'Absent', 'Leave', 'Total Days', 'Attendance'].map(h => (
                    <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-gray-500">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {sorted.length === 0 && (
                  <tr><td colSpan={8} className="text-center py-12 text-gray-400 text-sm">No data for this month.</td></tr>
                )}
                {sorted.map(s => (
                  <tr key={s.studentId} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3">
                      <p className="font-semibold text-gray-900">{s.name}</p>
                      <p className="text-xs text-gray-400">{s.rollNumber}</p>
                    </td>
                    <td className="px-4 py-3 text-gray-500 text-xs">{s.room}</td>
                    <td className="px-4 py-3 font-bold text-green-600">{s.present}</td>
                    <td className="px-4 py-3 font-bold text-amber-500">{s.late}</td>
                    <td className="px-4 py-3 font-bold text-red-500">{s.absent}</td>
                    <td className="px-4 py-3 font-bold text-purple-500">{s.leave}</td>
                    <td className="px-4 py-3 text-gray-500">{s.totalDays}</td>
                    <td className="px-4 py-3 w-36"><PctBar value={s.percentage} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}

      {/* ── DAILY RECORDS ── */}
      {tab === 'daily' && (
        <>
          <div className="flex items-center gap-3 mb-5">
            <input type="date" value={selectedDate} onChange={e => setSelectedDate(e.target.value)}
              max={new Date().toISOString().slice(0, 10)}
              className="border border-gray-200 rounded-xl px-4 py-2 text-sm font-medium text-gray-700 focus:outline-none focus:ring-2 focus:ring-accent/30" />
            <span className="text-sm text-gray-500">{daily.length} records</span>
          </div>

          <div className="card overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100">
                  {['Student', 'Roll No.', 'Status', 'Marked By', 'Actions'].map(h => (
                    <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-gray-500">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {daily.length === 0 && (
                  <tr><td colSpan={5} className="text-center py-12 text-gray-400 text-sm">No records for this date.</td></tr>
                )}
                {daily.map(r => {
                  const cfg = STATUS_CONFIG[r.status];
                  const isEditing = editing?.studentId === r.student?._id;
                  return (
                    <tr key={r._id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-4 py-3 font-semibold text-gray-900">{r.student?.user?.name}</td>
                      <td className="px-4 py-3 text-gray-500 text-xs">{r.student?.rollNumber}</td>
                      <td className="px-4 py-3">
                        {isEditing ? (
                          <div className="flex gap-1.5">
                            {Object.entries(STATUS_CONFIG).map(([val, c]) => (
                              <button key={val} onClick={() => setEditing(e => ({ ...e, status: val }))}
                                style={{ padding: '3px 10px', borderRadius: 6, fontSize: '0.72rem', fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit',
                                  background: editing.status === val ? c.bg : '#f3f4f6',
                                  color: editing.status === val ? c.color : '#9ca3af',
                                  border: `1.5px solid ${editing.status === val ? c.color : '#e5e7eb'}` }}>
                                {c.label}
                              </button>
                            ))}
                          </div>
                        ) : (
                          cfg && (
                            <span className="text-xs font-bold px-2.5 py-1 rounded-lg"
                              style={{ background: cfg.bg, color: cfg.color }}>
                              {cfg.label}
                            </span>
                          )
                        )}
                      </td>
                      <td className="px-4 py-3 text-xs text-gray-500">{r.markedBy?.name} <span className="text-gray-300">({r.markedBy?.role})</span></td>
                      <td className="px-4 py-3">
                        {isEditing ? (
                          <div className="flex gap-2">
                            <button onClick={saveEdit} disabled={savingEdit}
                              className="px-3 py-1 bg-accent text-white text-xs font-bold rounded-lg disabled:opacity-50">
                              {savingEdit ? 'Saving…' : 'Save'}
                            </button>
                            <button onClick={() => setEditing(null)}
                              className="px-3 py-1 bg-gray-100 text-gray-600 text-xs font-semibold rounded-lg">
                              Cancel
                            </button>
                          </div>
                        ) : (
                          <button onClick={() => setEditing({ studentId: r.student?._id, date: selectedDate, status: r.status })}
                            className="px-3 py-1 text-xs font-semibold text-accent hover:bg-accent/10 rounded-lg transition-colors">
                            Edit
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}
