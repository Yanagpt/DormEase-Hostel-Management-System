import { useState, useEffect, useCallback } from 'react';
import {
  Plus, Search, UserCheck, UserX,
  Eye, Copy, KeyRound, Trash2, RefreshCw,
} from 'lucide-react';
import api from '../../api/axios';
import toast from 'react-hot-toast';
import {
  PageHeader, Badge, Modal, Spinner, Pagination,
  EmptyState, ConfirmDialog, FormField,
} from '../../components/common/UI';

const INIT_FORM = {
  name: '', email: '', phone: '', password: 'Password@123',
  rollNumber: '', course: '', year: 1, department: '', gender: '',
  dateOfBirth: '', parentName: '', parentPhone: '',
};

export default function AdminStudents() {
  const [students, setStudents]               = useState([]);
  const [pagination, setPagination]           = useState(null);
  const [loading, setLoading]                 = useState(true);
  const [search, setSearch]                   = useState('');
  const [statusFilter, setStatusFilter]       = useState('');
  const [page, setPage]                       = useState(1);

  const [showAdd, setShowAdd]                 = useState(false);
  const [form, setForm]                       = useState(INIT_FORM);
  const [submitting, setSubmitting]           = useState(false);

  const [viewStudent, setViewStudent]         = useState(null);
  const [createdCreds, setCreatedCreds]       = useState(null);

  // Delete
  const [deleteTarget, setDeleteTarget]       = useState(null);
  const [deleting, setDeleting]               = useState(false);

  // Toggle active
  const [toggleTarget, setToggleTarget]       = useState(null);

  // Reset password
  const [resetTarget, setResetTarget]         = useState(null);
  const [resetPassword, setResetPassword]     = useState('Password@123');
  const [resetting, setResetting]             = useState(false);
  const [resetResult, setResetResult]         = useState(null); // show new password after reset

  const fetchStudents = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page, limit: 10 });
      if (search) params.set('search', search);
      if (statusFilter) params.set('status', statusFilter);
      const res = await api.get('/users/students?' + params);
      setStudents(res.data.data);
      setPagination(res.data.pagination);
    } catch { toast.error('Failed to load students.'); }
    finally { setLoading(false); }
  }, [page, search, statusFilter]);

  useEffect(() => { fetchStudents(); }, [fetchStudents]);

  /* ── Create student ── */
  const handleCreate = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await api.post('/users/students', form);
      toast.success('Student created successfully.');
      setShowAdd(false);
      setCreatedCreds({ name: form.name, email: form.email, password: form.password });
      setForm(INIT_FORM);
      fetchStudents();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to create student.');
    } finally { setSubmitting(false); }
  };

  /* ── Delete student ── */
  const handleDelete = async () => {
    setDeleting(true);
    try {
      await api.delete('/users/' + deleteTarget.user._id);
      toast.success('Student deleted successfully.');
      setDeleteTarget(null);
      fetchStudents();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to delete student.');
    } finally { setDeleting(false); }
  };

  /* ── Toggle active ── */
  const handleToggle = async () => {
    try {
      const res = await api.put('/users/' + toggleTarget.user._id + '/toggle-status');
      toast.success(res.data.message);
      fetchStudents();
    } catch { toast.error('Failed to update status.'); }
    finally { setToggleTarget(null); }
  };

  /* ── Reset password ── */
  const handleResetPassword = async (e) => {
    e.preventDefault();
    if (!resetPassword || resetPassword.length < 6) {
      return toast.error('Password must be at least 6 characters.');
    }
    setResetting(true);
    try {
      const res = await api.put('/users/' + resetTarget.user._id + '/reset-password', {
        newPassword: resetPassword,
      });
      setResetResult({ email: res.data.data.email, password: res.data.data.newPassword });
      setResetTarget(null);
      toast.success('Password reset successfully.');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to reset password.');
    } finally { setResetting(false); }
  };

  const copy = (text, label) => {
    navigator.clipboard.writeText(text);
    toast.success(label + ' copied!');
  };

  return (
    <div>
      <PageHeader
        title="Students"
        subtitle="Manage all registered students"
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
        <select value={statusFilter}
          onChange={e => { setStatusFilter(e.target.value); setPage(1); }}
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
              <tr><td colSpan={7}>
                <EmptyState title="No students found" description="Add students or adjust your filters." />
              </td></tr>
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
                  <Badge
                    label={s.user?.isActive ? 'active' : 'inactive'}
                    variant={s.user?.isActive ? 'active' : 'inactive'} />
                </td>
                <td className="table-td">
                  <div className="flex items-center gap-1">
                    {/* View */}
                    <button onClick={() => setViewStudent(s)} className="btn-ghost p-1.5" title="View details">
                      <Eye size={14} />
                    </button>
                    {/* Reset Password */}
                    <button
                      onClick={() => { setResetTarget(s); setResetPassword('Password@123'); }}
                      className="btn-ghost p-1.5" title="Reset password">
                      <RefreshCw size={14} className="text-blue-500" />
                    </button>
                    {/* Toggle Active */}
                    <button onClick={() => setToggleTarget(s)} className="btn-ghost p-1.5"
                      title={s.user?.isActive ? 'Deactivate' : 'Activate'}>
                      {s.user?.isActive
                        ? <UserX size={14} className="text-red-500" />
                        : <UserCheck size={14} className="text-emerald-500" />}
                    </button>
                    {/* Delete */}
                    <button onClick={() => setDeleteTarget(s)} className="btn-ghost p-1.5" title="Delete student">
                      <Trash2 size={14} className="text-red-400" />
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
            <input className="input" value={form.name} required
              onChange={e => setForm(f => ({ ...f, name: e.target.value }))} />
          </FormField>
          <FormField label="Email">
            <input type="email" className="input" value={form.email} required
              onChange={e => setForm(f => ({ ...f, email: e.target.value }))} />
          </FormField>
          <FormField label="Phone">
            <input className="input" value={form.phone}
              onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} />
          </FormField>
          <FormField label="Login Password">
            <div className="relative">
              <input className="input pr-10" value={form.password} required minLength={6}
                onChange={e => setForm(f => ({ ...f, password: e.target.value }))} />
              <button type="button" onClick={() => copy(form.password, 'Password')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                <Copy size={13} />
              </button>
            </div>
          </FormField>
          <FormField label="Roll Number">
            <input className="input" value={form.rollNumber} required
              onChange={e => setForm(f => ({ ...f, rollNumber: e.target.value }))} />
          </FormField>
          <FormField label="Course">
            <input className="input" value={form.course} required
              onChange={e => setForm(f => ({ ...f, course: e.target.value }))} />
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

      {/* ── Created Credentials Modal ──────────────────────── */}
      <Modal open={!!createdCreds} onClose={() => setCreatedCreds(null)}
        title="Student Created — Share Credentials" size="sm">
        {createdCreds && (
          <div className="space-y-4">
            <div className="flex items-center gap-3 p-3 bg-emerald-50 border border-emerald-200 rounded-xl">
              <div className="w-9 h-9 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-700 font-bold text-sm">
                {createdCreds.name?.[0]?.toUpperCase()}
              </div>
              <div>
                <p className="font-bold text-emerald-800 text-sm">{createdCreds.name}</p>
                <p className="text-xs text-emerald-600">Account ready — can login immediately</p>
              </div>
            </div>
            <p className="text-sm text-gray-500">Share these credentials with the student:</p>
            {[['Email', createdCreds.email], ['Password', createdCreds.password]].map(([label, val]) => (
              <div key={label} className="rounded-xl border border-gray-200 overflow-hidden">
                <div className="bg-gray-50 px-4 py-2 flex items-center justify-between border-b border-gray-200">
                  <span className="text-xs font-bold text-gray-500 uppercase">{label}</span>
                  <button onClick={() => copy(val, label)}
                    className="flex items-center gap-1 text-xs text-accent font-semibold hover:opacity-75">
                    <Copy size={12} /> Copy
                  </button>
                </div>
                <div className="px-4 py-3 font-mono text-sm text-gray-900 select-all bg-white">{val}</div>
              </div>
            ))}
            <div className="flex items-start gap-2 p-3 bg-blue-50 border border-blue-200 rounded-xl text-xs text-blue-700">
              <KeyRound size={13} className="flex-shrink-0 mt-0.5" />
              <span>Student can login at <strong>{window.location.origin}/login</strong></span>
            </div>
            <button onClick={() => setCreatedCreds(null)} className="btn-primary w-full">Done</button>
          </div>
        )}
      </Modal>

      {/* ── Reset Password Modal ───────────────────────────── */}
      <Modal open={!!resetTarget} onClose={() => setResetTarget(null)}
        title={'Reset Password — ' + (resetTarget?.user?.name || '')} size="sm">
        {resetTarget && (
          <form onSubmit={handleResetPassword} className="space-y-4">
            <div className="p-3 bg-gray-50 rounded-xl text-sm space-y-1">
              <div className="flex justify-between">
                <span className="text-gray-500">Student</span>
                <span className="font-semibold">{resetTarget.user?.name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Email</span>
                <span className="font-mono text-xs">{resetTarget.user?.email}</span>
              </div>
            </div>
            <FormField label="New Password">
              <div className="relative">
                <input className="input pr-10" value={resetPassword} required minLength={6}
                  onChange={e => setResetPassword(e.target.value)}
                  placeholder="Min 6 characters" />
                <button type="button" onClick={() => copy(resetPassword, 'Password')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                  <Copy size={13} />
                </button>
              </div>
            </FormField>
            <div className="flex items-start gap-2 p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-700">
              ⚠️ The student's current password will be replaced. Share the new password with them.
            </div>
            <div className="flex gap-3">
              <button type="button" onClick={() => setResetTarget(null)} className="btn-outline flex-1">
                Cancel
              </button>
              <button type="submit" disabled={resetting}
                className="flex-1 py-2 bg-blue-500 text-white text-sm font-bold rounded-lg hover:bg-blue-600 transition-colors disabled:opacity-50">
                {resetting ? 'Resetting...' : 'Reset Password'}
              </button>
            </div>
          </form>
        )}
      </Modal>

      {/* ── Reset Result Modal (show new password) ─────────── */}
      <Modal open={!!resetResult} onClose={() => setResetResult(null)}
        title="Password Reset Successfully" size="sm">
        {resetResult && (
          <div className="space-y-4">
            <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-sm text-emerald-700 font-medium">
              ✅ Password has been reset. Share the new credentials with the student.
            </div>
            {[['Email', resetResult.email], ['New Password', resetResult.password]].map(([label, val]) => (
              <div key={label} className="rounded-xl border border-gray-200 overflow-hidden">
                <div className="bg-gray-50 px-4 py-2 flex items-center justify-between border-b border-gray-200">
                  <span className="text-xs font-bold text-gray-500 uppercase">{label}</span>
                  <button onClick={() => copy(val, label)}
                    className="flex items-center gap-1 text-xs text-accent font-semibold hover:opacity-75">
                    <Copy size={12} /> Copy
                  </button>
                </div>
                <div className="px-4 py-3 font-mono text-sm text-gray-900 select-all bg-white">{val}</div>
              </div>
            ))}
            <button onClick={() => setResetResult(null)} className="btn-primary w-full">Done</button>
          </div>
        )}
      </Modal>

      {/* ── View Student Modal ─────────────────────────────── */}
      <Modal open={!!viewStudent} onClose={() => setViewStudent(null)} title="Student Details" size="lg">
        {viewStudent && (
          <div className="space-y-4">
            <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-xl">
              <div className="w-12 h-12 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-700 font-bold text-lg flex-shrink-0">
                {viewStudent.user?.name?.[0]?.toUpperCase()}
              </div>
              <div>
                <p className="font-bold text-gray-900 text-base">{viewStudent.user?.name}</p>
                <p className="text-sm text-gray-500">{viewStudent.user?.email}</p>
              </div>
              <div className="ml-auto flex gap-2 flex-wrap">
                <Badge label={viewStudent.status} variant={viewStudent.status} />
                <Badge label={viewStudent.feeStatus} variant={viewStudent.feeStatus} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3 text-sm">
              {[
                ['Roll Number',  viewStudent.rollNumber],
                ['Course',       viewStudent.course],
                ['Year',         'Year ' + viewStudent.year],
                ['Department',   viewStudent.department || '—'],
                ['Gender',       viewStudent.gender || '—'],
                ['Phone',        viewStudent.user?.phone || '—'],
                ['Room',         viewStudent.room?.roomNumber || 'Unassigned'],
                ['Attendance',   viewStudent.attendance + '%'],
                ['Parent Name',  viewStudent.parentName || '—'],
                ['Parent Phone', viewStudent.parentPhone || '—'],
              ].map(([label, val]) => (
                <div key={label}>
                  <p className="text-xs text-gray-400 font-semibold uppercase mb-0.5">{label}</p>
                  <p className="font-medium text-gray-800">{val}</p>
                </div>
              ))}
            </div>
            <div className="border-t border-gray-100 pt-3">
              <p className="text-xs font-bold text-gray-400 uppercase mb-2 flex items-center gap-1">
                <KeyRound size={12} /> Login Email
              </p>
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
                <p className="font-mono text-sm text-gray-900">{viewStudent.user?.email}</p>
                <button onClick={() => copy(viewStudent.user?.email, 'Email')}
                  className="flex items-center gap-1 text-xs text-accent font-semibold hover:opacity-75">
                  <Copy size={12} /> Copy
                </button>
              </div>
            </div>
            {/* Quick actions from view modal */}
            <div className="flex gap-3 pt-1">
              <button
                onClick={() => { setResetTarget(viewStudent); setResetPassword('Password@123'); setViewStudent(null); }}
                className="flex-1 flex items-center justify-center gap-2 py-2 bg-blue-50 text-blue-600 text-sm font-semibold rounded-xl hover:bg-blue-100 transition-colors">
                <RefreshCw size={14} /> Reset Password
              </button>
              <button
                onClick={() => { setDeleteTarget(viewStudent); setViewStudent(null); }}
                className="flex-1 flex items-center justify-center gap-2 py-2 bg-red-50 text-red-600 text-sm font-semibold rounded-xl hover:bg-red-100 transition-colors">
                <Trash2 size={14} /> Delete Student
              </button>
            </div>
          </div>
        )}
      </Modal>

      {/* ── Toggle Active Confirm ──────────────────────────── */}
      <ConfirmDialog
        open={!!toggleTarget}
        onClose={() => setToggleTarget(null)}
        onConfirm={handleToggle}
        title={toggleTarget?.user?.isActive ? 'Deactivate Account' : 'Activate Account'}
        message={`Are you sure you want to ${toggleTarget?.user?.isActive ? 'deactivate' : 'activate'} ${toggleTarget?.user?.name}'s account?`}
        confirmLabel={toggleTarget?.user?.isActive ? 'Deactivate' : 'Activate'}
        danger={!!toggleTarget?.user?.isActive}
      />

      {/* ── Delete Confirm ─────────────────────────────────── */}
      <ConfirmDialog
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        title="Delete Student"
        message={`Permanently delete ${deleteTarget?.user?.name}'s account and all their data? This cannot be undone.`}
        confirmLabel={deleting ? 'Deleting...' : 'Delete Permanently'}
        danger
      />
    </div>
  );
}