import { useState, useEffect, useCallback } from 'react';
import { Plus, Search, Users, Wrench, Building2, Settings } from 'lucide-react';
import api from '../../api/axios';
import toast from 'react-hot-toast';
import { PageHeader, Badge, Modal, Spinner, Pagination, EmptyState, StatCard, FormField, ConfirmDialog } from '../../components/common/UI';

const INIT_FORM = { roomNumber: '', floor: 1, block: 'A', type: 'double', capacity: 2, monthlyRent: 8000, amenities: [], description: '' };
const AMENITY_OPTIONS = ['ac','wifi','tv','fridge','wardrobe','attached-bathroom','balcony','study-table'];
const ALL_STATUSES = ['available','full','maintenance','reserved'];

export default function AdminRooms() {
  const [rooms, setRooms] = useState([]);
  const [pagination, setPagination] = useState(null);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [page, setPage] = useState(1);

  // Add room
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState(INIT_FORM);
  const [submitting, setSubmitting] = useState(false);

  // Assign student
  const [assignModal, setAssignModal] = useState(null);
  const [students, setStudents] = useState([]);
  const [selectedStudent, setSelectedStudent] = useState('');

  // Change room status
  const [statusModal, setStatusModal] = useState(null); // { room, newStatus }
  const [statusNote, setStatusNote] = useState('');
  const [changingStatus, setChangingStatus] = useState(false);

  // Delete room
  const [confirmDelete, setConfirmDelete] = useState(null);

  const fetchRooms = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page, limit: 9 });
      if (search) params.set('search', search);
      if (statusFilter) params.set('status', statusFilter);
      const [roomsRes, statsRes] = await Promise.all([
        api.get(`/rooms?${params}`),
        api.get('/rooms/stats'),
      ]);
      setRooms(roomsRes.data.data);
      setPagination(roomsRes.data.pagination);
      setStats(statsRes.data.data);
    } catch { toast.error('Failed to load rooms.'); }
    finally { setLoading(false); }
  }, [page, search, statusFilter]);

  useEffect(() => { fetchRooms(); }, [fetchRooms]);

  const fetchStudents = async () => {
    const res = await api.get('/users/students?limit=100');
    // Only students without a room assigned
    setStudents(res.data.data.filter(s => !s.room));
  };

  // Create room
  const handleCreate = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await api.post('/rooms', form);
      toast.success('Room created successfully.');
      setShowAdd(false);
      setForm(INIT_FORM);
      fetchRooms();
    } catch (err) { toast.error(err.response?.data?.message || 'Failed to create room.'); }
    finally { setSubmitting(false); }
  };

  // Assign student to room
  const handleAssign = async () => {
    if (!selectedStudent) return toast.error('Please select a student.');
    try {
      await api.post(`/rooms/${assignModal._id}/assign`, { studentId: selectedStudent });
      toast.success('Student assigned successfully.');
      setAssignModal(null);
      setSelectedStudent('');
      fetchRooms();
    } catch (err) { toast.error(err.response?.data?.message || 'Failed.'); }
  };

  // Remove student from room
  const handleRemove = async (roomId, studentId) => {
    try {
      await api.delete(`/rooms/${roomId}/remove/${studentId}`);
      toast.success('Student removed from room.');
      fetchRooms();
    } catch { toast.error('Failed to remove student.'); }
  };

  // Change room status
  const handleStatusChange = async (e) => {
    e.preventDefault();
    if (!statusModal) return;
    setChangingStatus(true);
    try {
      await api.put(`/rooms/${statusModal.room._id}`, {
        status: statusModal.newStatus,
        ...(statusModal.newStatus === 'maintenance' && statusNote
          ? { description: statusNote }
          : {}),
      });
      toast.success(`Room status changed to "${statusModal.newStatus}".`);
      setStatusModal(null);
      setStatusNote('');
      fetchRooms();
    } catch (err) { toast.error(err.response?.data?.message || 'Failed to update status.'); }
    finally { setChangingStatus(false); }
  };

  // Delete room
  const handleDelete = async () => {
    try {
      await api.delete(`/rooms/${confirmDelete._id}`);
      toast.success('Room deleted.');
      setConfirmDelete(null);
      fetchRooms();
    } catch (err) { toast.error(err.response?.data?.message || 'Failed.'); }
  };

  const toggleAmenity = (a) => setForm(f => ({
    ...f,
    amenities: f.amenities.includes(a)
      ? f.amenities.filter(x => x !== a)
      : [...f.amenities, a],
  }));

  // Status change options per current status
  const getStatusOptions = (currentStatus) =>
    ALL_STATUSES.filter(s => s !== currentStatus);

  const STATUS_COLORS = {
    available:   { bg: 'bg-emerald-50',  text: 'text-emerald-700' },
    full:        { bg: 'bg-red-50',       text: 'text-red-600'     },
    maintenance: { bg: 'bg-amber-50',     text: 'text-amber-700'   },
    reserved:    { bg: 'bg-purple-50',    text: 'text-purple-700'  },
  };

  return (
    <div>
      <PageHeader title="Room Management" subtitle="Manage rooms, occupants and maintenance status"
        actions={
          <button onClick={() => setShowAdd(true)} className="btn-primary flex items-center gap-2">
            <Plus size={15} /> Add Room
          </button>
        }
      />

      {/* Stats */}
      {stats && (
        <div className="grid grid-cols-4 gap-4 mb-6">
          <StatCard label="Total Rooms"     value={stats.totalRooms}       icon={Building2} color="#4f46e5" />
          <StatCard label="Occupancy Rate"  value={`${stats.occupancyRate}%`} icon={Users} color="#7c3aed"
            sub={`${stats.totalOccupied}/${stats.totalCapacity} beds`} />
          <StatCard label="Available"
            value={stats.byStatus.find(s => s._id === 'available')?.count || 0}
            icon={Building2} color="#059669" />
          <StatCard label="Maintenance"
            value={stats.byStatus.find(s => s._id === 'maintenance')?.count || 0}
            icon={Wrench} color="#d97706" />
        </div>
      )}

      {/* Filters */}
      <div className="card p-4 mb-5 flex items-center gap-3 flex-wrap">
        <div className="flex items-center gap-2 bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 flex-1">
          <Search size={14} className="text-gray-400" />
          <input placeholder="Search room number..." value={search}
            onChange={e => { setSearch(e.target.value); setPage(1); }}
            className="bg-transparent text-sm outline-none flex-1" />
        </div>
        {['', 'available', 'full', 'maintenance', 'reserved'].map(s => (
          <button key={s} onClick={() => { setStatusFilter(s); setPage(1); }}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors capitalize
              ${statusFilter === s ? 'bg-accent text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>
            {s === '' ? 'All' : s}
          </button>
        ))}
      </div>

      {/* Room Cards */}
      {loading ? <Spinner /> : rooms.length === 0 ? <EmptyState title="No rooms found" /> : (
        <div className="grid grid-cols-3 gap-4 mb-4">
          {rooms.map(room => (
            <div key={room._id} className="card p-5 hover:-translate-y-0.5 transition-transform">
              {/* Header */}
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-2.5">
                  <div className="w-10 h-10 rounded-xl bg-indigo-50 flex items-center justify-center flex-shrink-0">
                    <Building2 size={18} className="text-indigo-600" />
                  </div>
                  <div>
                    <p className="font-bold text-gray-900">Room {room.roomNumber}</p>
                    <p className="text-xs text-gray-400">Floor {room.floor} · Block {room.block}</p>
                  </div>
                </div>
                <Badge label={room.status} variant={room.status} />
              </div>

              {/* Meta */}
              <div className="flex gap-3 text-xs text-gray-500 mb-3 flex-wrap">
                <span>
                  <span className="font-semibold text-gray-700">{room.occupants.length}</span>/{room.capacity} beds
                </span>
                <span className="font-semibold text-gray-700">₹{room.monthlyRent?.toLocaleString()}/mo</span>
                <span className="capitalize">{room.type}</span>
              </div>

              {/* Occupants */}
              {room.occupants.length > 0 && (
                <div className="space-y-1 mb-3">
                  {room.occupants.map(occ => (
                    <div key={occ._id} className="flex items-center justify-between bg-gray-50 rounded-lg px-2 py-1.5">
                      <span className="text-xs font-medium text-gray-700 truncate">{occ.user?.name}</span>
                      <button onClick={() => handleRemove(room._id, occ._id)}
                        className="text-xs text-red-400 hover:text-red-600 font-semibold transition-colors ml-2 flex-shrink-0">
                        Remove
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {/* Action buttons */}
              <div className="flex gap-2 mt-2">
                {/* Assign student — only when not maintenance/reserved and has space */}
                {room.status === 'available' && (
                  <button
                    onClick={async () => { await fetchStudents(); setAssignModal(room); }}
                    className="flex-1 py-2 bg-accent/10 text-accent text-xs font-bold rounded-lg hover:bg-accent/20 transition-colors">
                    + Assign Student
                  </button>
                )}

                {/* Change Status button — always visible */}
                <button
                  onClick={() => { setStatusModal({ room, newStatus: '' }); setStatusNote(''); }}
                  className="flex items-center gap-1 px-3 py-2 bg-gray-100 text-gray-600 text-xs font-semibold rounded-lg hover:bg-gray-200 transition-colors"
                  title="Change room status">
                  <Settings size={12} /> Status
                </button>
              </div>

              {/* Maintenance notice */}
              {room.status === 'maintenance' && (
                <div className="mt-2 px-3 py-2 bg-amber-50 border border-amber-200 rounded-lg text-xs text-amber-700 font-medium">
                  🔧 Under maintenance — change status to make available
                </div>
              )}
            </div>
          ))}
        </div>
      )}
      <Pagination pagination={pagination} onPageChange={setPage} />

      {/* ── Change Room Status Modal ───────────────────────── */}
      <Modal
        open={!!statusModal}
        onClose={() => setStatusModal(null)}
        title={`Change Status — Room ${statusModal?.room?.roomNumber}`}
        size="sm">
        {statusModal && (
          <form onSubmit={handleStatusChange} className="space-y-4">
            {/* Current status */}
            <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
              <span className="text-sm text-gray-500">Current status:</span>
              <Badge label={statusModal.room.status} variant={statusModal.room.status} />
            </div>

            {/* New status picker */}
            <FormField label="Change to">
              <div className="grid grid-cols-2 gap-2">
                {getStatusOptions(statusModal.room.status).map(s => {
                  const col = STATUS_COLORS[s] || { bg: 'bg-gray-50', text: 'text-gray-700' };
                  const selected = statusModal.newStatus === s;
                  return (
                    <button
                      key={s}
                      type="button"
                      onClick={() => setStatusModal(m => ({ ...m, newStatus: s }))}
                      className={`px-4 py-2.5 rounded-xl text-sm font-semibold capitalize border-2 transition-all
                        ${selected
                          ? `${col.bg} ${col.text} border-current`
                          : 'bg-white border-gray-200 text-gray-500 hover:border-gray-300'}`}>
                      {s}
                    </button>
                  );
                })}
              </div>
            </FormField>

            {/* Reason — shown when going to maintenance */}
            {statusModal.newStatus === 'maintenance' && (
              <FormField label="Maintenance Reason (optional)">
                <input className="input" value={statusNote}
                  onChange={e => setStatusNote(e.target.value)}
                  placeholder="e.g. Plumbing repair, electrical work..." />
              </FormField>
            )}

            {/* Warning if room has occupants and marking maintenance */}
            {statusModal.newStatus === 'maintenance' && statusModal.room.occupants?.length > 0 && (
              <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-700">
                ⚠️ This room has <strong>{statusModal.room.occupants.length}</strong> occupant(s).
                Please remove them before marking as maintenance.
              </div>
            )}

            <div className="flex gap-3 pt-1">
              <button type="button" onClick={() => setStatusModal(null)} className="btn-outline flex-1">
                Cancel
              </button>
              <button
                type="submit"
                disabled={!statusModal.newStatus || changingStatus}
                className="flex-1 py-2 bg-accent text-white text-sm font-bold rounded-lg hover:opacity-90 transition-opacity disabled:opacity-40">
                {changingStatus ? 'Updating...' : 'Update Status'}
              </button>
            </div>
          </form>
        )}
      </Modal>

      {/* ── Add Room Modal ─────────────────────────────────── */}
      <Modal open={showAdd} onClose={() => setShowAdd(false)} title="Add New Room" size="lg">
        <form onSubmit={handleCreate} className="grid grid-cols-2 gap-4">
          <FormField label="Room Number">
            <input className="input" value={form.roomNumber}
              onChange={e => setForm(f => ({ ...f, roomNumber: e.target.value }))}
              required placeholder="e.g. 101" />
          </FormField>
          <FormField label="Block">
            <input className="input" value={form.block}
              onChange={e => setForm(f => ({ ...f, block: e.target.value }))}
              placeholder="A" />
          </FormField>
          <FormField label="Floor">
            <input type="number" className="input" value={form.floor}
              onChange={e => setForm(f => ({ ...f, floor: Number(e.target.value) }))} min={0} />
          </FormField>
          <FormField label="Type">
            <select className="input" value={form.type}
              onChange={e => setForm(f => ({ ...f, type: e.target.value }))}>
              {['single','double','triple','quad','dormitory'].map(t => (
                <option key={t} value={t}>{t.charAt(0).toUpperCase() + t.slice(1)}</option>
              ))}
            </select>
          </FormField>
          <FormField label="Capacity">
            <input type="number" className="input" value={form.capacity}
              onChange={e => setForm(f => ({ ...f, capacity: Number(e.target.value) }))} min={1} />
          </FormField>
          <FormField label="Monthly Rent (₹)">
            <input type="number" className="input" value={form.monthlyRent}
              onChange={e => setForm(f => ({ ...f, monthlyRent: Number(e.target.value) }))} />
          </FormField>
          <div className="col-span-2">
            <label className="label">Amenities</label>
            <div className="flex flex-wrap gap-2">
              {AMENITY_OPTIONS.map(a => (
                <button key={a} type="button" onClick={() => toggleAmenity(a)}
                  className={`px-3 py-1 rounded-lg text-xs font-semibold transition-colors capitalize
                    ${form.amenities.includes(a) ? 'bg-accent text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>
                  {a.replace('-',' ')}
                </button>
              ))}
            </div>
          </div>
          <div className="col-span-2 flex justify-end gap-3 pt-2">
            <button type="button" onClick={() => setShowAdd(false)} className="btn-outline">Cancel</button>
            <button type="submit" disabled={submitting} className="btn-primary">
              {submitting ? 'Creating...' : 'Create Room'}
            </button>
          </div>
        </form>
      </Modal>

      {/* ── Assign Student Modal ───────────────────────────── */}
      <Modal open={!!assignModal} onClose={() => setAssignModal(null)}
        title={`Assign Student — Room ${assignModal?.roomNumber}`} size="sm">
        <div className="space-y-4">
          <p className="text-sm text-gray-500">
            Available beds: <strong>{assignModal ? assignModal.capacity - assignModal.occupants.length : 0}</strong>
          </p>
          <FormField label="Select Student">
            <select className="input" value={selectedStudent}
              onChange={e => setSelectedStudent(e.target.value)}>
              <option value="">Choose a student without a room...</option>
              {students.length === 0
                ? <option disabled>No unassigned students available</option>
                : students.map(s => (
                    <option key={s._id} value={s._id}>
                      {s.user?.name} ({s.rollNumber})
                    </option>
                  ))}
            </select>
          </FormField>
          <div className="flex justify-end gap-3">
            <button onClick={() => setAssignModal(null)} className="btn-outline">Cancel</button>
            <button onClick={handleAssign} disabled={!selectedStudent} className="btn-primary">
              Assign
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}