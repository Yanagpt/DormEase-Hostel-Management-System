import { useEffect, useState, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  Building2, Plus, Search, UserCheck, Power, Trash2, X,
  CheckCircle2, XCircle, Clock, ChevronDown, AlertTriangle, RefreshCw,
} from 'lucide-react';
import api from '../../api/axios';
import { PageHeader, Spinner } from '../../components/common/UI';
import toast from 'react-hot-toast';

// ── Status helpers ─────────────────────────────────────────────────────────────
const APPROVAL_STYLE = {
  pending:  { bg: '#fef3c7', text: '#92400e', label: 'Pending',  icon: Clock },
  approved: { bg: '#dcfce7', text: '#166534', label: 'Approved', icon: CheckCircle2 },
  rejected: { bg: '#fee2e2', text: '#991b1b', label: 'Rejected', icon: XCircle },
};
const STATUS_STYLE = {
  active:    { bg: '#dcfce7', text: '#166534', label: 'Active' },
  inactive:  { bg: '#f1f5f9', text: '#64748b', label: 'Inactive' },
  suspended: { bg: '#fee2e2', text: '#991b1b', label: 'Suspended' },
};

// ── Reusable Modal ─────────────────────────────────────────────────────────────
function Modal({ open, onClose, title, children, width = 'max-w-lg' }) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.55)', backdropFilter: 'blur(4px)' }}>
      <div className={`bg-white rounded-2xl shadow-2xl w-full ${width} max-h-[92vh] overflow-y-auto`}>
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <h2 className="font-bold text-gray-800 text-lg">{title}</h2>
          <button onClick={onClose} className="w-8 h-8 rounded-lg hover:bg-gray-100 flex items-center justify-center text-gray-500"><X size={16} /></button>
        </div>
        <div className="p-6">{children}</div>
      </div>
    </div>
  );
}

const inp = "w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400/30 focus:border-indigo-400 transition-colors";
const lbl = "block text-xs font-semibold text-gray-500 mb-1.5 uppercase tracking-wide";

