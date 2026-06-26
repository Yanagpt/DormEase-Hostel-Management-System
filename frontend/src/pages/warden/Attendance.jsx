import { useEffect, useState, useCallback } from 'react';
import { CheckCircle2, XCircle, Clock, CalendarDays, Save, RefreshCw, ChevronLeft, ChevronRight, BarChart2 } from 'lucide-react';
import api from '../../api/axios';
import { PageHeader, Spinner, Badge } from '../../components/common/UI';
import toast from 'react-hot-toast';

const STATUS_CONFIG = {
  present: { label: 'Present', color: '#059669', bg: '#dcfce7', border: '#86efac', icon: CheckCircle2 },
  late:    { label: 'Late',    color: '#d97706', bg: '#fef3c7', border: '#fde68a', icon: Clock },
  absent:  { label: 'Absent',  color: '#dc2626', bg: '#fee2e2', border: '#fca5a5', icon: XCircle },
  leave:   { label: 'Leave',   color: '#7c3aed', bg: '#ede9fe', border: '#c4b5fd', icon: CalendarDays },
};

function StatusBtn({ current, value, onChange }) {
  const cfg = STATUS_CONFIG[value];
  const active = current === value;
  const Icon = cfg.icon;
  return (
    <button
      onClick={() => onChange(value)}
      style={{
        flex: 1, padding: '6px 4px', borderRadius: 8, border: `1.5px solid ${active ? cfg.color : '#e5e7eb'}`,
        background: active ? cfg.bg : '#f9fafb', color: active ? cfg.color : '#9ca3af',
        fontWeight: active ? 700 : 500, fontSize: '0.72rem', cursor: 'pointer',
        display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3,
        transition: 'all 0.15s', fontFamily: 'inherit',
      }}
    >
      <Icon size={13} />
      {cfg.label}
    </button>
  );
}

