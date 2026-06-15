import { useState, useEffect, useCallback } from 'react';
import { Plus, Search, UserCheck, UserX, Eye, Copy, KeyRound } from 'lucide-react';
import api from '../../api/axios';
import toast from 'react-hot-toast';
import { PageHeader, Badge, Modal, Spinner, Pagination, EmptyState, ConfirmDialog, FormField } from '../../components/common/UI';

const INIT_FORM = {
  name: '', email: '', phone: '', password: 'Password@123',
  rollNumber: '', course: '', year: 1, department: '', gender: '',
  dateOfBirth: '', parentName: '', parentPhone: '',
};

export default function AdminStudents() {
  const [students, setStudents] = useState([]);
  const [pagination, setPagination] = useState(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [page, setPage] = useState(1);

  const [showAdd, setShowAdd] = useState(false);
  const [showView, setShowView] = useState(null);
  const [confirmDeactivate, setConfirmDeactivate] = useState(null);
  const [form, setForm] = useState(INIT_FORM);
  const [submitting, setSubmitting] = useState(false);

  // Shown after successful creation — so admin can share credentials
  const [createdCredentials, setCreatedCredentials] = useState(null);

  const fetchStudents = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page, limit: 10 });
      if (search) params.set('search', search);
      if (statusFilter) params.set('status', statusFilter);
      const res = await api.get(`/users/students?${params}`);
      setStudents(res.data.data);
      setPagination(res.data.pagination);
    } catch { toast.error('Failed to load students.'); }
    finally { setLoading(false); }
  }, [page, search, statusFilter]);

  useEffect(() => { fetchStudents(); }, [fetchStudents]);

  const handleCreate = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await api.post('/users/students', form);
      toast.success('Student created successfully.');
      setShowAdd(false);
      // Save credentials to show in the next modal
      setCreatedCredentials({ name: form.name, email: form.email, password: form.password });
      setForm(INIT_FORM);
      fetchStudents();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to create student.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleToggle = async (userId) => {
    try {
      const res = await api.put(`/users/${userId}/toggle-status`);
      toast.success(res.data.message);
      fetchStudents();
    } catch { toast.error('Failed to update status.'); }
    finally { setConfirmDeactivate(null); }
  };

  const copyToClipboard = (text, label) => {
    navigator.clipboard.writeText(text).then(() => toast.success(`${label} copied!`));
  };

  return (
    <div>
      <PageHeader title="Students" subtitle="Manage all registered students"
        actions={
          <button onClick={() => setShowAdd(true)} className="btn-primary flex items-center gap-2">
            <Plus size={15} /> Add Student
          </button>
        }
      />

      {/* Filters */}
      <div className="card p-4 mb-5 flex items-center gap-3 flex-wrap">
        <div className="flex items-center gap-2 bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 flex-1 min-w-[200px]">
          <Search size={14} className="text-gray-400" />
          <input placeholder="Search by name, email, roll number..." value={search}
            onChange={e => { setSearch(e.target.value); setPage(1); }}
            className="bg-transparent text-sm outline-none flex-1" />
        </div>
        <select value={statusFilter} onChange={e => { setStatusFilter(e.target.value); setPage(1); }}
          className="input w-40 py-2">
          <option value="">All Status</option>
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
          <option value="graduated">Graduated</option>
        </select>
      </div>

      {/* Table */}
      <div className="card overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50 border-b border-gray-100">
            <tr>
              {['Student', 'Roll No', 'Course', 'Room', 'Fee Status', 'Account', 'Actions'].map(h => (
                <th key={h} className="table-th">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={7}><Spinner /></td></tr>
            ) : students.length === 0 ? (
              <tr><td colSpan={7}><EmptyState title="No students found" description="Add students or adjust your filters." /></td></tr>
            ) : students.map(s => (
              <tr key={s._id} className="table-row">
                <td className="table-td">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-700 font-bold text-xs flex-shrink-0">
                      {s.user?.name?.[0]?.toUpperCase()}
                    </div>
                    <div>
                      <p className="font-semibold text-gray-900 text-sm">{s.user?.name}</p>
                      <p className="text-xs text-gray-400">{s.user?.email}</p>
                    </div>
                  </div>
                </td>
                <td className="table-td font-mono text-xs">{s.rollNumber}</td>
                <td className="table-td text-xs">{s.course}</td>
                <td className="table-td">
                  {s.room
                    ? <span className="text-xs font-semibold text-gray-700">{s.room.roomNumber}</span>
                    : <span className="text-xs text-gray-400">Unassigned</span>}
                </td>
                <td className="table-td"><Badge label={s.feeStatus} variant={s.feeStatus} /></td>
                <td className="table-td">
                  <Badge label={s.user?.isActive ? 'active' : 'inactive'} variant={s.user?.isActive ? 'active' : 'inactive'} />
                </td>
                <td className="table-td">
                  <div className="flex items-center gap-1">
                    <button onClick={() => setShowView(s)} className="btn-ghost p-1.5" title="View details">
                      <Eye size={14} />
                    </button>
                    <button
                      onClick={() => setConfirmDeactivate(s.user)}
                      className="btn-ghost p-1.5"
                      title={s.user?.isActive ? 'Deactivate account' : 'Activate account'}>
                      {s.user?.isActive
                        ? <UserX size={14} className="text-red-500" />
                        : <UserCheck size={14} className="text-emerald-500" />}
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        <div className="px-4"><Pagination pagination={pagination} onPageChange={setPage} /></div>
      </div>

      {/* ── Add Student Modal ──────────────────────────────── */}
      <Modal open={showAdd} onClose={() => setShowAdd(false)} title="Add New Student" size="lg">
        <form onSubmit={handleCreate} className="grid grid-cols-2 gap-4">
          <FormField label="Full Name">
            <input className="input" value={form.name}
              onChange={e => setForm(f => ({ ...f, name: e.target.value }))} required />
          </FormField>
          <FormField label="Email">
            <input type="email" className="input" value={form.email}
              onChange={e => setForm(f => ({ ...f, email: e.target.value }))} required />
          </FormField>
          <FormField label="Phone">
            <input className="input" value={form.phone}
              onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} />
          </FormField>
          <FormField label="Login Password">
            <div className="relative">
              <input className="input pr-10" value={form.password}
                onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
                placeholder="Min 6 characters" required minLength={6} />
              <button type="button"
                onClick={() => copyToClipboard(form.password, 'Password')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                <Copy size={13} />
              </button>
            </div>
          </FormField>
          <FormField label="Roll Number">
            <input className="input" value={form.rollNumber}
              onChange={e => setForm(f => ({ ...f, rollNumber: e.target.value }))} required />
          </FormField>
          <FormField label="Course">
            <input className="input" value={form.course}
              onChange={e => setForm(f => ({ ...f, course: e.target.value }))} required />
          </FormField>
          <FormField label="Year">
            <select className="input" value={form.year}
              onChange={e => setForm(f => ({ ...f, year: Number(e.target.value) }))}>
              {[1,2,3,4,5].map(y => <option key={y} value={y}>Year {y}</option>)}
            </select>
          </FormField>
          <FormField label="Department">
            <input className="input" value={form.department}
              onChange={e => setForm(f => ({ ...f, department: e.target.value }))} />
          </FormField>
          <FormField label="Gender">
            <select className="input" value={form.gender}
              onChange={e => setForm(f => ({ ...f, gender: e.target.value }))}>
              <option value="">Select gender</option>
              <option value="male">Male</option>
              <option value="female">Female</option>
              <option value="other">Other</option>
            </select>
          </FormField>
          <FormField label="Date of Birth">
            <input type="date" className="input" value={form.dateOfBirth}
              onChange={e => setForm(f => ({ ...f, dateOfBirth: e.target.value }))} />
          </FormField>
          <FormField label="Parent Name">
            <input className="input" value={form.parentName}
              onChange={e => setForm(f => ({ ...f, parentName: e.target.value }))} />
          </FormField>
          <FormField label="Parent Phone">
            <input className="input" value={form.parentPhone}
              onChange={e => setForm(f => ({ ...f, parentPhone: e.target.value }))} />
          </FormField>
          <div className="col-span-2 flex justify-end gap-3 pt-2 border-t border-gray-100">
            <button type="button" onClick={() => setShowAdd(false)} className="btn-outline">Cancel</button>
            <button type="submit" disabled={submitting} className="btn-primary">
              {submitting ? 'Creating...' : 'Create Student'}
            </button>
          </div>
        </form>
      </Modal>

      {/* ── Login Credentials Modal (shown after creation) ─── */}
      <Modal
        open={!!createdCredentials}
        onClose={() => setCreatedCredentials(null)}
        title="Student Created Successfully"
        size="sm">
        {createdCredentials && (
          <div className="space-y-4">
            <div className="flex items-center gap-3 p-3 bg-emerald-50 border border-emerald-200 rounded-xl">
              <div className="w-9 h-9 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-700 font-bold flex-shrink-0">
                {createdCredentials.name?.[0]?.toUpperCase()}
              </div>
              <div>
                <p className="font-bold text-emerald-800">{createdCredentials.name}</p>
                <p className="text-xs text-emerald-600">Account created · Ready to log in</p>
              </div>
            </div>

            <p className="text-sm text-gray-500">
              Share these login credentials with the student. They can change their password after signing in.
            </p>

            {/* Email */}
            <div className="rounded-xl border border-gray-200 overflow-hidden">
              <div className="bg-gray-50 px-4 py-2 flex items-center justify-between border-b border-gray-200">
                <span className="text-xs font-bold text-gray-500 uppercase tracking-wide">Email / Username</span>
                <button onClick={() => copyToClipboard(createdCredentials.email, 'Email')}
                  className="flex items-center gap-1 text-xs text-accent font-semibold hover:opacity-75 transition-opacity">
                  <Copy size={12} /> Copy
                </button>
              </div>
              <div className="px-4 py-3 font-mono text-sm text-gray-900 bg-white select-all">
                {createdCredentials.email}
              </div>
            </div>

            {/* Password */}
            <div className="rounded-xl border border-gray-200 overflow-hidden">
              <div className="bg-gray-50 px-4 py-2 flex items-center justify-between border-b border-gray-200">
                <span className="text-xs font-bold text-gray-500 uppercase tracking-wide">Password</span>
                <button onClick={() => copyToClipboard(createdCredentials.password, 'Password')}
                  className="flex items-center gap-1 text-xs text-accent font-semibold hover:opacity-75 transition-opacity">
                  <Copy size={12} /> Copy
                </button>
              </div>
              <div className="px-4 py-3 font-mono text-sm text-gray-900 bg-white select-all">
                {createdCredentials.password}
              </div>
            </div>

            {/* Login URL hint */}
            <div className="flex items-start gap-2 p-3 bg-blue-50 border border-blue-200 rounded-xl text-xs text-blue-700">
              <KeyRound size={14} className="flex-shrink-0 mt-0.5" />
              <span>Student can log in at <strong>{window.location.origin}/login</strong> using these credentials and selecting the Student role.</span>
            </div>

            <button onClick={() => setCreatedCredentials(null)} className="btn-primary w-full">
              Done
            </button>
          </div>
        )}
      </Modal>

      {/* ── View Student Modal ─────────────────────────────── */}
      <Modal open={!!showView} onClose={() => setShowView(null)} title="Student Details" size="lg">
        {showView && (
          <div className="space-y-4">
            <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-xl">
              <div className="w-12 h-12 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-700 font-bold text-lg flex-shrink-0">
                {showView.user?.name?.[0]?.toUpperCase()}
              </div>
              <div>
                <p className="font-bold text-gray-900 text-base">{showView.user?.name}</p>
                <p className="text-sm text-gray-500">{showView.user?.email}</p>
              </div>
              <div className="ml-auto flex gap-2">
                <Badge label={showView.status} variant={showView.status} />
                <Badge label={showView.feeStatus} variant={showView.feeStatus} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4 text-sm">
              {[
                ['Roll Number', showView.rollNumber],
                ['Course', showView.course],
                ['Year', `Year ${showView.year}`],
                ['Department', showView.department || '—'],
                ['Gender', showView.gender || '—'],
                ['Phone', showView.user?.phone || '—'],
                ['Room', showView.room?.roomNumber || 'Unassigned'],
                ['Attendance', `${showView.attendance}%`],
                ['Parent Name', showView.parentName || '—'],
                ['Parent Phone', showView.parentPhone || '—'],
                ['Admitted', showView.admissionDate ? new Date(showView.admissionDate).toLocaleDateString('en-IN') : '—'],
                ['Account Status', showView.user?.isActive ? 'Active' : 'Deactivated'],
              ].map(([label, val]) => (
                <div key={label}>
                  <p className="text-xs text-gray-400 font-semibold uppercase mb-0.5">{label}</p>
                  <p className="font-medium text-gray-800">{val}</p>
                </div>
              ))}
            </div>

            {/* Login credentials section for existing student */}
            <div className="border-t border-gray-100 pt-4">
              <p className="text-xs font-bold text-gray-400 uppercase mb-2 flex items-center gap-1">
                <KeyRound size={12} /> Login Credentials
              </p>
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
                <div>
                  <p className="text-xs text-gray-500 mb-0.5">Email</p>
                  <p className="font-mono text-sm font-medium text-gray-900">{showView.user?.email}</p>
                </div>
                <button onClick={() => copyToClipboard(showView.user?.email, 'Email')}
                  className="flex items-center gap-1 text-xs text-accent font-semibold hover:opacity-75">
                  <Copy size={12} /> Copy
                </button>
              </div>
              <p className="text-xs text-gray-400 mt-2">
                If the student forgot their password, ask them to contact admin for a password reset.
              </p>
            </div>
          </div>
        )}
      </Modal>

      {/* ── Confirm Toggle Status ──────────────────────────── */}
      <ConfirmDialog
        open={!!confirmDeactivate}
        onClose={() => setConfirmDeactivate(null)}
        onConfirm={() => handleToggle(confirmDeactivate?._id)}
        title={confirmDeactivate?.isActive ? 'Deactivate Account' : 'Activate Account'}
        message={`Are you sure you want to ${confirmDeactivate?.isActive ? 'deactivate' : 'activate'} ${confirmDeactivate?.name}'s account?`}
        confirmLabel={confirmDeactivate?.isActive ? 'Deactivate' : 'Activate'}
        danger={confirmDeactivate?.isActive}
      />
    </div>
  );
}