import { useState, useEffect, useCallback } from 'react';
import { Plus, CalendarDays } from 'lucide-react';
import api from '../../api/axios';
import toast from 'react-hot-toast';
import { PageHeader, Badge, Modal, Spinner, Pagination, EmptyState, StatCard, FormField } from '../../components/common/UI';

const LEAVE_TYPES = ['home-visit','medical','emergency','academic','personal','other'];

export default function StudentLeaves() {
  const [leaves, setLeaves] = useState([]);
  const [pagination, setPagination] = useState(null);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ fromDate: '', toDate: '', reason: '', leaveType: 'personal', contactDuringLeave: { phone: '', address: '' } });
  const [submitting, setSubmitting] = useState(false);

  const fetchLeaves = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page, limit: 8 });
      if (statusFilter) params.set('status', statusFilter);
      const res = await api.get(`/leaves?${params}`);
      setLeaves(res.data.data);
      setPagination(res.data.pagination);
    } catch { }
    finally { setLoading(false); }
  }, [page, statusFilter]);

  useEffect(() => { fetchLeaves(); }, [fetchLeaves]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (new Date(form.toDate) < new Date(form.fromDate)) return toast.error('To date must be after from date.');
    setSubmitting(true);
    try {
      await api.post('/leaves', form);
      toast.success('Leave application submitted.');
      setShowForm(false);
      setForm({ fromDate: '', toDate: '', reason: '', leaveType: 'personal', contactDuringLeave: { phone: '', address: '' } });
      fetchLeaves();
    } catch (err) { toast.error(err.response?.data?.message || 'Failed.'); }
    finally { setSubmitting(false); }
  };

  const handleCancel = async (id) => {
    try {
      await api.put(`/leaves/${id}/cancel`);
      toast.success('Leave request cancelled.');
      fetchLeaves();
    } catch (err) { toast.error(err.response?.data?.message || 'Failed.'); }
  };

  const fmtDate = d => d ? new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '—';
  const approved = leaves.filter(l => l.status === 'approved').length;
  const pending = leaves.filter(l => l.status === 'pending').length;
  const rejected = leaves.filter(l => l.status === 'rejected').length;

  return (
    <div>
      <PageHeader title="Leave Requests" subtitle="Apply for and track your leave approvals"
        actions={
          <button onClick={() => setShowForm(true)} className="btn-primary flex items-center gap-2">
            <Plus size={15} /> Apply for Leave
          </button>
        }
      />

      <div className="grid grid-cols-3 gap-4 mb-5">
        <StatCard label="Approved" value={approved} icon={CalendarDays} color="#059669" />
        <StatCard label="Pending" value={pending} icon={CalendarDays} color="#d97706" />
        <StatCard label="Rejected" value={rejected} icon={CalendarDays} color="#e94560" />
      </div>

      <div className="card p-4 mb-4 flex gap-2">
        {['','pending','approved','rejected','cancelled'].map(s => (
          <button key={s} onClick={() => { setStatusFilter(s); setPage(1); }}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${statusFilter === s ? 'bg-accent text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>
            {s === '' ? 'All' : s.charAt(0).toUpperCase() + s.slice(1)}
          </button>
        ))}
      </div>

      {loading ? <Spinner /> : leaves.length === 0 ? (
        <EmptyState icon={CalendarDays} title="No leave requests" description="Apply for leave when you need to go home or for other reasons." />
      ) : (
        <div className="space-y-3 mb-4">
          {leaves.map(l => (
            <div key={l._id} className="card p-5">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-2 flex-wrap">
                    <span className="font-mono text-xs text-gray-400">{l.leaveId}</span>
                    <Badge label={l.status} variant={l.status} />
                    <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-md font-medium capitalize">{l.leaveType?.replace('-',' ')}</span>
                  </div>
                  <div className="text-sm font-semibold text-gray-800 mb-1">
                    {fmtDate(l.fromDate)} → {fmtDate(l.toDate)}
                    <span className="text-gray-400 font-normal ml-2">({l.totalDays} days)</span>
                  </div>
                  <p className="text-sm text-gray-500 line-clamp-1">{l.reason}</p>
                  {l.approvalNote && (
                    <p className="text-xs text-gray-400 mt-1 italic">Note: {l.approvalNote}</p>
                  )}
                </div>
                <div className="text-right flex-shrink-0 space-y-1.5">
                  <p className="text-xs text-gray-400">Applied {fmtDate(l.createdAt)}</p>
                  {l.status === 'pending' && (
                    <button onClick={() => handleCancel(l._id)}
                      className="text-xs text-red-400 hover:text-red-600 font-semibold block ml-auto transition-colors">
                      Cancel
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
      <Pagination pagination={pagination} onPageChange={setPage} />

      {/* Apply Leave Modal */}
      <Modal open={showForm} onClose={() => setShowForm(false)} title="New Leave Application" size="md">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <FormField label="From Date">
              <input type="date" className="input" value={form.fromDate} onChange={e => setForm(f => ({ ...f, fromDate: e.target.value }))} required min={new Date().toISOString().split('T')[0]} />
            </FormField>
            <FormField label="To Date">
              <input type="date" className="input" value={form.toDate} onChange={e => setForm(f => ({ ...f, toDate: e.target.value }))} required min={form.fromDate || new Date().toISOString().split('T')[0]} />
            </FormField>
          </div>
          <FormField label="Leave Type">
            <select className="input" value={form.leaveType} onChange={e => setForm(f => ({ ...f, leaveType: e.target.value }))}>
              {LEAVE_TYPES.map(t => <option key={t} value={t}>{t.replace('-',' ').replace(/\b\w/g, c => c.toUpperCase())}</option>)}
            </select>
          </FormField>
          <FormField label="Reason">
            <textarea className="input" rows={3} value={form.reason}
              onChange={e => setForm(f => ({ ...f, reason: e.target.value }))} required
              placeholder="State your reason for leave..." />
          </FormField>
          <FormField label="Contact Phone During Leave">
            <input className="input" value={form.contactDuringLeave.phone}
              onChange={e => setForm(f => ({ ...f, contactDuringLeave: { ...f.contactDuringLeave, phone: e.target.value } }))}
              placeholder="+91 XXXXX XXXXX" />
          </FormField>
          <div className="flex justify-end gap-3 pt-1">
            <button type="button" onClick={() => setShowForm(false)} className="btn-outline">Cancel</button>
            <button type="submit" disabled={submitting} className="btn-primary">{submitting ? 'Submitting...' : 'Submit Application'}</button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
