import { useState, useEffect, useCallback } from 'react';
import {
  Plus, Search, Users, Wrench, Building2,
  Settings, Trash2, Edit2, X, Check,
} from 'lucide-react';
import api from '../../api/axios';
import toast from 'react-hot-toast';
import {
  PageHeader, Badge, Spinner, EmptyState, StatCard, FormField,
} from '../../components/common/UI';

const AMENITY_OPTIONS = [
  'ac', 'wifi', 'tv', 'fridge', 'wardrobe',
  'attached-bathroom', 'balcony', 'study-table',
];
const ALL_STATUSES = ['available', 'full', 'maintenance', 'reserved'];
const EMPTY_FORM = {
  roomNumber: '', floor: 1, block: 'A', type: 'double',
  capacity: 2, monthlyRent: 8000, amenities: [], description: '',
};

/* ── tiny inline Modal to avoid import issues ───────────────────── */
function Modal({ open, onClose, title, children, size = 'md' }) {
  if (!open) return null;
  const w = { sm: 420, md: 560, lg: 740 }[size] || 560;
  return (
    <div onClick={onClose} style={{ position: 'fixed', inset: 0, zIndex: 50, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16, background: 'rgba(0,0,0,0.45)', backdropFilter: 'blur(4px)' }}>
      <div onClick={function(e) { e.stopPropagation(); }} style={{ background: '#fff', borderRadius: 20, boxShadow: '0 24px 60px rgba(0,0,0,0.15)', width: '100%', maxWidth: w, maxHeight: '90vh', overflowY: 'auto' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '20px 24px 16px', borderBottom: '1px solid #f0f0f0' }}>
          <h2 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 700, color: '#111' }}>{title}</h2>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#9ca3af', padding: 4, borderRadius: 8, lineHeight: 1 }}><X size={16} /></button>
        </div>
        <div style={{ padding: '20px 24px 24px' }}>{children}</div>
      </div>
    </div>
  );
}

function Confirm({ open, onClose, onConfirm, title, message, danger, loading }) {
  if (!open) return null;
  return (
    <Modal open={open} onClose={onClose} title={title} size="sm">
      <p style={{ color: '#6b7280', fontSize: '0.875rem', marginBottom: 20 }}>{message}</p>
      <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
        <button onClick={onClose} style={{ padding: '8px 16px', borderRadius: 8, border: '1px solid #e5e7eb', background: '#fff', cursor: 'pointer', fontWeight: 600, fontSize: '0.875rem' }}>Cancel</button>
        <button onClick={onConfirm} disabled={loading}
          style={{ padding: '8px 16px', borderRadius: 8, border: 'none', background: danger ? '#ef4444' : '#e94560', color: '#fff', cursor: 'pointer', fontWeight: 600, fontSize: '0.875rem', opacity: loading ? 0.6 : 1 }}>
          {loading ? 'Processing...' : 'Confirm'}
        </button>
      </div>
    </Modal>
  );
}

