import { useEffect, useState, useCallback } from 'react';
import { ChevronLeft, ChevronRight, CheckCircle2, XCircle, Clock, CalendarDays, TrendingUp } from 'lucide-react';
import api from '../../api/axios';
import { PageHeader, Spinner } from '../../components/common/UI';
import { useAuth } from '../../contexts/AuthContext';

const STATUS_CONFIG = {
  present: { label: 'Present', color: '#059669', bg: '#dcfce7', icon: CheckCircle2 },
  late:    { label: 'Late',    color: '#d97706', bg: '#fef3c7', icon: Clock },
  absent:  { label: 'Absent',  color: '#dc2626', bg: '#fee2e2', icon: XCircle },
  leave:   { label: 'Leave',   color: '#7c3aed', bg: '#ede9fe', icon: CalendarDays },
};

const MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December'];
const DAYS   = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];

export default function StudentAttendance() {
  const { user } = useAuth();
  const now = new Date();
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [year, setYear] = useState(now.getFullYear());
  const [studentId, setStudentId] = useState(null);
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  // Fetch own studentId first
  useEffect(() => {
    api.get('/dashboard/student').then(res => {
      setStudentId(res.data.data.student._id);
    });
  }, []);

  const load = useCallback(async () => {
    if (!studentId) return;
    setLoading(true);
    try {
      const res = await api.get(`/attendance/student/${studentId}?month=${month}&year=${year}`);
      setData(res.data);
    } finally {
      setLoading(false);
    }
  }, [studentId, month, year]);

  useEffect(() => { load(); }, [load]);

  const prevMonth = () => {
    if (month === 1) { setMonth(12); setYear(y => y - 1); }
    else setMonth(m => m - 1);
  };
  const nextMonth = () => {
    const isCurrentMonth = month === now.getMonth() + 1 && year === now.getFullYear();
    if (isCurrentMonth) return;
    if (month === 12) { setMonth(1); setYear(y => y + 1); }
    else setMonth(m => m + 1);
  };

  const isCurrentMonth = month === now.getMonth() + 1 && year === now.getFullYear();

  if (loading || !data) return <Spinner />;

  const { calendar, summary, percentage } = data;
  const pctColor = percentage === null ? '#6b7280' : percentage >= 75 ? '#059669' : percentage >= 50 ? '#d97706' : '#dc2626';

  // Build calendar grid with leading empty cells
  const firstDayOfWeek = new Date(year, month - 1, 1).getDay();

  return (
    <div>
      <PageHeader title="My Attendance" subtitle="Track your monthly hostel attendance" />

      {/* Month nav */}
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-3">
          <button onClick={prevMonth} className="w-8 h-8 rounded-lg border border-gray-200 flex items-center justify-center hover:bg-gray-50">
            <ChevronLeft size={15} />
          </button>
          <span className="font-bold text-gray-800 text-sm w-36 text-center">{MONTHS[month - 1]} {year}</span>
          <button onClick={nextMonth} disabled={isCurrentMonth}
            className="w-8 h-8 rounded-lg border border-gray-200 flex items-center justify-center hover:bg-gray-50 disabled:opacity-30">
            <ChevronRight size={15} />
          </button>
        </div>
        <div className="flex items-center gap-2 px-4 py-2 rounded-xl card">
          <TrendingUp size={15} style={{ color: pctColor }} />
          <span className="text-sm font-bold" style={{ color: pctColor }}>
            {percentage !== null ? `${percentage}% Attendance` : 'No data yet'}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-5">
        {/* Calendar */}
        <div className="xl:col-span-2 card p-5">
          {/* Day headers */}
          <div className="grid grid-cols-7 gap-1 mb-2">
            {DAYS.map(d => (
              <div key={d} className="text-center text-xs font-semibold text-gray-400 py-1">{d}</div>
            ))}
          </div>
          {/* Day cells */}
          <div className="grid grid-cols-7 gap-1">
            {/* Empty leading cells */}
            {Array.from({ length: firstDayOfWeek }).map((_, i) => <div key={`e${i}`} />)}
            {calendar.map(day => {
              const cfg = day.status ? STATUS_CONFIG[day.status] : null;
              const isToday = day.date === now.toISOString().slice(0, 10);
              const isFuture = day.date > now.toISOString().slice(0, 10);
              return (
                <div key={day.date}
                  title={cfg ? `${cfg.label}${day.note ? ' — ' + day.note : ''}` : 'Not marked'}
                  style={{
                    borderRadius: 10,
                    padding: '8px 4px',
                    textAlign: 'center',
                    background: cfg ? cfg.bg : isFuture ? 'transparent' : '#f9fafb',
                    border: isToday ? '2px solid #6366f1' : `1px solid ${cfg ? cfg.color + '40' : '#f3f4f6'}`,
                    opacity: isFuture ? 0.35 : 1,
                    cursor: 'default',
                  }}>
                  <div className="text-xs font-bold" style={{ color: cfg ? cfg.color : '#9ca3af' }}>{day.day}</div>
                  {cfg && (
                    <div className="text-[9px] font-semibold mt-0.5" style={{ color: cfg.color }}>
                      {cfg.label.slice(0, 3).toUpperCase()}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Legend */}
          <div className="flex flex-wrap gap-3 mt-4 pt-4 border-t border-gray-100">
            {Object.entries(STATUS_CONFIG).map(([key, cfg]) => (
              <div key={key} className="flex items-center gap-1.5">
                <div className="w-3 h-3 rounded-sm" style={{ background: cfg.bg, border: `1px solid ${cfg.color}` }} />
                <span className="text-xs text-gray-500">{cfg.label}</span>
              </div>
            ))}
            <div className="flex items-center gap-1.5">
              <div className="w-3 h-3 rounded-sm bg-gray-100 border border-gray-200" />
              <span className="text-xs text-gray-500">Not Marked</span>
            </div>
          </div>
        </div>

        {/* Summary panel */}
        <div className="space-y-4">
          {/* Big % */}
          <div className="card p-5 text-center">
            <div className="relative w-28 h-28 mx-auto mb-3">
              <svg viewBox="0 0 100 100" className="w-full h-full -rotate-90">
                <circle cx="50" cy="50" r="40" fill="none" stroke="#f3f4f6" strokeWidth="10" />
                <circle cx="50" cy="50" r="40" fill="none" stroke={pctColor} strokeWidth="10"
                  strokeDasharray={`${(percentage ?? 0) * 2.51327} 251.327`}
                  strokeLinecap="round" style={{ transition: 'stroke-dasharray 0.5s ease' }} />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-2xl font-black" style={{ color: pctColor }}>
                  {percentage !== null ? `${percentage}%` : '—'}
                </span>
              </div>
            </div>
            <p className="text-sm font-semibold text-gray-700">Attendance Rate</p>
            <p className="text-xs text-gray-400 mt-1">{MONTHS[month - 1]} {year}</p>
            {percentage !== null && percentage < 75 && (
              <div className="mt-3 p-2 bg-red-50 rounded-lg">
                <p className="text-xs text-red-600 font-semibold">⚠️ Below 75% threshold</p>
              </div>
            )}
          </div>

          {/* Stat breakdown */}
          <div className="card p-4 space-y-3">
            <h3 className="text-sm font-bold text-gray-700">Monthly Breakdown</h3>
            {Object.entries(STATUS_CONFIG).map(([key, cfg]) => {
              const val = summary[key] || 0;
              const pct = summary.total > 0 ? Math.round((val / summary.total) * 100) : 0;
              const Icon = cfg.icon;
              return (
                <div key={key} className="flex items-center gap-3">
                  <div className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0"
                    style={{ background: cfg.bg }}>
                    <Icon size={13} style={{ color: cfg.color }} />
                  </div>
                  <div className="flex-1">
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-xs font-semibold text-gray-600">{cfg.label}</span>
                      <span className="text-xs font-bold" style={{ color: cfg.color }}>{val} days</span>
                    </div>
                    <div className="w-full bg-gray-100 rounded-full h-1.5">
                      <div className="h-1.5 rounded-full transition-all" style={{ width: `${pct}%`, background: cfg.color }} />
                    </div>
                  </div>
                </div>
              );
            })}
            <div className="pt-2 border-t border-gray-100 flex justify-between text-xs text-gray-500">
              <span>Total marked days</span>
              <span className="font-bold text-gray-700">{summary.total}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
