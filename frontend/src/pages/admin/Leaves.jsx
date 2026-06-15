import { useState, useEffect, useCallback } from 'react';
import { Search, Check, X, Eye } from 'lucide-react';
import api from '../../api/axios';
import toast from 'react-hot-toast';
import { PageHeader, Badge, Modal, Spinner, Pagination, EmptyState, FormField } from '../../components/common/UI';

export default function AdminLeaves() {
  const [leaves, setLeaves] = useState([]);
  const [pagination, setPagination] = useState(null);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('');
  const [page, setPage] = useState(1);
  const [selected, setSelected] = useState(null);
  const [approvalModal, setApprovalModal] = useState(null);
  const [approvalNote, setApprovalNote] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const fetchLeaves = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page, limit: 10 });
      if (statusFilter) params.set('status', statusFilter);
      const res = await api.get(`/leaves?${params}`);
      setLeaves(res.data.data);
      setPagination(res.data.pagination);
    } catch { toast.error('Failed to load leave requests.'); }
    finally { setLoading(false); }
  }, [page, statusFilter]);

  useEffect(() => { fetchLeaves(); }, [fetchLeaves]);

  const handleApproval = async (status) => {
    setSubmitting(true);
    try {
      await api.put(`/leaves/${approvalModal._id}/status`, { status, approvalNote });
      toast.success(`Leave ${status} successfully.`);
      setApprovalModal(null);
      setApprovalNote('');
      fetchLeaves();
    } catch (err) { toast.error(err.response?.data?.message || 'Failed.'); }
    finally { setSubmitting(false); }
  };

  const fmtDate = d => d ? new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '—';

  return (
    <div>
      <PageHeader title="Leave Requests" subtitle="Review and approve student leave applications" />

      <div className="card p-4 mb-5 flex items-center gap-3">
        {['', 'pending', 'approved', 'rejected'].map(s => (
          <button key={s} onClick={() => { setStatusFilter(s); setPage(1); }}
            className={`px-4 py-1.5 rounded-lg text-xs font-semibold transition-colors ${statusFilter === s ? 'bg-accent text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>
            {s === '' ? 'All' : s.charAt(0).toUpperCase() + s.slice(1)}
          </button>
        ))}
      </div>

      <div className="card overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50 border-b border-gray-100">
            <tr>{['ID','Student','From','To','Days','Type','Reason','Status','Actions'].map(h => <th key={h} className="table-th">{h}</th>)}</tr>
          </thead>
          <tbody>
            {loading ? <tr><td colSpan={9}><Spinner /></td></tr>
              : leaves.length === 0 ? <tr><td colSpan={9}><EmptyState title="No leave requests found" /></td></tr>
              : leaves.map(l => (
                <tr key={l._id} className="table-row">
                  <td className="table-td font-mono text-xs text-gray-500">{l.leaveId}</td>
                  <td className="table-td font-semibold text-sm">{l.student?.name}</td>
                  <td className="table-td text-xs">{fmtDate(l.fromDate)}</td>
                  <td className="table-td text-xs">{fmtDate(l.toDate)}</td>
                  <td className="table-td text-xs font-bold">{l.totalDays}d</td>
                  <td className="table-td text-xs capitalize">{l.leaveType?.replace('-', ' ')}</td>
                  <td className="table-td text-xs text-gray-500 max-w-[150px] truncate">{l.reason}</td>
                  <td className="table-td"><Badge label={l.status} variant={l.status} /></td>
                  <td className="table-td">
                    <div className="flex items-center gap-1">
                      <button onClick={() => setSelected(l)} className="btn-ghost p-1.5"><Eye size={14} /></button>
                      {l.status === 'pending' && (
                        <>
                          <button onClick={() => { setApprovalModal(l); setApprovalNote(''); }}
                            className="p-1.5 rounded-lg bg-emerald-50 text-emerald-600 hover:bg-emerald-100 transition-colors"><Check size={14} /></button>
                          <button onClick={() => { setApprovalModal({ ...l, _action: 'reject' }); setApprovalNote(''); }}
                            className="p-1.5 rounded-lg bg-red-50 text-red-500 hover:bg-red-100 transition-colors"><X size={14} /></button>
                        </>
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
      <Modal open={!!selected} onClose={() => setSelected(null)} title="Leave Request Details" size="md">
        {selected && (
          <div className="space-y-4">
            <div className="flex gap-2">
              <Badge label={selected.status} variant={selected.status} />
              <span className="font-mono text-xs text-gray-400 self-center">{selected.leaveId}</span>
            </div>
            <div className="grid grid-cols-2 gap-3 text-sm">
              {[
                ['Student', selected.student?.name],
                ['Type', selected.leaveType?.replace('-', ' ')],
                ['From', fmtDate(selected.fromDate)],
                ['To', fmtDate(selected.toDate)],
                ['Total Days', `${selected.totalDays} days`],
                ['Applied On', fmtDate(selected.createdAt)],
              ].map(([label, val]) => (
                <div key={label}>
                  <p className="text-xs text-gray-400 font-semibold uppercase mb-0.5">{label}</p>
                  <p className="font-medium capitalize">{val}</p>
                </div>
              ))}
            </div>
            <div>
              <p className="text-xs text-gray-400 font-semibold uppercase mb-1">Reason</p>
              <p className="text-sm text-gray-700 bg-gray-50 rounded-xl p-3 leading-relaxed">{selected.reason}</p>
            </div>
            {selected.approvalNote && (
              <div>
                <p className="text-xs text-gray-400 font-semibold uppercase mb-1">Approval Note</p>
                <p className="text-sm text-gray-700">{selected.approvalNote}</p>
              </div>
            )}
            {selected.status === 'pending' && (
              <button onClick={() => { setApprovalModal(selected); setSelected(null); }}
                className="btn-primary w-full">Review Request</button>
            )}
          </div>
        )}
      </Modal>

      {/* Approval Modal */}
      <Modal open={!!approvalModal} onClose={() => setApprovalModal(null)}
        title={approvalModal?._action === 'reject' ? 'Reject Leave Request' : 'Approve/Reject Leave'} size="sm">
        <div className="space-y-4">
          <p className="text-sm text-gray-600">
            Student: <strong>{approvalModal?.student?.name}</strong><br />
            Period: <strong>{fmtDate(approvalModal?.fromDate)} – {fmtDate(approvalModal?.toDate)}</strong>
          </p>
          <FormField label="Note (optional)">
            <textarea className="input" rows={3} value={approvalNote}
              onChange={e => setApprovalNote(e.target.value)}
              placeholder="Add a note for the student..." />
          </FormField>
          <div className="flex gap-3">
            <button onClick={() => handleApproval('approved')} disabled={submitting}
              className="flex-1 py-2 bg-emerald-500 text-white text-sm font-semibold rounded-lg hover:bg-emerald-600 transition-colors disabled:opacity-50">
              {submitting ? '...' : 'Approve'}
            </button>
            <button onClick={() => handleApproval('rejected')} disabled={submitting}
              className="flex-1 py-2 bg-red-500 text-white text-sm font-semibold rounded-lg hover:bg-red-600 transition-colors disabled:opacity-50">
              {submitting ? '...' : 'Reject'}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