export default function AdminRooms() {
  const [rooms, setRooms]           = useState([]);
  const [stats, setStats]           = useState(null);
  const [loading, setLoading]       = useState(true);
  const [search, setSearch]         = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [page, setPage]             = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalRooms, setTotalRooms] = useState(0);

  // Add / Edit modal
  const [roomModal, setRoomModal]   = useState(null); // null | 'add' | room-object(edit)
  const [form, setForm]             = useState(EMPTY_FORM);
  const [submitting, setSubmitting] = useState(false);

  // Status change modal
  const [statusModal, setStatusModal]   = useState(null);
  const [statusNote, setStatusNote]     = useState('');
  const [changingStatus, setChangingStatus] = useState(false);

  // Assign student
  const [assignModal, setAssignModal]   = useState(null);
  const [availStudents, setAvailStudents] = useState([]);
  const [selStudent, setSelStudent]     = useState('');

  // Delete
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting]         = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const q = new URLSearchParams({ page, limit: 9 });
      if (search) q.set('search', search);
      if (statusFilter) q.set('status', statusFilter);
      const [rRes, sRes] = await Promise.all([
        api.get('/rooms?' + q),
        api.get('/rooms/stats'),
      ]);
      setRooms(rRes.data.data || []);
      setTotalPages(rRes.data.pagination?.pages || 1);
      setTotalRooms(rRes.data.pagination?.total || 0);
      setStats(sRes.data.data);
    } catch { toast.error('Failed to load rooms.'); }
    finally { setLoading(false); }
  }, [page, search, statusFilter]);

  useEffect(() => { load(); }, [load]);

  // Open add modal
  function openAdd() { setForm(EMPTY_FORM); setRoomModal('add'); }

  // Open edit modal
  function openEdit(room) {
    setForm({
      roomNumber:  room.roomNumber,
      floor:       room.floor,
      block:       room.block,
      type:        room.type,
      capacity:    room.capacity,
      monthlyRent: room.monthlyRent,
      amenities:   room.amenities || [],
      description: room.description || '',
    });
    setRoomModal(room);
  }

  function toggleAmenity(a) {
    setForm(function(f) {
      return Object.assign({}, f, {
        amenities: f.amenities.includes(a)
          ? f.amenities.filter(function(x) { return x !== a; })
          : [...f.amenities, a],
      });
    });
  }

  // Submit add or edit
  async function handleSubmitRoom(e) {
    e.preventDefault();
    setSubmitting(true);
    try {
      if (roomModal === 'add') {
        await api.post('/rooms', form);
        toast.success('Room created successfully.');
      } else {
        await api.put('/rooms/' + roomModal._id, form);
        toast.success('Room updated successfully.');
      }
      setRoomModal(null);
      load();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed.');
    } finally {
      setSubmitting(false);
    }
  }

  // Delete room
  async function handleDelete() {
    setDeleting(true);
    try {
      await api.delete('/rooms/' + deleteTarget._id);
      toast.success('Room deleted.');
      setDeleteTarget(null);
      load();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Cannot delete — remove occupants first.');
    } finally {
      setDeleting(false);
    }
  }

  // Change status
  async function handleStatusChange(e) {
    e.preventDefault();
    if (!statusModal?.newStatus) return;
    setChangingStatus(true);
    try {
      await api.put('/rooms/' + statusModal.room._id, { status: statusModal.newStatus });
      toast.success('Room status updated to "' + statusModal.newStatus + '".');
      setStatusModal(null);
      setStatusNote('');
      load();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed.');
    } finally {
      setChangingStatus(false);
    }
  }

  // Assign student
  async function fetchAvailStudents() {
    const res = await api.get('/users/students?limit=200');
    setAvailStudents((res.data.data || []).filter(function(s) { return !s.room; }));
  }
  async function handleAssign() {
    if (!selStudent) return toast.error('Select a student first.');
    try {
      await api.post('/rooms/' + assignModal._id + '/assign', { studentId: selStudent });
      toast.success('Student assigned.');
      setAssignModal(null);
      setSelStudent('');
      load();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed.');
    }
  }
  async function handleRemove(roomId, studentId) {
    try {
      await api.delete('/rooms/' + roomId + '/remove/' + studentId);
      toast.success('Student removed from room.');
      load();
    } catch { toast.error('Failed.'); }
  }

  const STATUS_PILL = {
    available:   'badge-green',
    full:        'badge-red',
    maintenance: 'badge-amber',
    reserved:    'badge-purple',
  };

  /* ── Room form (shared for add + edit) ──────────────────────── */
  function RoomForm({ onClose }) {
    return (
      <form onSubmit={handleSubmitRoom}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
          <FormField label="Room Number">
            <input className="input" value={form.roomNumber} required placeholder="e.g. 101"
              onChange={function(e) { setForm(function(f) { return Object.assign({}, f, { roomNumber: e.target.value }); }); }}
              disabled={roomModal !== 'add'} /* can't change room number on edit */
            />
          </FormField>
          <FormField label="Block">
            <input className="input" value={form.block} placeholder="A"
              onChange={function(e) { setForm(function(f) { return Object.assign({}, f, { block: e.target.value }); }); }} />
          </FormField>
          <FormField label="Floor">
            <input type="number" className="input" value={form.floor} min={0}
              onChange={function(e) { setForm(function(f) { return Object.assign({}, f, { floor: Number(e.target.value) }); }); }} />
          </FormField>
          <FormField label="Type">
            <select className="input" value={form.type}
              onChange={function(e) { setForm(function(f) { return Object.assign({}, f, { type: e.target.value }); }); }}>
              {['single','double','triple','quad','dormitory'].map(function(t) {
                return <option key={t} value={t}>{t.charAt(0).toUpperCase() + t.slice(1)}</option>;
              })}
            </select>
          </FormField>
          <FormField label="Capacity (beds)">
            <input type="number" className="input" value={form.capacity} min={1} max={20}
              onChange={function(e) { setForm(function(f) { return Object.assign({}, f, { capacity: Number(e.target.value) }); }); }} />
          </FormField>
          <FormField label="Monthly Rent (₹)">
            <input type="number" className="input" value={form.monthlyRent} min={0}
              onChange={function(e) { setForm(function(f) { return Object.assign({}, f, { monthlyRent: Number(e.target.value) }); }); }} />
          </FormField>
        </div>

        <div style={{ marginTop: 14 }}>
          <label className="label">Amenities</label>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 6 }}>
            {AMENITY_OPTIONS.map(function(a) {
              const active = form.amenities.includes(a);
              return (
                <button key={a} type="button" onClick={function() { toggleAmenity(a); }}
                  style={{ padding: '5px 12px', borderRadius: 8, fontSize: '0.78rem', fontWeight: 600, cursor: 'pointer', transition: 'all 0.15s', textTransform: 'capitalize',
                    background: active ? '#e94560' : '#f3f4f6', color: active ? '#fff' : '#6b7280', border: 'none' }}>
                  {a.replace('-', ' ')}
                </button>
              );
            })}
          </div>
        </div>

        <FormField label="Description (optional)" >
          <input className="input" style={{ marginTop: 14 }} value={form.description} placeholder="Any notes about this room..."
            onChange={function(e) { setForm(function(f) { return Object.assign({}, f, { description: e.target.value }); }); }} />
        </FormField>

        <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 20, paddingTop: 16, borderTop: '1px solid #f3f4f6' }}>
          <button type="button" onClick={onClose} className="btn-outline">Cancel</button>
          <button type="submit" disabled={submitting} className="btn-primary">
            {submitting ? 'Saving...' : roomModal === 'add' ? 'Create Room' : 'Save Changes'}
          </button>
        </div>
      </form>
    );
  }

  return (
    <div>
      <PageHeader
        title="Room Management"
        subtitle="Add, edit, delete rooms and manage occupants"
        actions={
          <button onClick={openAdd} className="btn-primary flex items-center gap-2">
            <Plus size={15} /> Add Room
          </button>
        }
      />

      {/* Stats */}
      {stats && (
        <div className="grid grid-cols-4 gap-4 mb-6">
          <StatCard label="Total Rooms"     value={stats.totalRooms}         icon={Building2} color="#4f46e5" />
          <StatCard label="Occupancy"       value={stats.occupancyRate + '%'} icon={Users}    color="#7c3aed"
            sub={stats.totalOccupied + '/' + stats.totalCapacity + ' beds'} />
          <StatCard label="Available"
            value={String(stats.byStatus.find(function(s) { return s._id === 'available'; })?.count || 0)}
            icon={Building2} color="#059669" />
          <StatCard label="Maintenance"
            value={String(stats.byStatus.find(function(s) { return s._id === 'maintenance'; })?.count || 0)}
            icon={Wrench} color="#d97706" />
        </div>
      )}

      {/* Filters */}
      <div className="card p-4 mb-5 flex items-center gap-3 flex-wrap">
        <div className="flex items-center gap-2 bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 flex-1">
          <Search size={14} className="text-gray-400" />
          <input placeholder="Search room number..." value={search}
            onChange={function(e) { setSearch(e.target.value); setPage(1); }}
            className="bg-transparent text-sm outline-none flex-1" />
        </div>
        {['', 'available', 'full', 'maintenance', 'reserved'].map(function(s) {
          return (
            <button key={s} onClick={function() { setStatusFilter(s); setPage(1); }}
              className={'px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors capitalize ' +
                (statusFilter === s ? 'bg-accent text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200')}>
              {s === '' ? 'All' : s}
            </button>
          );
        })}
      </div>

      {/* Room Cards Grid */}
      {loading ? (
        <Spinner />
      ) : rooms.length === 0 ? (
        <EmptyState icon={Building2} title="No rooms found" description="Add a room to get started." />
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16, marginBottom: 16 }}>
          {rooms.map(function(room) {
            return (
              <div key={room._id} className="card" style={{ padding: 20, transition: 'transform 0.15s', cursor: 'default' }}
                onMouseEnter={function(e) { e.currentTarget.style.transform = 'translateY(-2px)'; }}
                onMouseLeave={function(e) { e.currentTarget.style.transform = 'none'; }}>

                {/* Card header */}
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 12 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <div style={{ width: 40, height: 40, borderRadius: 12, background: '#eef2ff', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      <Building2 size={18} color="#4f46e5" />
                    </div>
                    <div>
                      <p style={{ margin: 0, fontWeight: 700, color: '#111', fontSize: '0.95rem' }}>Room {room.roomNumber}</p>
                      <p style={{ margin: 0, fontSize: '0.75rem', color: '#9ca3af' }}>Floor {room.floor} · Block {room.block}</p>
                    </div>
                  </div>
                  <span className={STATUS_PILL[room.status] || 'badge-gray'}>{room.status}</span>
                </div>

                {/* Meta row */}
                <div style={{ display: 'flex', gap: 12, fontSize: '0.78rem', color: '#6b7280', marginBottom: 12, flexWrap: 'wrap' }}>
                  <span><strong style={{ color: '#374151' }}>{room.occupants?.length || 0}</strong>/{room.capacity} beds</span>
                  <span className="font-semibold" style={{ color: '#374151' }}>₹{room.monthlyRent?.toLocaleString()}/mo</span>
                  <span style={{ textTransform: 'capitalize' }}>{room.type}</span>
                </div>

                {/* Amenities */}
                {room.amenities?.length > 0 && (
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, marginBottom: 12 }}>
                    {room.amenities.slice(0, 4).map(function(a) {
                      return (
                        <span key={a} style={{ fontSize: '0.68rem', background: '#f3f4f6', color: '#6b7280', padding: '2px 7px', borderRadius: 5, textTransform: 'capitalize' }}>
                          {a.replace('-', ' ')}
                        </span>
                      );
                    })}
                    {room.amenities.length > 4 && (
                      <span style={{ fontSize: '0.68rem', color: '#9ca3af' }}>+{room.amenities.length - 4} more</span>
                    )}
                  </div>
                )}

                {/* Occupants */}
                {room.occupants?.length > 0 && (
                  <div style={{ marginBottom: 12, display: 'flex', flexDirection: 'column', gap: 4 }}>
                    {room.occupants.map(function(occ) {
                      return (
                        <div key={occ._id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: '#f9fafb', borderRadius: 8, padding: '5px 10px' }}>
                          <span style={{ fontSize: '0.78rem', fontWeight: 500, color: '#374151', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 140 }}>
                            {occ.user?.name}
                          </span>
                          <button onClick={function() { handleRemove(room._id, occ._id); }}
                            style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#f87171', fontSize: '0.7rem', fontWeight: 700, flexShrink: 0 }}>
                            Remove
                          </button>
                        </div>
                      );
                    })}
                  </div>
                )}

                {/* Action buttons */}
                <div style={{ display: 'flex', gap: 6 }}>
                  {/* Assign */}
                  {room.status === 'available' && (
                    <button
                      onClick={async function() { await fetchAvailStudents(); setAssignModal(room); }}
                      style={{ flex: 1, padding: '7px 0', background: '#fde8ec', color: '#e94560', border: 'none', borderRadius: 8, fontSize: '0.75rem', fontWeight: 700, cursor: 'pointer' }}>
                      + Assign Student
                    </button>
                  )}

                  {/* Edit */}
                  <button onClick={function() { openEdit(room); }}
                    style={{ padding: '7px 10px', background: '#f3f4f6', border: 'none', borderRadius: 8, cursor: 'pointer', color: '#6b7280', display: 'flex', alignItems: 'center' }}
                    title="Edit room">
                    <Edit2 size={13} />
                  </button>

                  {/* Status */}
                  <button onClick={function() { setStatusModal({ room: room, newStatus: '' }); setStatusNote(''); }}
                    style={{ padding: '7px 10px', background: '#f3f4f6', border: 'none', borderRadius: 8, cursor: 'pointer', color: '#6b7280', display: 'flex', alignItems: 'center' }}
                    title="Change status">
                    <Settings size={13} />
                  </button>

                  {/* Delete */}
                  <button onClick={function() { setDeleteTarget(room); }}
                    style={{ padding: '7px 10px', background: '#fef2f2', border: 'none', borderRadius: 8, cursor: 'pointer', color: '#f87171', display: 'flex', alignItems: 'center' }}
                    title="Delete room">
                    <Trash2 size={13} />
                  </button>
                </div>

                {room.status === 'maintenance' && (
                  <div style={{ marginTop: 8, padding: '6px 10px', background: '#fef3c7', borderRadius: 8, fontSize: '0.72rem', color: '#92400e' }}>
                    🔧 Under maintenance — change status to make available
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
          <span style={{ fontSize: '0.85rem', color: '#6b7280' }}>Total: {totalRooms} rooms</span>
          <div style={{ display: 'flex', gap: 6 }}>
            <button disabled={page === 1} onClick={function() { setPage(page - 1); }}
              className="btn-outline" style={{ padding: '6px 14px', fontSize: '0.82rem', opacity: page === 1 ? 0.4 : 1 }}>Prev</button>
            <span style={{ alignSelf: 'center', fontSize: '0.82rem', color: '#374151', fontWeight: 600 }}>{page} / {totalPages}</span>
            <button disabled={page >= totalPages} onClick={function() { setPage(page + 1); }}
              className="btn-outline" style={{ padding: '6px 14px', fontSize: '0.82rem', opacity: page >= totalPages ? 0.4 : 1 }}>Next</button>
          </div>
        </div>
      )}

      {/* ── Add / Edit Room Modal ──────────────────────────── */}
      <Modal
        open={roomModal !== null}
        onClose={function() { setRoomModal(null); }}
        title={roomModal === 'add' ? 'Add New Room' : 'Edit Room ' + (roomModal?.roomNumber || '')}
        size="lg">
        <RoomForm onClose={function() { setRoomModal(null); }} />
      </Modal>

      {/* ── Change Status Modal ────────────────────────────── */}
      <Modal
        open={!!statusModal}
        onClose={function() { setStatusModal(null); }}
        title={'Change Status — Room ' + (statusModal?.room?.roomNumber || '')}
        size="sm">
        {statusModal && (
          <form onSubmit={handleStatusChange}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 14px', background: '#f9fafb', borderRadius: 10, marginBottom: 16 }}>
              <span style={{ fontSize: '0.85rem', color: '#6b7280' }}>Current:</span>
              <span className={STATUS_PILL[statusModal.room.status] || 'badge-gray'}>{statusModal.room.status}</span>
            </div>

            <label className="label" style={{ marginBottom: 8, display: 'block' }}>Change to</label>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 16 }}>
              {ALL_STATUSES.filter(function(s) { return s !== statusModal.room.status; }).map(function(s) {
                const selected = statusModal.newStatus === s;
                const colors = {
                  available:   { bg: '#d1fae5', text: '#065f46', border: '#34d399' },
                  full:        { bg: '#fee2e2', text: '#991b1b', border: '#f87171' },
                  maintenance: { bg: '#fef3c7', text: '#92400e', border: '#fbbf24' },
                  reserved:    { bg: '#ede9fe', text: '#5b21b6', border: '#a78bfa' },
                };
                const c = colors[s] || { bg: '#f3f4f6', text: '#374151', border: '#d1d5db' };
                return (
                  <button key={s} type="button"
                    onClick={function() { setStatusModal(function(m) { return Object.assign({}, m, { newStatus: s }); }); }}
                    style={{
                      padding: '10px 0', borderRadius: 10, cursor: 'pointer', fontSize: '0.85rem',
                      fontWeight: 700, textTransform: 'capitalize', transition: 'all 0.15s',
                      background: selected ? c.bg : '#f9fafb',
                      color: selected ? c.text : '#6b7280',
                      border: '2px solid ' + (selected ? c.border : '#e5e7eb'),
                    }}>
                    {s}
                  </button>
                );
              })}
            </div>

            {statusModal.newStatus === 'maintenance' && statusModal.room.occupants?.length > 0 && (
              <div style={{ padding: '10px 12px', background: '#fef3c7', borderRadius: 8, fontSize: '0.78rem', color: '#92400e', marginBottom: 14 }}>
                ⚠️ This room has {statusModal.room.occupants.length} occupant(s). Remove them before marking maintenance.
              </div>
            )}

            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
              <button type="button" onClick={function() { setStatusModal(null); }} className="btn-outline">Cancel</button>
              <button type="submit" disabled={!statusModal.newStatus || changingStatus} className="btn-primary"
                style={{ opacity: !statusModal.newStatus ? 0.4 : 1 }}>
                {changingStatus ? 'Updating...' : 'Update Status'}
              </button>
            </div>
          </form>
        )}
      </Modal>

      {/* ── Assign Student Modal ───────────────────────────── */}
      <Modal
        open={!!assignModal}
        onClose={function() { setAssignModal(null); }}
        title={'Assign Student — Room ' + (assignModal?.roomNumber || '')}
        size="sm">
        <div>
          <p style={{ fontSize: '0.875rem', color: '#6b7280', marginBottom: 14 }}>
            Available beds: <strong>{assignModal ? (assignModal.capacity - (assignModal.occupants?.length || 0)) : 0}</strong>
          </p>
          <FormField label="Select Student">
            <select className="input" value={selStudent}
              onChange={function(e) { setSelStudent(e.target.value); }}>
              <option value="">Choose unassigned student...</option>
              {availStudents.length === 0
                ? <option disabled>No unassigned students</option>
                : availStudents.map(function(s) {
                    return <option key={s._id} value={s._id}>{s.user?.name} ({s.rollNumber})</option>;
                  })}
            </select>
          </FormField>
          <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 16 }}>
            <button onClick={function() { setAssignModal(null); }} className="btn-outline">Cancel</button>
            <button onClick={handleAssign} disabled={!selStudent} className="btn-primary"
              style={{ opacity: !selStudent ? 0.5 : 1 }}>
              Assign
            </button>
          </div>
        </div>
      </Modal>

      {/* ── Delete Confirm ─────────────────────────────────── */}
      <Confirm
        open={!!deleteTarget}
        onClose={function() { setDeleteTarget(null); }}
        onConfirm={handleDelete}
        title="Delete Room"
        message={'Permanently delete Room ' + (deleteTarget?.roomNumber || '') + '? This cannot be undone. Rooms with occupants cannot be deleted.'}
        danger
        loading={deleting}
      />
    </div>
  );
}