// ══════════════════════════════════════════════════════════════════════════════
export default function SuperAdminHostels() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [tab, setTab] = useState(searchParams.get('tab') || 'all');
  const [hostels, setHostels] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  // Modals
  const [createModal, setCreateModal]       = useState(false);
  const [adminModal, setAdminModal]         = useState(null);
  const [rejectModal, setRejectModal]       = useState(null);
  const [deleteModal, setDeleteModal]       = useState(null);
  const [statusModal, setStatusModal]       = useState(null);

  // Forms
  const [createForm, setCreateForm] = useState({ name: '', type: 'co-ed', city: '', state: '', phone: '', email: '', description: '' });
  const [adminForm, setAdminForm]   = useState({ name: '', email: '', phone: '', password: '' });
  const [rejectReason, setRejectReason] = useState('');
  const [newStatus, setNewStatus]       = useState('');
  const [saving, setSaving] = useState(false);

  // Tabs map to query filters
  const TAB_FILTER = {
    all:      {},
    pending:  { approvalStatus: 'pending' },
    approved: { approvalStatus: 'approved' },
    rejected: { approvalStatus: 'rejected' },
    suspended:{ status: 'suspended' },
  };

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ search, ...TAB_FILTER[tab] });
      const res = await api.get(`/hostels?${params}`);
      setHostels(res.data.data);
    } catch { toast.error('Failed to load hostels.'); }
    finally { setLoading(false); }
  }, [tab, search]);

  useEffect(() => { load(); }, [load]);

  // ── Actions ──────────────────────────────────────────────────────────────
  const handleApprove = async (h) => {
    try {
      const res = await api.put(`/hostels/${h._id}/approve`);
      toast.success(res.data.message);
      load();
    } catch (err) { toast.error(err.response?.data?.message || 'Failed.'); }
  };

  const handleReject = async () => {
    if (!rejectModal) return;
    setSaving(true);
    try {
      await api.put(`/hostels/${rejectModal._id}/reject`, { reason: rejectReason });
      toast.success(`${rejectModal.name} rejected.`);
      setRejectModal(null); setRejectReason('');
      load();
    } catch (err) { toast.error(err.response?.data?.message || 'Failed.'); }
    finally { setSaving(false); }
  };

  const handleSetStatus = async () => {
    if (!statusModal || !newStatus) return;
    setSaving(true);
    try {
      await api.put(`/hostels/${statusModal._id}/status`, { status: newStatus });
      toast.success(`Hostel marked as ${newStatus}.`);
      setStatusModal(null); setNewStatus('');
      load();
    } catch (err) { toast.error(err.response?.data?.message || 'Failed.'); }
    finally { setSaving(false); }
  };

  const handleDelete = async () => {
    if (!deleteModal) return;
    setSaving(true);
    try {
      await api.delete(`/hostels/${deleteModal._id}`);
      toast.success(`${deleteModal.name} deleted.`);
      setDeleteModal(null);
      load();
    } catch (err) { toast.error(err.response?.data?.message || 'Failed to delete.'); }
    finally { setSaving(false); }
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await api.post('/hostels', { ...createForm, address: { city: createForm.city, state: createForm.state } });
      toast.success('Hostel created!');
      setCreateModal(false);
      setCreateForm({ name: '', type: 'co-ed', city: '', state: '', phone: '', email: '', description: '' });
      load();
    } catch (err) { toast.error(err.response?.data?.message || 'Failed.'); }
    finally { setSaving(false); }
  };

  const handleAssignAdmin = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await api.post(`/hostels/${adminModal._id}/assign-admin`, adminForm);
      toast.success('Admin assigned! Credentials emailed.');
      setAdminModal(null); setAdminForm({ name: '', email: '', phone: '', password: '' });
      load();
    } catch (err) { toast.error(err.response?.data?.message || 'Failed.'); }
    finally { setSaving(false); }
  };

  const handleRemoveAdmin = async (h) => {
    if (!confirm(`Remove admin from ${h.name}?`)) return;
    try {
      await api.delete(`/hostels/${h._id}/admin`);
      toast.success('Admin removed.');
      load();
    } catch { toast.error('Failed.'); }
  };

  const sc = (form, setForm) => (f) => (e) => setForm(p => ({ ...p, [f]: e.target.value }));
  const CF = sc(createForm, setCreateForm);
  const AF = sc(adminForm,  setAdminForm);

  const TABS = [
    { key: 'all',       label: 'All' },
    { key: 'pending',   label: 'Pending',   color: 'text-amber-600' },
    { key: 'approved',  label: 'Approved',  color: 'text-green-600' },
    { key: 'rejected',  label: 'Rejected',  color: 'text-red-500' },
    { key: 'suspended', label: 'Suspended', color: 'text-orange-500' },
  ];

  return (
    <div>
      <PageHeader
        title="Manage Hostels"
        subtitle="Approve, configure and monitor all hostels"
        action={
          <button onClick={() => setCreateModal(true)} className="btn-primary flex items-center gap-2">
            <Plus size={15} /> Create Hostel
          </button>
        }
      />

      {/* Tabs */}
      <div className="flex gap-1 mb-5 bg-gray-100 p-1 rounded-xl w-fit">
        {TABS.map(t => (
          <button key={t.key} onClick={() => { setTab(t.key); setSearchParams(t.key !== 'all' ? { tab: t.key } : {}); }}
            className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all ${tab === t.key ? 'bg-white shadow-sm text-gray-800' : `text-gray-500 hover:text-gray-700 ${t.color || ''}`}`}>
            {t.label}
          </button>
        ))}
      </div>

      {/* Search */}
      <div className="relative mb-5 max-w-sm">
        <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
        <input className={inp + " pl-9"} placeholder="Search hostels…" value={search} onChange={e => setSearch(e.target.value)} />
      </div>

      {loading ? <Spinner /> : (
        <>
          {/* Hostel cards */}
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
            {hostels.map(h => {
              const as = APPROVAL_STYLE[h.approvalStatus] || APPROVAL_STYLE.pending;
              const ss = STATUS_STYLE[h.status] || STATUS_STYLE.inactive;
              const AIcon = as.icon;
              return (
                <div key={h._id} className="card p-5">
                  {/* Header */}
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className="w-11 h-11 rounded-xl bg-indigo-50 flex items-center justify-center flex-shrink-0">
                        <Building2 size={20} className="text-indigo-600" />
                      </div>
                      <div>
                        <h3 className="font-bold text-gray-900">{h.name}</h3>
                        <p className="text-xs text-gray-400">
                          {h.code ? <span className="font-mono font-bold text-indigo-600">{h.code}</span> : <span className="italic text-gray-300">No code yet</span>}
                          {h.address?.city ? ` · ${h.address.city}` : ''}
                          {h.type ? ` · ${h.type}` : ''}
                        </p>
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-1">
                      <span className="px-2.5 py-1 rounded-lg text-xs font-bold flex items-center gap-1" style={{ background: as.bg, color: as.text }}>
                        <AIcon size={11} /> {as.label}
                      </span>
                      {h.approvalStatus === 'approved' && (
                        <span className="px-2.5 py-1 rounded-lg text-xs font-bold" style={{ background: ss.bg, color: ss.text }}>{ss.label}</span>
                      )}
                    </div>
                  </div>

                  {/* Contact info for pending */}
                  {h.approvalStatus === 'pending' && (
                    <div className="bg-amber-50 border border-amber-100 rounded-xl p-3 mb-3">
                      <p className="text-xs font-semibold text-amber-700 mb-1">Contact Person</p>
                      <p className="text-sm font-semibold text-gray-800">{h.contactName}</p>
                      <p className="text-xs text-gray-500">{h.contactEmail} · {h.contactPhone}</p>
                      {h.description && <p className="text-xs text-gray-500 mt-1 line-clamp-2">{h.description}</p>}
                    </div>
                  )}

                  {/* Stats row — only for approved */}
                  {h.approvalStatus === 'approved' && (
                    <>
                      <div className="grid grid-cols-3 gap-2 mb-3">
                        {[
                          { label: 'Students', value: h.stats?.students ?? 0 },
                          { label: 'Rooms',    value: h.stats?.rooms ?? 0 },
                          { label: 'Wardens',  value: h.stats?.wardens ?? 0 },
                        ].map(s => (
                          <div key={s.label} className="bg-gray-50 rounded-xl p-2.5 text-center">
                            <p className="text-base font-black text-gray-800">{s.value}</p>
                            <p className="text-xs text-gray-400">{s.label}</p>
                          </div>
                        ))}
                      </div>

                      {/* Admin row */}
                      <div className="flex items-center gap-2 mb-3 p-2.5 rounded-xl bg-gray-50">
                        <UserCheck size={13} className={h.admin ? 'text-green-500' : 'text-red-400'} />
                        {h.admin ? (
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-semibold text-gray-700 truncate">{h.admin.name}</p>
                            <p className="text-xs text-gray-400 truncate">{h.admin.email}</p>
                          </div>
                        ) : <p className="text-sm text-red-400 font-medium flex-1">No admin assigned</p>}
                        {h.admin && (
                          <button onClick={() => handleRemoveAdmin(h)} className="text-xs text-red-400 hover:text-red-600 font-semibold">Remove</button>
                        )}
                      </div>
                    </>
                  )}

                  {/* Action buttons */}
                  <div className="flex flex-wrap gap-2">
                    {/* Pending actions */}
                    {h.approvalStatus === 'pending' && (
                      <>
                        <button onClick={() => handleApprove(h)}
                          className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-green-50 text-green-700 text-xs font-semibold hover:bg-green-100 transition-colors">
                          <CheckCircle2 size={13} /> Approve
                        </button>
                        <button onClick={() => setRejectModal(h)}
                          className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-red-50 text-red-600 text-xs font-semibold hover:bg-red-100 transition-colors">
                          <XCircle size={13} /> Reject
                        </button>
                      </>
                    )}

                    {/* Approved actions */}
                    {h.approvalStatus === 'approved' && (
                      <>
                        <button onClick={() => setAdminModal(h)}
                          className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-indigo-50 text-indigo-700 text-xs font-semibold hover:bg-indigo-100 transition-colors">
                          <UserCheck size={13} /> {h.admin ? 'Replace Admin' : 'Assign Admin'}
                        </button>
                        <button onClick={() => { setStatusModal(h); setNewStatus(h.status === 'active' ? 'suspended' : 'active'); }}
                          className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold transition-colors ${h.status === 'active' ? 'bg-orange-50 text-orange-600 hover:bg-orange-100' : 'bg-green-50 text-green-700 hover:bg-green-100'}`}>
                          <Power size={13} /> {h.status === 'active' ? 'Suspend' : 'Activate'}
                        </button>
                      </>
                    )}

                    {/* Always available */}
                    <button onClick={() => setDeleteModal(h)}
                      className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-red-50 text-red-500 text-xs font-semibold hover:bg-red-100 transition-colors ml-auto">
                      <Trash2 size={13} /> Delete
                    </button>
                  </div>
                </div>
              );
            })}

            {hostels.length === 0 && !loading && (
              <div className="col-span-2 card p-14 text-center text-gray-400">
                <Building2 size={40} className="mx-auto mb-3 opacity-25" />
                <p className="font-semibold">No hostels found</p>
                <p className="text-sm mt-1">{tab === 'pending' ? 'No pending applications' : 'Try a different filter'}</p>
              </div>
            )}
          </div>
        </>
      )}

      {/* ── Create Hostel Modal ── */}
      <Modal open={createModal} onClose={() => setCreateModal(false)} title="Create Hostel Directly">
        <p className="text-sm text-gray-500 mb-4">This bypasses the approval flow — the hostel goes live immediately.</p>
        <form onSubmit={handleCreate} className="space-y-4">
          <div>
            <label className={lbl}>Hostel Name *</label>
            <input className={inp} placeholder="e.g. Boys Hostel Block A" value={createForm.name} onChange={CF('name')} required />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={lbl}>Type</label>
              <select className={inp} value={createForm.type} onChange={CF('type')}>
                <option value="boys">Boys</option>
                <option value="girls">Girls</option>
                <option value="co-ed">Co-Ed</option>
              </select>
            </div>
            <div>
              <label className={lbl}>City</label>
              <input className={inp} placeholder="City" value={createForm.city} onChange={CF('city')} />
            </div>
            <div>
              <label className={lbl}>State</label>
              <input className={inp} placeholder="State" value={createForm.state} onChange={CF('state')} />
            </div>
            <div>
              <label className={lbl}>Phone</label>
              <input className={inp} placeholder="Contact number" value={createForm.phone} onChange={CF('phone')} />
            </div>
          </div>
          <div className="flex gap-3 pt-1">
            <button type="button" onClick={() => setCreateModal(false)} className="flex-1 py-2.5 rounded-xl border border-gray-200 text-sm font-semibold text-gray-600 hover:bg-gray-50">Cancel</button>
            <button type="submit" disabled={saving} className="flex-1 py-2.5 rounded-xl bg-accent text-white text-sm font-semibold disabled:opacity-50">{saving ? 'Creating…' : 'Create'}</button>
          </div>
        </form>
      </Modal>

      {/* ── Assign Admin Modal ── */}
      <Modal open={!!adminModal} onClose={() => setAdminModal(null)} title={`Assign Admin — ${adminModal?.name}`}>
        <div className="mb-4 p-3 bg-indigo-50 rounded-xl text-sm text-indigo-700">
          A new admin account will be created and credentials sent by email.
          {adminModal?.admin && <span className="block mt-1 text-amber-600 font-semibold">⚠ This will deactivate the current admin.</span>}
        </div>
        <form onSubmit={handleAssignAdmin} className="space-y-3">
          <div>
            <label className={lbl}>Admin Name *</label>
            <input className={inp} placeholder="Full name" value={adminForm.name} onChange={AF('name')} required />
          </div>
          <div>
            <label className={lbl}>Email *</label>
            <input type="email" className={inp} placeholder="admin@hostel.com" value={adminForm.email} onChange={AF('email')} required />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={lbl}>Phone</label>
              <input className={inp} placeholder="Phone" value={adminForm.phone} onChange={AF('phone')} />
            </div>
            <div>
              <label className={lbl}>Password *</label>
              <input type="password" className={inp} placeholder="Min 6 chars" value={adminForm.password} onChange={AF('password')} required minLength={6} />
            </div>
          </div>
          <div className="flex gap-3 pt-1">
            <button type="button" onClick={() => setAdminModal(null)} className="flex-1 py-2.5 rounded-xl border border-gray-200 text-sm font-semibold text-gray-600 hover:bg-gray-50">Cancel</button>
            <button type="submit" disabled={saving} className="flex-1 py-2.5 rounded-xl bg-accent text-white text-sm font-semibold disabled:opacity-50">{saving ? 'Assigning…' : 'Assign Admin'}</button>
          </div>
        </form>
      </Modal>

      {/* ── Reject Modal ── */}
      <Modal open={!!rejectModal} onClose={() => { setRejectModal(null); setRejectReason(''); }} title={`Reject — ${rejectModal?.name}`}>
        <div className="mb-4 p-3 bg-red-50 rounded-xl text-sm text-red-700">
          The contact person will be notified by email with your reason.
        </div>
        <div className="mb-4">
          <label className={lbl}>Rejection Reason (optional)</label>
          <textarea className={inp} rows={3} placeholder="e.g. Incomplete information, duplicate application…" value={rejectReason} onChange={e => setRejectReason(e.target.value)} />
        </div>
        <div className="flex gap-3">
          <button onClick={() => { setRejectModal(null); setRejectReason(''); }} className="flex-1 py-2.5 rounded-xl border border-gray-200 text-sm font-semibold text-gray-600 hover:bg-gray-50">Cancel</button>
          <button onClick={handleReject} disabled={saving} className="flex-1 py-2.5 rounded-xl bg-red-500 text-white text-sm font-semibold disabled:opacity-50">{saving ? 'Rejecting…' : 'Confirm Reject'}</button>
        </div>
      </Modal>

      {/* ── Status Change Modal ── */}
      <Modal open={!!statusModal} onClose={() => setStatusModal(null)} title={`Change Status — ${statusModal?.name}`}>
        <div className={`mb-5 p-3 rounded-xl text-sm font-medium ${newStatus === 'suspended' ? 'bg-orange-50 text-orange-700' : 'bg-green-50 text-green-700'}`}>
          {newStatus === 'suspended'
            ? '⚠ Suspending will deactivate all users (admin, wardens, students) in this hostel immediately.'
            : '✅ Activating will restore access for all approved users in this hostel.'}
        </div>
        <div className="mb-4">
          <label className={lbl}>New Status</label>
          <select className={inp} value={newStatus} onChange={e => setNewStatus(e.target.value)}>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
            <option value="suspended">Suspended</option>
          </select>
        </div>
        <div className="flex gap-3">
          <button onClick={() => setStatusModal(null)} className="flex-1 py-2.5 rounded-xl border border-gray-200 text-sm font-semibold text-gray-600 hover:bg-gray-50">Cancel</button>
          <button onClick={handleSetStatus} disabled={saving} className="flex-1 py-2.5 rounded-xl bg-accent text-white text-sm font-semibold disabled:opacity-50">{saving ? 'Saving…' : 'Confirm'}</button>
        </div>
      </Modal>

      {/* ── Delete Confirm Modal ── */}
      <Modal open={!!deleteModal} onClose={() => setDeleteModal(null)} title="Delete Hostel">
        <div className="flex items-start gap-3 p-4 bg-red-50 rounded-xl mb-5">
          <AlertTriangle size={20} className="text-red-500 flex-shrink-0 mt-0.5" />
          <div>
            <p className="font-bold text-red-700 text-sm">This is permanent and cannot be undone.</p>
            <p className="text-sm text-red-600 mt-1">
              Deleting <strong>{deleteModal?.name}</strong> will remove the hostel and all associated admin/warden accounts.
              Hostels with active students or rooms cannot be deleted.
            </p>
          </div>
        </div>
        <div className="flex gap-3">
          <button onClick={() => setDeleteModal(null)} className="flex-1 py-2.5 rounded-xl border border-gray-200 text-sm font-semibold text-gray-600 hover:bg-gray-50">Cancel</button>
          <button onClick={handleDelete} disabled={saving} className="flex-1 py-2.5 rounded-xl bg-red-500 text-white text-sm font-semibold disabled:opacity-50">{saving ? 'Deleting…' : '⚠ Delete Permanently'}</button>
        </div>
      </Modal>
    </div>
  );
}
