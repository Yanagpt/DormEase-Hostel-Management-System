import { useState, useEffect, useCallback } from 'react';
import { AlertCircle, Check, CheckCircle2, Eye, RefreshCw, Search } from 'lucide-react';
import api from '../../api/axios';
import toast from 'react-hot-toast';
import { PageHeader, Badge, Modal, Spinner, Pagination, EmptyState, StatCard, FormField } from '../../components/common/UI';

export default function AdminComplaints() {
  const [complaints, setComplaints] = useState([]);
  const [pagination, setPagination] = useState(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [priorityFilter, setPriorityFilter] = useState('');
  const [page, setPage] = useState(1);
  const [selected, setSelected] = useState(null);
  const [actionModal, setActionModal] = useState(null);
  const [actionForm, setActionForm] = useState({ status: '', note: '' });
  const [submitting, setSubmitting] = useState(false);

  const fetchComplaints = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page, limit: 10 });
      if (search) params.set('search', search);
      if (statusFilter) params.set('status', statusFilter);
      if (priorityFilter) params.set('priority', priorityFilter);
      const res = await api.get(`/complaints?${params}`);
      setComplaints(res.data.data);
      setPagination(res.data.pagination);
    } catch { toast.error('Failed to load complaints.'); }
    finally { setLoading(false); }
  }, [page, search, statusFilter, priorityFilter]);

  useEffect(() => { fetchComplaints(); }, [fetchComplaints]);

  const handleUpdateStatus = async (e) => {
    e.preventDefault();
    if (!actionForm.status) return toast.error('Select a status.');
    setSubmitting(true);
    try {
      await api.put(`/complaints/${actionModal._id}/status`, actionForm);
      toast.success('Complaint updated.');
      setActionModal(null);
      setActionForm({ status: '', note: '' });
      fetchComplaints();
      if (selected?._id === actionModal._id) {
        const res = await api.get(`/complaints/${actionModal._id}`);
        setSelected(res.data.data);
      }
    } catch (err) { toast.error(err.response?.data?.message || 'Failed.'); }
    finally { setSubmitting(false); }
  };

  const counts = {
    open: complaints.filter(c => c.status === 'open').length,
    inProgress: complaints.filter(c => c.status === 'in-progress').length,
    resolved: complaints.filter(c => c.status === 'resolved').length,
  };

  return (
    <div>
      <PageHeader title="Complaints" subtitle="Manage and resolve student complaints" />

      {/* Filters */}
      <div className="card p-4 mb-5 flex items-center gap-3 flex-wrap">
        <div className="flex items-center gap-2 bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 flex-1">
          <Search size={14} className="text-gray-400" />
          <input placeholder="Search complaints..." value={search}
            onChange={e => { setSearch(e.target.value); setPage(1); }}
            className="bg-transparent text-sm outline-none flex-1" />
        </div>
        <select value={statusFilter} onChange={e => { setStatusFilter(e.target.value); setPage(1); }} className="input w-36 py-2">
          <option value="">All Status</option>
          {['open','in-progress','resolved','closed','rejected'].map(s => <option key={s} value={s}>{s}</option>)}
        </select>
        <select value={priorityFilter} onChange={e => { setPriorityFilter(e.target.value); setPage(1); }} className="input w-36 py-2">
          <option value="">All Priority</option>
          {['low','medium','high','urgent'].map(p => <option key={p} value={p}>{p}</option>)}
        </select>
      </div>

      {/* Table */}
      <div className="card overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50 border-b border-gray-100">
            <tr>{['ID','Issue','Student','Room','Category','Priority','Status','Date','Actions'].map(h => <th key={h} className="table-th">{h}</th>)}</tr>
          </thead>
          <tbody>
            {loading ? <tr><td colSpan={9}><Spinner /></td></tr>
              : complaints.length === 0 ? <tr><td colSpan={9}><EmptyState title="No complaints found" /></td></tr>
              : complaints.map(c => (
                <tr key={c._id} className="table-row">
                  <td className="table-td font-mono text-xs text-gray-500">{c.complaintId}</td>
                  <td className="table-td">
                    <p className="font-semibold text-sm text-gray-900 max-w-[160px] truncate">{c.title}</p>
                  </td>
                  <td className="table-td text-xs">{c.student?.name}</td>
                  <td className="table-td text-xs">{c.room?.roomNumber || '—'}</td>
                  <td className="table-td text-xs capitalize">{c.category}</td>
                  <td className="table-td"><Badge label={c.priority} variant={c.priority} /></td>
                  <td className="table-td"><Badge label={c.status} variant={c.status} /></td>
                  <td className="table-td text-xs text-gray-400">{new Date(c.createdAt).toLocaleDateString('en-IN')}</td>
                  <td className="table-td">
                    <div className="flex items-center gap-1">
                      <button onClick={() => setSelected(c)} className="btn-ghost p-1.5"><Eye size={14} /></button>
                      {c.status !== 'resolved' && c.status !== 'closed' && (
                        <button onClick={() => { setActionModal(c); setActionForm({ status: '', note: '' }); }}
                          className="btn-ghost p-1.5"><RefreshCw size={14} className="text-amber-500" /></button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
          </tbody>
        </table>
        <div className="px-4"><Pagination pagination={pagination} onPageChange={setPage} /></div>
      </div>

      {/* View Modal */}
      <Modal open={!!selected} onClose={() => setSelected(null)} title="Complaint Details" size="lg">
        {selected && (
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <span className="font-mono text-sm text-gray-500">{selected.complaintId}</span>
              <Badge label={selected.priority} variant={selected.priority} />
              <Badge label={selected.status} variant={selected.status} />
            </div>
            <div>
              <h3 className="font-bold text-gray-900 text-base mb-1">{selected.title}</h3>
              <p className="text-sm text-gray-600 leading-relaxed">{selected.description}</p>
            </div>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div><span className="text-gray-400 text-xs uppercase font-semibold">Student</span><p className="font-medium">{selected.student?.name}</p></div>
              <div><span className="text-gray-400 text-xs uppercase font-semibold">Room</span><p className="font-medium">{selected.room?.roomNumber || '—'}</p></div>
              <div><span className="text-gray-400 text-xs uppercase font-semibold">Category</span><p className="font-medium capitalize">{selected.category}</p></div>
              <div><span className="text-gray-400 text-xs uppercase font-semibold">Submitted</span><p className="font-medium">{new Date(selected.createdAt).toLocaleDateString('en-IN')}</p></div>
            </div>
            {selected.timeline?.length > 0 && (
              <div>
                <p className="text-xs uppercase font-semibold text-gray-400 mb-2">Timeline</p>
                <div className="space-y-2">
                  {selected.timeline.map((t, i) => (
                    <div key={i} className="flex gap-3 text-sm">
                      <div className="w-2 h-2 rounded-full bg-accent mt-1.5 flex-shrink-0" />
                      <div>
                        <span className="font-semibold capitalize">{t.status}</span>
                        {t.note && <span className="text-gray-500"> — {t.note}</span>}
                        <span className="text-xs text-gray-400 ml-2">{new Date(t.updatedAt).toLocaleString('en-IN')}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
            {selected.status !== 'resolved' && selected.status !== 'closed' && (
              <button onClick={() => { setActionModal(selected); setActionForm({ status: '', note: '' }); }}
                className="btn-primary w-full">Update Status</button>
            )}
          </div>
        )}
      </Modal>

      {/* Update Status Modal */}
      <Modal open={!!actionModal} onClose={() => setActionModal(null)} title="Update Complaint Status" size="sm">
        <form onSubmit={handleUpdateStatus} className="space-y-4">
          <FormField label="New Status">
            <select className="input" value={actionForm.status} onChange={e => setActionForm(f => ({ ...f, status: e.target.value }))} required>
              <option value="">Select status...</option>
              {['in-progress','resolved','closed','rejected'].map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </FormField>
          <FormField label="Note">
            <textarea className="input" rows={3} value={actionForm.note}
              onChange={e => setActionForm(f => ({ ...f, note: e.target.value }))}
              placeholder="Add a resolution note..." />
          </FormField>
          <div className="flex justify-end gap-3">
            <button type="button" onClick={() => setActionModal(null)} className="btn-outline">Cancel</button>
            <button type="submit" disabled={submitting} className="btn-primary">{submitting ? 'Updating...' : 'Update'}</button>
          </div>
        </form>
      </Modal>
    </div>
  );
}