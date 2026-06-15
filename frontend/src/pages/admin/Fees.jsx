import { useState, useEffect, useCallback } from 'react';
import { Plus, Search, DollarSign, TrendingUp, Clock, AlertCircle, CreditCard, Eye } from 'lucide-react';
import api from '../../api/axios';
import toast from 'react-hot-toast';
import { PageHeader, Badge, Modal, Spinner, Pagination, EmptyState, StatCard, FormField } from '../../components/common/UI';

const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
const PAYMENT_METHODS = ['cash','online','upi','bank-transfer','cheque','dd'];

export default function AdminFees() {
  const [payments, setPayments] = useState([]);
  const [pagination, setPagination] = useState(null);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [page, setPage] = useState(1);

  // Add record modal
  const [showAdd, setShowAdd] = useState(false);
  const [students, setStudents] = useState([]);
  const [form, setForm] = useState({
    studentId: '', amount: '', feeType: 'hostel-fee',
    month: new Date().getMonth() + 1, year: new Date().getFullYear(),
    dueDate: '', remarks: '',
  });
  const [submitting, setSubmitting] = useState(false);

  // Mark paid modal
  const [payModal, setPayModal] = useState(null); // payment object
  const [payForm, setPayForm] = useState({ paymentMethod: 'cash', transactionId: '', remarks: '' });
  const [paying, setPaying] = useState(false);

  // View receipt modal
  const [receiptModal, setReceiptModal] = useState(null);

  const fetchPayments = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page, limit: 10 });
      if (search) params.set('search', search);
      if (statusFilter) params.set('status', statusFilter);
      const [pRes, sRes] = await Promise.all([
        api.get(`/payments?${params}`),
        api.get('/payments/stats'),
      ]);
      setPayments(pRes.data.data);
      setPagination(pRes.data.pagination);
      setStats(sRes.data.data);
    } catch { toast.error('Failed to load payments.'); }
    finally { setLoading(false); }
  }, [page, search, statusFilter]);

  useEffect(() => { fetchPayments(); }, [fetchPayments]);

  const fetchStudents = async () => {
    const res = await api.get('/users/students?limit=200');
    setStudents(res.data.data);
  };

  // Open mark-paid modal
  const openPayModal = (payment) => {
    setPayModal(payment);
    setPayForm({ paymentMethod: 'cash', transactionId: '', remarks: '' });
  };

  // Confirm mark paid
  const handleMarkPaid = async (e) => {
    e.preventDefault();
    setPaying(true);
    try {
      await api.put(`/payments/${payModal._id}/mark-paid`, payForm);
      toast.success('Payment marked as paid.');
      setPayModal(null);
      fetchPayments();
    } catch (err) { toast.error(err.response?.data?.message || 'Failed.'); }
    finally { setPaying(false); }
  };

  // Create new record
  const handleCreate = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await api.post('/payments', form);
      toast.success('Payment record created.');
      setShowAdd(false);
      setForm({ studentId: '', amount: '', feeType: 'hostel-fee', month: new Date().getMonth() + 1, year: new Date().getFullYear(), dueDate: '', remarks: '' });
      fetchPayments();
    } catch (err) { toast.error(err.response?.data?.message || 'Failed.'); }
    finally { setSubmitting(false); }
  };

  const statusBtnLabel = (status) => {
    if (status === 'paid') return null;
    if (status === 'overdue') return 'Collect Now';
    return 'Mark Paid';
  };

  return (
    <div>
      <PageHeader title="Fee Management" subtitle="Track payments and outstanding dues"
        actions={
          <button onClick={async () => { await fetchStudents(); setShowAdd(true); }}
            className="btn-primary flex items-center gap-2">
            <Plus size={15} /> Add Record
          </button>
        }
      />

      {/* Stats */}
      {stats && (
        <div className="grid grid-cols-4 gap-4 mb-6">
          <StatCard label="Total Collected" value={`₹${(stats.totalCollected / 100000).toFixed(1)}L`} icon={DollarSign} color="#059669" trend={8} />
          <StatCard label="Pending" value={`₹${(stats.pending.amount / 1000).toFixed(0)}K`} sub={`${stats.pending.count} students`} icon={Clock} color="#d97706" />
          <StatCard label="Overdue" value={`₹${(stats.overdue.amount / 1000).toFixed(0)}K`} sub={`${stats.overdue.count} students`} icon={AlertCircle} color="#e94560" />
          <StatCard label="Collection Rate"
            value={stats.totalCollected + stats.pending.amount > 0
              ? `${Math.round(stats.totalCollected / (stats.totalCollected + stats.pending.amount) * 100)}%`
              : '0%'}
            icon={TrendingUp} color="#0d9488" />
        </div>
      )}

      {/* Filters */}
      <div className="card p-4 mb-5 flex items-center gap-3 flex-wrap">
        <div className="flex items-center gap-2 bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 flex-1">
          <Search size={14} className="text-gray-400" />
          <input placeholder="Search by student name or receipt number..." value={search}
            onChange={e => { setSearch(e.target.value); setPage(1); }}
            className="bg-transparent text-sm outline-none flex-1" />
        </div>
        <select value={statusFilter} onChange={e => { setStatusFilter(e.target.value); setPage(1); }} className="input w-36 py-2">
          <option value="">All Status</option>
          <option value="paid">Paid</option>
          <option value="pending">Pending</option>
          <option value="overdue">Overdue</option>
        </select>
      </div>

      {/* Table */}
      <div className="card overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50 border-b border-gray-100">
            <tr>
              {['Receipt', 'Student', 'Amount', 'Type', 'Period', 'Due Date', 'Status', 'Actions'].map(h => (
                <th key={h} className="table-th">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading
              ? <tr><td colSpan={8}><Spinner /></td></tr>
              : payments.length === 0
              ? <tr><td colSpan={8}><EmptyState title="No payment records found" /></td></tr>
              : payments.map(p => (
                <tr key={p._id} className="table-row">
                  <td className="table-td font-mono text-xs text-gray-500">{p.receiptNumber}</td>
                  <td className="table-td">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-700 font-bold text-xs flex-shrink-0">
                        {p.student?.name?.[0]}
                      </div>
                      <span className="font-medium text-sm">{p.student?.name}</span>
                    </div>
                  </td>
                  <td className="table-td font-bold text-gray-900">₹{p.amount?.toLocaleString()}</td>
                  <td className="table-td text-xs capitalize">{p.feeType?.replace(/-/g,' ')}</td>
                  <td className="table-td text-xs">
                    {p.month ? `${MONTHS[p.month - 1]} ${p.year}` : '—'}
                  </td>
                  <td className="table-td text-xs">
                    {p.dueDate ? new Date(p.dueDate).toLocaleDateString('en-IN') : '—'}
                  </td>
                  <td className="table-td"><Badge label={p.status} variant={p.status} /></td>
                  <td className="table-td">
                    <div className="flex items-center gap-1.5">
                      {/* View receipt */}
                      <button onClick={() => setReceiptModal(p)}
                        className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-700 transition-colors"
                        title="View details">
                        <Eye size={14} />
                      </button>
                      {/* Mark paid / Collect */}
                      {p.status !== 'paid' && (
                        <button
                          onClick={() => openPayModal(p)}
                          className={`px-3 py-1 text-xs font-bold rounded-lg transition-colors ${
                            p.status === 'overdue'
                              ? 'bg-red-50 text-red-600 hover:bg-red-100'
                              : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
                          }`}>
                          {statusBtnLabel(p.status)}
                        </button>
                      )}
                      {p.status === 'paid' && (
                        <span className="px-3 py-1 bg-emerald-50 text-emerald-600 text-xs font-semibold rounded-lg">
                          {p.paidDate ? new Date(p.paidDate).toLocaleDateString('en-IN') : '✓ Paid'}
                        </span>
                      )}
                    </div>
                  </td>
                </tr>
              ))
            }
          </tbody>
        </table>
        <div className="px-4"><Pagination pagination={pagination} onPageChange={setPage} /></div>
      </div>

      {/* ── Mark Paid Modal ────────────────────────────────── */}
      <Modal open={!!payModal} onClose={() => setPayModal(null)}
        title={payModal?.status === 'overdue' ? 'Collect Overdue Payment' : 'Record Payment'}
        size="sm">
        {payModal && (
          <form onSubmit={handleMarkPaid} className="space-y-4">
            {/* Summary */}
            <div className="bg-gray-50 rounded-xl p-4 space-y-1.5 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-500">Student</span>
                <span className="font-semibold">{payModal.student?.name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Amount</span>
                <span className="font-bold text-gray-900">₹{payModal.amount?.toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Period</span>
                <span className="font-medium">{payModal.month ? `${MONTHS[payModal.month - 1]} ${payModal.year}` : '—'}</span>
              </div>
              {payModal.status === 'overdue' && (
                <div className="flex justify-between items-center pt-1 border-t border-gray-200">
                  <span className="text-red-500 font-semibold text-xs">⚠ Overdue</span>
                  <span className="text-red-500 text-xs font-semibold">
                    Due: {payModal.dueDate ? new Date(payModal.dueDate).toLocaleDateString('en-IN') : '—'}
                  </span>
                </div>
              )}
            </div>

            <FormField label="Payment Method">
              <select className="input" value={payForm.paymentMethod}
                onChange={e => setPayForm(f => ({ ...f, paymentMethod: e.target.value }))}>
                {PAYMENT_METHODS.map(m => (
                  <option key={m} value={m}>{m.replace(/-/g,' ').replace(/\b\w/g, c => c.toUpperCase())}</option>
                ))}
              </select>
            </FormField>

            {['online','upi','bank-transfer','cheque','dd'].includes(payForm.paymentMethod) && (
              <FormField label="Transaction / Reference ID">
                <input className="input" value={payForm.transactionId}
                  onChange={e => setPayForm(f => ({ ...f, transactionId: e.target.value }))}
                  placeholder="e.g. TXN123456789" />
              </FormField>
            )}

            <FormField label="Remarks (optional)">
              <input className="input" value={payForm.remarks}
                onChange={e => setPayForm(f => ({ ...f, remarks: e.target.value }))}
                placeholder="Any notes about this payment..." />
            </FormField>

            <div className="flex gap-3 pt-1">
              <button type="button" onClick={() => setPayModal(null)} className="btn-outline flex-1">Cancel</button>
              <button type="submit" disabled={paying}
                className="flex-1 py-2 bg-emerald-500 text-white text-sm font-bold rounded-lg hover:bg-emerald-600 transition-colors disabled:opacity-50">
                {paying ? 'Processing...' : 'Confirm Payment'}
              </button>
            </div>
          </form>
        )}
      </Modal>

      {/* ── Receipt / View Modal ───────────────────────────── */}
      <Modal open={!!receiptModal} onClose={() => setReceiptModal(null)} title="Payment Details" size="sm">
        {receiptModal && (
          <div className="space-y-3">
            <div className="flex justify-between items-center pb-3 border-b border-gray-100">
              <span className="font-mono text-sm text-gray-500">{receiptModal.receiptNumber}</span>
              <Badge label={receiptModal.status} variant={receiptModal.status} />
            </div>
            {[
              ['Student', receiptModal.student?.name],
              ['Amount', `₹${receiptModal.amount?.toLocaleString()}`],
              ['Fee Type', receiptModal.feeType?.replace(/-/g,' ')],
              ['Period', receiptModal.month ? `${MONTHS[receiptModal.month - 1]} ${receiptModal.year}` : '—'],
              ['Due Date', receiptModal.dueDate ? new Date(receiptModal.dueDate).toLocaleDateString('en-IN') : '—'],
              ['Paid On', receiptModal.paidDate ? new Date(receiptModal.paidDate).toLocaleDateString('en-IN') : 'Not paid'],
              ['Method', receiptModal.paymentMethod?.replace(/-/g,' ') || '—'],
              ['Transaction ID', receiptModal.transactionId || '—'],
              ['Remarks', receiptModal.remarks || '—'],
            ].map(([label, val]) => (
              <div key={label} className="flex justify-between text-sm">
                <span className="text-gray-400">{label}</span>
                <span className="font-medium text-gray-900 capitalize">{val}</span>
              </div>
            ))}
          </div>
        )}
      </Modal>

      {/* ── Add Payment Record Modal ───────────────────────── */}
      <Modal open={showAdd} onClose={() => setShowAdd(false)} title="Create Payment Record" size="md">
        <form onSubmit={handleCreate} className="space-y-4">
          <FormField label="Student">
            <select className="input" value={form.studentId}
              onChange={e => setForm(f => ({ ...f, studentId: e.target.value }))} required>
              <option value="">Select student...</option>
              {students.map(s => (
                <option key={s._id} value={s.user?._id}>
                  {s.user?.name} — {s.rollNumber}
                </option>
              ))}
            </select>
          </FormField>
          <div className="grid grid-cols-2 gap-4">
            <FormField label="Amount (₹)">
              <input type="number" className="input" value={form.amount}
                onChange={e => setForm(f => ({ ...f, amount: e.target.value }))} required min={0} />
            </FormField>
            <FormField label="Fee Type">
              <select className="input" value={form.feeType}
                onChange={e => setForm(f => ({ ...f, feeType: e.target.value }))}>
                {['hostel-fee','mess-fee','maintenance-fee','security-deposit','fine','other'].map(t => (
                  <option key={t} value={t}>{t.replace(/-/g,' ')}</option>
                ))}
              </select>
            </FormField>
            <FormField label="Month">
              <select className="input" value={form.month}
                onChange={e => setForm(f => ({ ...f, month: Number(e.target.value) }))}>
                {MONTHS.map((m, i) => <option key={i} value={i + 1}>{m}</option>)}
              </select>
            </FormField>
            <FormField label="Year">
              <input type="number" className="input" value={form.year}
                onChange={e => setForm(f => ({ ...f, year: Number(e.target.value) }))} />
            </FormField>
          </div>
          <FormField label="Due Date">
            <input type="date" className="input" value={form.dueDate}
              onChange={e => setForm(f => ({ ...f, dueDate: e.target.value }))} />
          </FormField>
          <FormField label="Remarks (optional)">
            <input className="input" value={form.remarks}
              onChange={e => setForm(f => ({ ...f, remarks: e.target.value }))}
              placeholder="Optional notes..." />
          </FormField>
          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={() => setShowAdd(false)} className="btn-outline">Cancel</button>
            <button type="submit" disabled={submitting} className="btn-primary">
              {submitting ? 'Creating...' : 'Create Record'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}