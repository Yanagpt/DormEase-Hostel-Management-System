import { useState, useEffect, useCallback } from 'react';
import { CheckCircle2, XCircle, Eye, Clock, Users, Shield } from 'lucide-react';
import api from '../../api/axios';
import toast from 'react-hot-toast';
import { PageHeader, Badge, Modal, Spinner, EmptyState, FormField } from '../../components/common/UI';

export default function AdminApprovals() {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [roleFilter, setRoleFilter] = useState('');
  const [selected, setSelected] = useState(null);
  const [rejectModal, setRejectModal] = useState(null);
  const [rejectReason, setRejectReason] = useState('');
  const [processing, setProcessing] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const q = roleFilter ? '?role=' + roleFilter : '';
      const res = await api.get('/auth/pending' + q);
      setRequests(res.data.data || []);
    } catch {
      toast.error('Failed to load pending registrations.');
    } finally {
      setLoading(false);
    }
  }, [roleFilter]);

  useEffect(() => { load(); }, [load]);

  const handleAction = async (userId, action, reason) => {
    setProcessing(true);
    try {
      await api.put('/auth/approve/' + userId, { action, reason });
      toast.success(action === 'approve' ? 'Registration approved! User can now login.' : 'Registration rejected.');
      setRejectModal(null);
      setSelected(null);
      setRejectReason('');
      load();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed.');
    } finally {
      setProcessing(false);
    }
  };

  const students = requests.filter(function(r) { return r.role === 'student'; });
  const wardens  = requests.filter(function(r) { return r.role === 'warden'; });

  return (
    <div>
      <PageHeader
        title="Pending Approvals"
        subtitle="Review and approve registration requests from students and wardens"
      />

      {/* Summary cards */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="card p-5">
          <div className="w-10 h-10 rounded-xl bg-amber-50 flex items-center justify-center mb-3">
            <Clock size={18} className="text-amber-600" />
          </div>
          <div className="text-2xl font-bold text-gray-900">{requests.length}</div>
          <div className="text-sm text-gray-500">Total Pending</div>
        </div>
        <div className="card p-5">
          <div className="w-10 h-10 rounded-xl bg-orange-50 flex items-center justify-center mb-3">
            <Users size={18} className="text-orange-500" />
          </div>
          <div className="text-2xl font-bold text-gray-900">{students.length}</div>
          <div className="text-sm text-gray-500">Students Waiting</div>
        </div>
        <div className="card p-5">
          <div className="w-10 h-10 rounded-xl bg-purple-50 flex items-center justify-center mb-3">
            <Shield size={18} className="text-purple-600" />
          </div>
          <div className="text-2xl font-bold text-gray-900">{wardens.length}</div>
          <div className="text-sm text-gray-500">Wardens Waiting</div>
        </div>
      </div>

      {/* Filter */}
      <div className="card p-4 mb-5 flex gap-2">
        {[
          { value: '',        label: 'All Requests' },
          { value: 'student', label: 'Students' },
          { value: 'warden',  label: 'Wardens' },
        ].map(function(f) {
          return (
            <button key={f.value}
              onClick={function() { setRoleFilter(f.value); }}
              className={'px-4 py-1.5 rounded-lg text-xs font-semibold transition-colors ' +
                (roleFilter === f.value ? 'bg-accent text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200')}>
              {f.label}
            </button>
          );
        })}
        <button onClick={load} className="ml-auto btn-ghost text-xs px-3 py-1.5">↻ Refresh</button>
      </div>

      {/* List */}
      {loading ? <Spinner /> : requests.length === 0 ? (
        <EmptyState
          icon={CheckCircle2}
          title="No pending registrations"
          description="All registration requests have been processed. New ones will appear here." />
      ) : (
        <div className="space-y-3">
          {requests.map(function(r) {
            return (
              <div key={r._id} className="card p-5">
                <div className="flex items-center gap-4">
                  {/* Avatar */}
                  <div className={'w-11 h-11 rounded-full flex items-center justify-center font-bold text-base flex-shrink-0 ' +
                    (r.role === 'warden' ? 'bg-purple-100 text-purple-700' : 'bg-orange-100 text-orange-700')}>
                    {(r.name || '?')[0].toUpperCase()}
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-0.5">
                      <p className="font-bold text-gray-900 text-sm">{r.name}</p>
                      <span className={'text-xs font-semibold px-2 py-0.5 rounded-md capitalize ' +
                        (r.role === 'warden' ? 'bg-purple-50 text-purple-700' : 'bg-orange-50 text-orange-600')}>
                        {r.role}
                      </span>
                    </div>
                    <p className="text-xs text-gray-500">{r.email}</p>
                    {r.role === 'student' && r.rollNumber && (
                      <p className="text-xs text-gray-400 mt-0.5">
                        {r.rollNumber} · {r.course}{r.department ? ' · ' + r.department : ''}
                      </p>
                    )}
                    <p className="text-xs text-gray-400 mt-0.5">
                      Registered: {new Date(r.createdAt).toLocaleString('en-IN')}
                    </p>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <button onClick={function() { setSelected(r); }}
                      className="btn-ghost p-2" title="View details">
                      <Eye size={15} />
                    </button>
                    <button
                      onClick={function() { handleAction(r._id, 'approve'); }}
                      disabled={processing}
                      className="flex items-center gap-1.5 px-4 py-2 bg-emerald-500 text-white text-xs font-bold rounded-lg hover:bg-emerald-600 transition-colors disabled:opacity-50">
                      <CheckCircle2 size={13} /> Approve
                    </button>
                    <button
                      onClick={function() { setRejectModal(r); setRejectReason(''); }}
                      className="flex items-center gap-1.5 px-4 py-2 bg-red-50 text-red-600 text-xs font-bold rounded-lg hover:bg-red-100 transition-colors">
                      <XCircle size={13} /> Reject
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* View Details Modal */}
      <Modal open={!!selected} onClose={function() { setSelected(null); }} title="Registration Details" size="sm">
        {selected && (
          <div className="space-y-4">
            <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
              <div className={'w-10 h-10 rounded-full flex items-center justify-center font-bold flex-shrink-0 ' +
                (selected.role === 'warden' ? 'bg-purple-100 text-purple-700' : 'bg-orange-100 text-orange-700')}>
                {(selected.name || '?')[0].toUpperCase()}
              </div>
              <div>
                <p className="font-bold text-gray-900">{selected.name}</p>
                <p className="text-sm text-gray-500 capitalize">{selected.role}</p>
              </div>
            </div>
            <div className="space-y-2 text-sm">
              {[
                ['Email',      selected.email],
                ['Phone',      selected.phone || '—'],
                ['Role',       selected.role],
                ['Applied On', new Date(selected.createdAt).toLocaleString('en-IN')],
                ...(selected.role === 'student' ? [
                  ['Roll No',    selected.rollNumber || '—'],
                  ['Course',     selected.course || '—'],
                  ['Department', selected.department || '—'],
                ] : []),
              ].map(function(row) {
                return (
                  <div key={row[0]} className="flex justify-between">
                    <span className="text-gray-400">{row[0]}</span>
                    <span className="font-medium text-gray-800">{row[1]}</span>
                  </div>
                );
              })}
            </div>
            <div className="flex gap-3 pt-2">
              <button onClick={function() { handleAction(selected._id, 'approve'); setSelected(null); }}
                disabled={processing}
                className="flex-1 py-2.5 bg-emerald-500 text-white text-sm font-bold rounded-xl hover:bg-emerald-600 transition-colors disabled:opacity-50">
                ✓ Approve
              </button>
              <button onClick={function() { setRejectModal(selected); setSelected(null); }}
                className="flex-1 py-2.5 bg-red-50 text-red-600 text-sm font-bold rounded-xl hover:bg-red-100 transition-colors">
                ✕ Reject
              </button>
            </div>
          </div>
        )}
      </Modal>

      {/* Reject Modal */}
      <Modal open={!!rejectModal} onClose={function() { setRejectModal(null); }} title="Reject Registration" size="sm">
        {rejectModal && (
          <div className="space-y-4">
            <p className="text-sm text-gray-600">
              Rejecting <strong>{rejectModal.name}</strong>'s {rejectModal.role} registration.
              They will not be able to log in.
            </p>
            <FormField label="Reason for rejection (optional)">
              <textarea className="input" rows={3} value={rejectReason}
                onChange={function(e) { setRejectReason(e.target.value); }}
                placeholder="e.g. Invalid roll number, duplicate registration..." />
            </FormField>
            <div className="flex gap-3">
              <button onClick={function() { setRejectModal(null); }} className="btn-outline flex-1">Cancel</button>
              <button onClick={function() { handleAction(rejectModal._id, 'reject', rejectReason); }}
                disabled={processing}
                className="flex-1 py-2 bg-red-500 text-white text-sm font-bold rounded-lg hover:bg-red-600 transition-colors disabled:opacity-50">
                {processing ? 'Rejecting...' : 'Confirm Reject'}
              </button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}