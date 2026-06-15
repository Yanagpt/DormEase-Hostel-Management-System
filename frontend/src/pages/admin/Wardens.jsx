import { useState, useEffect } from 'react';
import { Plus, Search, Shield, Eye, UserX, UserCheck, Trash2, Copy, KeyRound } from 'lucide-react';
import api from '../../api/axios';
import toast from 'react-hot-toast';

export default function AdminWardens() {
  const [wardens, setWardens] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState({ name: '', email: '', phone: '', password: 'Password@123' });
  const [submitting, setSubmitting] = useState(false);
  const [newCreds, setNewCreds] = useState(null);
  const [viewW, setViewW] = useState(null);

  useEffect(() => {
    load();
  }, [page, search]);

  async function load() {
    setLoading(true);
    try {
      const res = await api.get('/users?role=warden&page=' + page + '&limit=10' + (search ? '&search=' + search : ''));
      setWardens(res.data.data || []);
      setTotal(res.data.pagination?.total || 0);
    } catch (e) {
      toast.error('Failed to load wardens');
    } finally {
      setLoading(false);
    }
  }

  async function handleCreate(e) {
    e.preventDefault();
    setSubmitting(true);
    try {
      await api.post('/users/wardens', form);
      toast.success('Warden created');
      setShowAdd(false);
      setNewCreds({ name: form.name, email: form.email, password: form.password });
      setForm({ name: '', email: '', phone: '', password: 'Password@123' });
      load();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed');
    } finally {
      setSubmitting(false);
    }
  }

  async function handleToggle(w) {
    try {
      await api.put('/users/' + w._id + '/toggle-status');
      toast.success('Status updated');
      load();
    } catch {
      toast.error('Failed');
    }
  }

  async function handleDelete(w) {
    if (!window.confirm('Delete ' + w.name + '?')) return;
    try {
      await api.delete('/users/' + w._id);
      toast.success('Deleted');
      load();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed');
    }
  }

  function copy(text, label) {
    navigator.clipboard.writeText(text);
    toast.success(label + ' copied!');
  }

  return (
    <div>
      {/* Header */}
      <div className="flex items-start justify-between mb-7">
        <div>
          <h1 className="page-title">Warden Management</h1>
          <p className="text-sm text-gray-500 mt-1">Add and manage hostel wardens</p>
        </div>
        <button onClick={() => setShowAdd(true)} className="btn-primary flex items-center gap-2">
          <Plus size={15} /> Add Warden
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        {[
          { label: 'Total Wardens', value: total, color: '#4f46e5' },
          { label: 'Active', value: wardens.filter(w => w.isActive).length, color: '#059669' },
          { label: 'Inactive', value: wardens.filter(w => !w.isActive).length, color: '#e94560' },
        ].map(function(s) {
          return (
            <div key={s.label} className="card p-5">
              <div className="w-10 h-10 rounded-xl mb-3 flex items-center justify-center"
                style={{ background: s.color + '18', color: s.color }}>
                <Shield size={18} />
              </div>
              <div className="text-2xl font-bold text-gray-900">{s.value}</div>
              <div className="text-sm text-gray-500">{s.label}</div>
            </div>
          );
        })}
      </div>

      {/* Search */}
      <div className="card p-4 mb-5 flex items-center gap-2">
        <Search size={14} className="text-gray-400" />
        <input
          className="bg-transparent text-sm outline-none flex-1"
          placeholder="Search by name or email..."
          value={search}
          onChange={function(e) { setSearch(e.target.value); setPage(1); }}
        />
      </div>

      {/* Table */}
      <div className="card overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50 border-b border-gray-100">
            <tr>
              {['Warden', 'Phone', 'Joined', 'Last Login', 'Status', 'Actions'].map(function(h) {
                return <th key={h} className="table-th">{h}</th>;
              })}
            </tr>
          </thead>
          <tbody>
            {loading && (
              <tr><td colSpan={6} className="text-center py-8 text-gray-400">Loading...</td></tr>
            )}
            {!loading && wardens.length === 0 && (
              <tr><td colSpan={6} className="text-center py-12 text-gray-400">
                <Shield size={32} className="mx-auto mb-2 text-gray-300" />
                No wardens yet. Click Add Warden to create one.
              </td></tr>
            )}
            {!loading && wardens.map(function(w) {
              return (
                <tr key={w._id} className="table-row">
                  <td className="table-td">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-full bg-purple-100 flex items-center justify-center text-purple-700 font-bold text-xs">
                        {(w.name || '?')[0].toUpperCase()}
                      </div>
                      <div>
                        <p className="font-semibold text-sm text-gray-900">{w.name}</p>
                        <p className="text-xs text-gray-400">{w.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="table-td text-sm">{w.phone || '—'}</td>
                  <td className="table-td text-xs text-gray-500">
                    {new Date(w.createdAt).toLocaleDateString('en-IN')}
                  </td>
                  <td className="table-td text-xs text-gray-500">
                    {w.lastLogin ? new Date(w.lastLogin).toLocaleDateString('en-IN') : 'Never'}
                  </td>
                  <td className="table-td">
                    <span className={w.isActive ? 'badge-green' : 'badge-gray'}>
                      {w.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="table-td">
                    <div className="flex gap-1">
                      <button onClick={() => setViewW(w)} className="btn-ghost p-1.5" title="View">
                        <Eye size={14} />
                      </button>
                      <button onClick={() => handleToggle(w)} className="btn-ghost p-1.5"
                        title={w.isActive ? 'Deactivate' : 'Activate'}>
                        {w.isActive
                          ? <UserX size={14} className="text-red-500" />
                          : <UserCheck size={14} className="text-emerald-500" />}
                      </button>
                      <button onClick={() => handleDelete(w)} className="btn-ghost p-1.5 text-red-400 hover:text-red-600" title="Delete">
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>

        {/* Pagination */}
        {total > 10 && (
          <div className="px-4 py-3 flex items-center justify-between border-t border-gray-100">
            <span className="text-sm text-gray-500">Total: {total}</span>
            <div className="flex gap-2">
              <button disabled={page === 1} onClick={() => setPage(page - 1)} className="btn-outline px-3 py-1.5 text-sm disabled:opacity-40">Prev</button>
              <button disabled={page * 10 >= total} onClick={() => setPage(page + 1)} className="btn-outline px-3 py-1.5 text-sm disabled:opacity-40">Next</button>
            </div>
          </div>
        )}
      </div>

      {/* Add Modal */}
      {showAdd && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
            <div className="flex items-center justify-between p-6 border-b">
              <h2 className="text-lg font-bold">Add New Warden</h2>
              <button onClick={() => setShowAdd(false)} className="text-gray-400 hover:text-gray-600">✕</button>
            </div>
            <form onSubmit={handleCreate} className="p-6 space-y-4">
              <div>
                <label className="label">Full Name</label>
                <input className="input" value={form.name} required placeholder="Full name"
                  onChange={function(e) { setForm(Object.assign({}, form, { name: e.target.value })); }} />
              </div>
              <div>
                <label className="label">Email Address</label>
                <input type="email" className="input" value={form.email} required placeholder="warden@hostel.com"
                  onChange={function(e) { setForm(Object.assign({}, form, { email: e.target.value })); }} />
              </div>
              <div>
                <label className="label">Phone Number</label>
                <input className="input" value={form.phone} placeholder="+91 XXXXX XXXXX"
                  onChange={function(e) { setForm(Object.assign({}, form, { phone: e.target.value })); }} />
              </div>
              <div>
                <label className="label">Login Password</label>
                <input className="input" value={form.password} required minLength={6}
                  onChange={function(e) { setForm(Object.assign({}, form, { password: e.target.value })); }} />
              </div>
              <div className="flex justify-end gap-3 pt-2">
                <button type="button" onClick={() => setShowAdd(false)} className="btn-outline">Cancel</button>
                <button type="submit" disabled={submitting} className="btn-primary">
                  {submitting ? 'Creating...' : 'Create Warden'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Credentials Modal */}
      {newCreds && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm">
            <div className="flex items-center justify-between p-6 border-b">
              <h2 className="text-lg font-bold">Warden Created!</h2>
              <button onClick={() => setNewCreds(null)} className="text-gray-400 hover:text-gray-600">✕</button>
            </div>
            <div className="p-6 space-y-4">
              <p className="text-sm text-gray-500">Share these credentials with {newCreds.name}:</p>
              {[['Email', newCreds.email], ['Password', newCreds.password]].map(function(item) {
                return (
                  <div key={item[0]} className="border border-gray-200 rounded-xl overflow-hidden">
                    <div className="bg-gray-50 px-4 py-2 flex justify-between border-b">
                      <span className="text-xs font-bold text-gray-500 uppercase">{item[0]}</span>
                      <button onClick={() => copy(item[1], item[0])}
                        className="text-xs text-accent font-semibold flex items-center gap-1">
                        <Copy size={12} /> Copy
                      </button>
                    </div>
                    <div className="px-4 py-3 font-mono text-sm select-all">{item[1]}</div>
                  </div>
                );
              })}
              <div className="flex items-center gap-2 p-3 bg-blue-50 rounded-xl text-xs text-blue-700">
                <KeyRound size={13} />
                <span>Login at <strong>{window.location.origin}/login</strong></span>
              </div>
              <button onClick={() => setNewCreds(null)} className="btn-primary w-full">Done</button>
            </div>
          </div>
        </div>
      )}

      {/* View Modal */}
      {viewW && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm">
            <div className="flex items-center justify-between p-6 border-b">
              <h2 className="text-lg font-bold">Warden Details</h2>
              <button onClick={() => setViewW(null)} className="text-gray-400 hover:text-gray-600">✕</button>
            </div>
            <div className="p-6 space-y-3">
              <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
                <div className="w-10 h-10 rounded-full bg-purple-100 flex items-center justify-center text-purple-700 font-bold">
                  {(viewW.name || '?')[0].toUpperCase()}
                </div>
                <div>
                  <p className="font-bold text-gray-900">{viewW.name}</p>
                  <p className="text-sm text-gray-500">{viewW.email}</p>
                </div>
              </div>
              {[
                ['Phone', viewW.phone || '—'],
                ['Joined', new Date(viewW.createdAt).toLocaleDateString('en-IN')],
                ['Last Login', viewW.lastLogin ? new Date(viewW.lastLogin).toLocaleDateString('en-IN') : 'Never'],
                ['Status', viewW.isActive ? 'Active' : 'Inactive'],
              ].map(function(row) {
                return (
                  <div key={row[0]} className="flex justify-between text-sm">
                    <span className="text-gray-400">{row[0]}</span>
                    <span className="font-medium text-gray-800">{row[1]}</span>
                  </div>
                );
              })}
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-xl mt-2">
                <span className="font-mono text-sm">{viewW.email}</span>
                <button onClick={() => copy(viewW.email, 'Email')}
                  className="text-xs text-accent font-semibold flex items-center gap-1">
                  <Copy size={12} /> Copy
                </button>
              </div>
              <button onClick={() => setViewW(null)} className="btn-outline w-full mt-2">Close</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}