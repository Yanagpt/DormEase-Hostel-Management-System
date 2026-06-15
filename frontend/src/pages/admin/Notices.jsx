import { useState, useEffect, useCallback } from 'react';
import { Plus, Trash2, Pin, Bell } from 'lucide-react';
import api from '../../api/axios';
import toast from 'react-hot-toast';
import { PageHeader, Badge, Modal, Spinner, Pagination, EmptyState, ConfirmDialog, FormField } from '../../components/common/UI';

const TAG_OPTIONS = ['important','maintenance','event','general','emergency','fees'];
const INIT_FORM = { title: '', body: '', tag: 'general', targetAudience: 'all', isPinned: false, expiresAt: '' };

export default function AdminNotices() {
  const [notices, setNotices] = useState([]);
  const [pagination, setPagination] = useState(null);
  const [loading, setLoading] = useState(true);
  const [tagFilter, setTagFilter] = useState('');
  const [page, setPage] = useState(1);
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState(INIT_FORM);
  const [submitting, setSubmitting] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(null);

  const fetchNotices = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page, limit: 8 });
      if (tagFilter) params.set('tag', tagFilter);
      const res = await api.get(`/notices?${params}`);
      setNotices(res.data.data);
      setPagination(res.data.pagination);
    } catch { toast.error('Failed to load notices.'); }
    finally { setLoading(false); }
  }, [page, tagFilter]);

  useEffect(() => { fetchNotices(); }, [fetchNotices]);

  const handleCreate = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await api.post('/notices', { ...form, expiresAt: form.expiresAt || null });
      toast.success('Notice posted.');
      setShowAdd(false);
      setForm(INIT_FORM);
      fetchNotices();
    } catch (err) { toast.error(err.response?.data?.message || 'Failed.'); }
    finally { setSubmitting(false); }
  };

  const handleDelete = async () => {
    try {
      await api.delete(`/notices/${confirmDelete._id}`);
      toast.success('Notice deleted.');
      setConfirmDelete(null);
      fetchNotices();
    } catch { toast.error('Failed.'); }
  };

  const handleTogglePin = async (notice) => {
    try {
      await api.put(`/notices/${notice._id}`, { isPinned: !notice.isPinned });
      toast.success(notice.isPinned ? 'Notice unpinned.' : 'Notice pinned.');
      fetchNotices();
    } catch { toast.error('Failed.'); }
  };

  const TAG_COLORS = { important: 'red', maintenance: 'amber', event: 'purple', general: 'blue', emergency: 'red', fees: 'green' };

  return (
    <div>
      <PageHeader title="Notices" subtitle="Post and manage hostel announcements"
        actions={
          <button onClick={() => setShowAdd(true)} className="btn-primary flex items-center gap-2">
            <Plus size={15} /> Post Notice
          </button>
        }
      />

      <div className="flex gap-2 mb-5 flex-wrap">
        {['', ...TAG_OPTIONS].map(t => (
          <button key={t} onClick={() => { setTagFilter(t); setPage(1); }}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors capitalize ${tagFilter === t ? 'bg-accent text-white' : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'}`}>
            {t === '' ? 'All' : t}
          </button>
        ))}
      </div>

      {loading ? <Spinner /> : notices.length === 0 ? <EmptyState title="No notices found" icon={Bell} /> : (
        <div className="space-y-3 mb-4">
          {notices.map(n => (
            <div key={n._id} className={`card p-5 ${n.isPinned ? 'border-accent/30 bg-accent/[0.02]' : ''}`}>
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-2 flex-wrap">
                    {n.isPinned && <Pin size={13} className="text-accent flex-shrink-0" />}
                    <Badge label={n.tag} variant={TAG_COLORS[n.tag] || 'blue'} />
                    <span className="text-xs text-gray-400">{new Date(n.createdAt).toLocaleDateString('en-IN')}</span>
                    <span className="text-xs text-gray-400">· {n.views} views</span>
                    <span className="text-xs text-gray-400">· By {n.postedBy?.name}</span>
                  </div>
                  <h3 className="font-bold text-gray-900 mb-1">{n.title}</h3>
                  <p className="text-sm text-gray-500 leading-relaxed line-clamp-2">{n.body}</p>
                </div>
                <div className="flex items-center gap-1 flex-shrink-0">
                  <button onClick={() => handleTogglePin(n)}
                    className={`p-2 rounded-lg transition-colors ${n.isPinned ? 'bg-accent/10 text-accent' : 'hover:bg-gray-100 text-gray-400'}`}>
                    <Pin size={14} />
                  </button>
                  <button onClick={() => setConfirmDelete(n)}
                    className="p-2 rounded-lg hover:bg-red-50 text-gray-400 hover:text-red-500 transition-colors">
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
      <Pagination pagination={pagination} onPageChange={setPage} />

      {/* Add Notice Modal */}
      <Modal open={showAdd} onClose={() => setShowAdd(false)} title="Post New Notice" size="lg">
        <form onSubmit={handleCreate} className="space-y-4">
          <FormField label="Title"><input className="input" value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} required placeholder="Notice title..." /></FormField>
          <FormField label="Body">
            <textarea className="input" rows={5} value={form.body}
              onChange={e => setForm(f => ({ ...f, body: e.target.value }))} required
              placeholder="Write your notice content here..." />
          </FormField>
          <div className="grid grid-cols-2 gap-4">
            <FormField label="Tag">
              <select className="input" value={form.tag} onChange={e => setForm(f => ({ ...f, tag: e.target.value }))}>
                {TAG_OPTIONS.map(t => <option key={t} value={t}>{t.charAt(0).toUpperCase() + t.slice(1)}</option>)}
              </select>
            </FormField>
            <FormField label="Target Audience">
              <select className="input" value={form.targetAudience} onChange={e => setForm(f => ({ ...f, targetAudience: e.target.value }))}>
                {['all','students','wardens'].map(t => <option key={t} value={t}>{t.charAt(0).toUpperCase() + t.slice(1)}</option>)}
              </select>
            </FormField>
          </div>
          <FormField label="Expires At (optional)">
            <input type="date" className="input" value={form.expiresAt} onChange={e => setForm(f => ({ ...f, expiresAt: e.target.value }))} />
          </FormField>
          <label className="flex items-center gap-2 cursor-pointer">
            <input type="checkbox" checked={form.isPinned} onChange={e => setForm(f => ({ ...f, isPinned: e.target.checked }))} className="w-4 h-4 rounded accent-accent" />
            <span className="text-sm font-medium text-gray-700">Pin this notice to the top</span>
          </label>
          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={() => setShowAdd(false)} className="btn-outline">Cancel</button>
            <button type="submit" disabled={submitting} className="btn-primary">{submitting ? 'Posting...' : 'Post Notice'}</button>
          </div>
        </form>
      </Modal>

      <ConfirmDialog
        open={!!confirmDelete} onClose={() => setConfirmDelete(null)} onConfirm={handleDelete}
        title="Delete Notice" message={`Are you sure you want to delete "${confirmDelete?.title}"?`}
        confirmLabel="Delete" danger
      />
    </div>
  );
}