export default function WardenAttendance() {
  const [data, setData] = useState([]);
  const [summary, setSummary] = useState({});
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [localStatus, setLocalStatus] = useState({}); // studentId → status
  const [filter, setFilter] = useState('all');

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get('/attendance/today');
      setData(res.data.data);
      setSummary(res.data.summary);
      const init = {};
      res.data.data.forEach(s => { if (s.status) init[s.studentId] = s.status; });
      setLocalStatus(init);
    } catch {
      toast.error('Failed to load attendance.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const setAll = (status) => {
    const next = {};
    data.forEach(s => { next[s.studentId] = status; });
    setLocalStatus(next);
  };

  const handleSave = async () => {
    const records = Object.entries(localStatus).map(([studentId, status]) => ({ studentId, status }));
    if (records.length === 0) return toast.error('No attendance to save.');
    setSaving(true);
    try {
      const res = await api.post('/attendance/bulk', { date, records });
      toast.success(`Saved! ${res.data.summary.present || 0} present, ${res.data.summary.absent || 0} absent.`);
      load();
    } catch {
      toast.error('Failed to save attendance.');
    } finally {
      setSaving(false);
    }
  };

  const filtered = data.filter(s => {
    if (filter === 'unmarked') return !localStatus[s.studentId];
    if (filter === 'marked') return !!localStatus[s.studentId];
    return true;
  });

  const markedCount = Object.keys(localStatus).length;
  const pct = data.length > 0 ? Math.round((markedCount / data.length) * 100) : 0;

  if (loading) return <Spinner />;

  return (
    <div>
      <PageHeader
        title="Attendance"
        subtitle={`Today — ${new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}`}
        action={
          <button onClick={handleSave} disabled={saving || markedCount === 0}
            className="btn-primary flex items-center gap-2" style={{ opacity: saving || markedCount === 0 ? 0.5 : 1 }}>
            <Save size={15} />
            {saving ? 'Saving…' : `Save Attendance (${markedCount}/${data.length})`}
          </button>
        }
      />

      {/* Summary cards */}
      <div className="grid grid-cols-2 xl:grid-cols-5 gap-3 mb-5">
        {[
          { label: 'Total', value: summary.total || 0, color: '#6366f1' },
          { label: 'Present', value: summary.present || 0, color: '#059669' },
          { label: 'Late', value: summary.late || 0, color: '#d97706' },
          { label: 'Absent', value: summary.absent || 0, color: '#dc2626' },
          { label: 'Leave', value: summary.leave || 0, color: '#7c3aed' },
        ].map(c => (
          <div key={c.label} className="card p-4">
            <div className="text-2xl font-bold" style={{ color: c.color }}>{c.value}</div>
            <div className="text-xs text-gray-500 font-medium mt-0.5">{c.label}</div>
          </div>
        ))}
      </div>

      {/* Progress bar */}
      <div className="card p-4 mb-5">
        <div className="flex justify-between items-center mb-2">
          <span className="text-sm font-semibold text-gray-700">Marking Progress</span>
          <span className="text-sm font-bold text-accent">{markedCount}/{data.length} marked ({pct}%)</span>
        </div>
        <div className="w-full bg-gray-100 rounded-full h-2.5">
          <div className="h-2.5 rounded-full bg-accent transition-all duration-300" style={{ width: `${pct}%` }} />
        </div>
      </div>

      {/* Controls */}
      <div className="card p-4 mb-4 flex flex-wrap gap-3 items-center justify-between">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-sm font-semibold text-gray-600">Mark all as:</span>
          {Object.entries(STATUS_CONFIG).map(([val, cfg]) => (
            <button key={val} onClick={() => setAll(val)}
              style={{ padding: '5px 14px', borderRadius: 8, border: `1.5px solid ${cfg.color}40`, background: cfg.bg, color: cfg.color, fontWeight: 700, fontSize: '0.78rem', cursor: 'pointer', fontFamily: 'inherit' }}>
              {cfg.label}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-2">
          {['all', 'unmarked', 'marked'].map(f => (
            <button key={f} onClick={() => setFilter(f)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${filter === f ? 'bg-accent text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>
              {f.charAt(0).toUpperCase() + f.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* Student list */}
      <div className="card overflow-hidden">
        <div className="divide-y divide-gray-50">
          {filtered.length === 0 ? (
            <div className="py-12 text-center text-gray-400 text-sm">No students found.</div>
          ) : (
            filtered.map((s, i) => {
              const current = localStatus[s.studentId] || null;
              const cfg = current ? STATUS_CONFIG[current] : null;
              return (
                <div key={s.studentId} className="flex items-center gap-4 p-4 hover:bg-gray-50 transition-colors">
                  {/* Index + Avatar */}
                  <span className="text-xs text-gray-300 w-5 text-right flex-shrink-0">{i + 1}</span>
                  <div className="w-9 h-9 rounded-xl flex items-center justify-center text-sm font-bold flex-shrink-0"
                    style={{ background: cfg ? cfg.bg : '#f3f4f6', color: cfg ? cfg.color : '#9ca3af' }}>
                    {s.name?.charAt(0).toUpperCase()}
                  </div>
                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-gray-900 truncate">{s.name}</p>
                    <p className="text-xs text-gray-400">{s.rollNumber} · {s.room}</p>
                  </div>
                  {/* Status badge */}
                  {cfg && (
                    <span className="text-xs font-bold px-2 py-1 rounded-lg flex-shrink-0"
                      style={{ background: cfg.bg, color: cfg.color, border: `1px solid ${cfg.border}` }}>
                      {cfg.label}
                    </span>
                  )}
                  {/* Status buttons */}
                  <div className="flex gap-1.5 flex-shrink-0" style={{ width: 240 }}>
                    {Object.keys(STATUS_CONFIG).map(val => (
                      <StatusBtn key={val} value={val} current={current}
                        onChange={(v) => setLocalStatus(prev => ({ ...prev, [s.studentId]: v }))} />
                    ))}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Sticky save button on mobile */}
      <div className="fixed bottom-6 right-6 z-50">
        <button onClick={handleSave} disabled={saving || markedCount === 0}
          className="btn-primary flex items-center gap-2 shadow-xl"
          style={{ opacity: saving || markedCount === 0 ? 0.5 : 1 }}>
          <Save size={15} />
          {saving ? 'Saving…' : 'Save'}
        </button>
      </div>
    </div>
  );
}
