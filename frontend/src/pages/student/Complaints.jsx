import { useState, useEffect, useCallback } from 'react';
import { Plus, Eye, AlertCircle, Pencil, Trash2 } from 'lucide-react';
import api from '../../api/axios';
import toast from 'react-hot-toast';
import { PageHeader, Badge, Modal, Spinner, Pagination, EmptyState, StatCard, FormField, ConfirmDialog } from '../../components/common/UI';

const CATEGORIES = ['electrical','plumbing','furniture','network','cleaning','security','mess','other'];
const PRIORITIES = ['low','medium','high','urgent'];
const EMPTY_FORM = { title: '', description: '', category: 'electrical', priority: 'medium' };

export default function StudentComplaints() {
  const [complaints, setComplaints] = useState([]);
  const [pagination, setPagination] = useState(null);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null); // null = creating, otherwise editing this complaint
  const [selected, setSelected] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [submitting, setSubmitting] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(null);

  const fetchComplaints = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page, limit: 8 });
      if (statusFilter) params.set('status', statusFilter);
      const res = await api.get(`/complaints?${params}`);
      setComplaints(res.data.data);
      setPagination(res.data.pagination);
    } catch { }
    finally { setLoading(false); }
  }, [page, statusFilter]);

  useEffect(() => { fetchComplaints(); }, [fetchComplaints]);

  const openCreate = () => { setEditingId(null); setForm(EMPTY_FORM); setShowForm(true); };

  const openEdit = (c) => {
    setEditingId(c._id);
    setForm({ title: c.title, description: c.description, category: c.category, priority: c.priority });
    setShowForm(true);
    setSelected(null); // close detail view if open
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      if (editingId) {
        await api.put(`/complaints/${editingId}`, form);
        toast.success('Complaint updated.');
      } else {
        await api.post('/complaints', form);
        toast.success('Complaint submitted successfully.');
      }
      setShowForm(false);
      setEditingId(null);
      setForm(EMPTY_FORM);
      fetchComplaints();
    } catch (err) { toast.error(err.response?.data?.message || 'Failed to submit.'); }
    finally { setSubmitting(false); }
  };

  const handleDelete = async () => {
    try {
      await api.delete(`/complaints/${confirmDelete._id}`);
      toast.success('Complaint deleted.');
      setConfirmDelete(null);
      setSelected(null);
      fetchComplaints();
    } catch (err) { toast.error(err.response?.data?.message || 'Failed to delete.'); }
  };

  const open = complaints.filter(c => c.status === 'open').length;
  const inProgress = complaints.filter(c => c.status === 'in-progress').length;
  const resolved = complaints.filter(c => c.status === 'resolved').length;

  return (
    <div>
      <PageHeader title="Complaints" subtitle="Submit and track your maintenance requests"
        actions={
          <button onClick={openCreate} className="btn-primary flex items-center gap-2">
            <Plus size={15} /> New Complaint
          </button>
        }
      />

      <div className="grid grid-cols-3 gap-4 mb-5">
        <StatCard label="Open" value={open} icon={AlertCircle} color="#e94560" />
        <StatCard label="In Progress" value={inProgress} icon={AlertCircle} color="#d97706" />
        <StatCard label="Resolved" value={resolved} icon={AlertCircle} color="#059669" />
      </div>

      <div className="card p-4 mb-4 flex gap-2 flex-wrap">
        {['','open','in-progress','resolved'].map(s => (
          <button key={s} onClick={() => { setStatusFilter(s); setPage(1); }}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${statusFilter === s ? 'bg-accent text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>
            {s === '' ? 'All' : s}
          </button>
        ))}
      </div>

      {loading ? <Spinner /> : complaints.length === 0 ? (
        <EmptyState icon={AlertCircle} title="No complaints yet" description="Submit a complaint when you have a maintenance issue." />
      ) : (
        <div className="space-y-3 mb-4">
          {complaints.map(c => (
            <div key={c._id} className="card p-4 hover:shadow-md transition-shadow">
              <div className="flex items-start gap-4">
                <div className="flex-1 min-w-0 cursor-pointer" onClick={() => setSelected(c)}>
                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                    <span className="font-mono text-xs text-gray-400">{c.complaintId}</span>
                    <Badge label={c.priority} variant={c.priority} />
                    <Badge label={c.status} variant={c.status} />
                    {c.status === 'open' && (
                      <span className="text-xs text-gray-300 italic">· editable</span>
                    )}
                  </div>
                  <h3 className="font-bold text-gray-900 mb-0.5">{c.title}</h3>
                  <p className="text-sm text-gray-500 line-clamp-1">{c.description}</p>
                </div>
                <div className="flex items-center gap-1 flex-shrink-0">
                  {c.status === 'open' && (
                    <>
                      <button onClick={() => openEdit(c)}
                        className="p-2 rounded-lg hover:bg-indigo-50 text-gray-400 hover:text-indigo-600 transition-colors"
                        title="Edit complaint">
                        <Pencil size={14} />
                      </button>
                      <button onClick={() => setConfirmDelete(c)}
                        className="p-2 rounded-lg hover:bg-red-50 text-gray-400 hover:text-red-500 transition-colors"
                        title="Delete complaint">
                        <Trash2 size={14} />
                      </button>
                    </>
                  )}
                  <div className="text-right ml-2">
                    <p className="text-xs text-gray-400">{new Date(c.createdAt).toLocaleDateString('en-IN')}</p>
                    <p className="text-xs text-gray-400 mt-0.5 capitalize">{c.category}</p>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
      <Pagination pagination={pagination} onPageChange={setPage} />

      {/* Create / Edit Complaint Modal */}
      <Modal open={showForm} onClose={() => { setShowForm(false); setEditingId(null); }} title={editingId ? 'Edit Complaint' : 'Submit New Complaint'} size="md">
        <form onSubmit={handleSubmit} className="space-y-4">
          <FormField label="Title">
            <input className="input" value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} required placeholder="Brief description of the issue" />
          </FormField>
          <div className="grid grid-cols-2 gap-4">
            <FormField label="Category">
              <select className="input" value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value }))}>
                {CATEGORIES.map(c => <option key={c} value={c}>{c.charAt(0).toUpperCase() + c.slice(1)}</option>)}
              </select>
            </FormField>
            <FormField label="Priority">
              <select className="input" value={form.priority} onChange={e => setForm(f => ({ ...f, priority: e.target.value }))}>
                {PRIORITIES.map(p => <option key={p} value={p}>{p.charAt(0).toUpperCase() + p.slice(1)}</option>)}
              </select>
            </FormField>
          </div>
          <FormField label="Description">
            <textarea className="input" rows={4} value={form.description}
              onChange={e => setForm(f => ({ ...f, description: e.target.value }))} required
              placeholder="Describe the issue in detail..." />
          </FormField>
          <div className="flex justify-end gap-3 pt-1">
            <button type="button" onClick={() => { setShowForm(false); setEditingId(null); }} className="btn-outline">Cancel</button>
            <button type="submit" disabled={submitting} className="btn-primary">
              {submitting ? (editingId ? 'Saving...' : 'Submitting...') : (editingId ? 'Save Changes' : 'Submit Complaint')}
            </button>
          </div>
        </form>
      </Modal>

      {/* View Complaint Modal */}
      <Modal open={!!selected} onClose={() => setSelected(null)} title="Complaint Details" size="md">
        {selected && (
          <div className="space-y-4">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-mono text-sm text-gray-500">{selected.complaintId}</span>
              <Badge label={selected.priority} variant={selected.priority} />
              <Badge label={selected.status} variant={selected.status} />
            </div>
            <div>
              <h3 className="font-bold text-gray-900 mb-1">{selected.title}</h3>
              <p className="text-sm text-gray-600 leading-relaxed">{selected.description}</p>
            </div>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div><p className="text-xs text-gray-400 font-semibold uppercase mb-0.5">Category</p><p className="font-medium capitalize">{selected.category}</p></div>
              <div><p className="text-xs text-gray-400 font-semibold uppercase mb-0.5">Submitted</p><p className="font-medium">{new Date(selected.createdAt).toLocaleDateString('en-IN')}</p></div>
              {selected.assignedTo && <div><p className="text-xs text-gray-400 font-semibold uppercase mb-0.5">Assigned To</p><p className="font-medium">{selected.assignedTo.name}</p></div>}
              {selected.resolvedAt && <div><p className="text-xs text-gray-400 font-semibold uppercase mb-0.5">Resolved</p><p className="font-medium">{new Date(selected.resolvedAt).toLocaleDateString('en-IN')}</p></div>}
            </div>
            {selected.timeline?.length > 0 && (
              <div>
                <p className="text-xs text-gray-400 font-semibold uppercase mb-2">Timeline</p>
                <div className="space-y-2 border-l-2 border-gray-100 pl-4">
                  {selected.timeline.map((t, i) => (
                    <div key={i} className="text-sm">
                      <span className="font-semibold capitalize text-gray-800">{t.status}</span>
                      {t.note && <span className="text-gray-500"> — {t.note}</span>}
                      <div className="text-xs text-gray-400">{new Date(t.updatedAt).toLocaleString('en-IN')}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}
            {selected.status === 'open' && (
              <div className="flex justify-end gap-2 pt-2 border-t border-gray-100">
                <button onClick={() => openEdit(selected)} className="btn-outline flex items-center gap-1.5 text-sm">
                  <Pencil size={13} /> Edit
                </button>
                <button onClick={() => setConfirmDelete(selected)} className="flex items-center gap-1.5 text-sm px-4 py-2 rounded-xl bg-red-50 text-red-600 font-semibold hover:bg-red-100 transition-colors">
                  <Trash2 size={13} /> Delete
                </button>
              </div>
            )}
          </div>
        )}
      </Modal>

      <ConfirmDialog
        open={!!confirmDelete} onClose={() => setConfirmDelete(null)} onConfirm={handleDelete}
        title="Delete Complaint" message={`Are you sure you want to delete "${confirmDelete?.title}"? This cannot be undone.`}
        confirmLabel="Delete" danger
      />
    </div>
  );
}
