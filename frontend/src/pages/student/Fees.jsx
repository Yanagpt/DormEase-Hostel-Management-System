import { useEffect, useState, useCallback } from 'react';
import { DollarSign, Clock, CheckCircle2, Printer, Eye } from 'lucide-react';
import api from '../../api/axios';
import { PageHeader, Badge, Spinner, Pagination, EmptyState, StatCard } from '../../components/common/UI';
import ReceiptModal from '../../components/common/ReceiptModal';
import { useAuth } from '../../contexts/AuthContext';

const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

export default function StudentFees() {
  const { user } = useAuth();
  const [payments, setPayments] = useState([]);
  const [pagination, setPagination] = useState(null);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState('');
  const [printBill, setPrintBill] = useState(null);

  const fetchPayments = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page, limit: 10 });
      if (statusFilter) params.set('status', statusFilter);
      const res = await api.get(`/payments?${params}`);
      setPayments(res.data.data);
      setPagination(res.data.pagination);
    } catch { }
    finally { setLoading(false); }
  }, [page, statusFilter]);

  useEffect(() => { fetchPayments(); }, [fetchPayments]);

  const totalPaid = payments.filter(p => p.status === 'paid').reduce((s, p) => s + p.amount, 0);
  const totalPending = payments.filter(p => p.status !== 'paid').reduce((s, p) => s + p.amount, 0);

  return (
    <div>
      <PageHeader title="Fee Payment" subtitle="Your payment history, bills and pending dues" />

      <div className="grid grid-cols-3 gap-4 mb-6">
        <StatCard label="Total Paid" value={`₹${totalPaid.toLocaleString()}`} icon={CheckCircle2} color="#059669" />
        <StatCard label="Pending Dues" value={`₹${totalPending.toLocaleString()}`} icon={Clock} color="#d97706" />
        <StatCard label="Total Records" value={pagination?.total || payments.length} icon={DollarSign} color="#4f46e5" />
      </div>

      <div className="card p-4 mb-4 flex gap-2">
        {['', 'paid', 'pending', 'overdue'].map(s => (
          <button key={s} onClick={() => { setStatusFilter(s); setPage(1); }}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${statusFilter === s ? 'bg-accent text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>
            {s === '' ? 'All' : s.charAt(0).toUpperCase() + s.slice(1)}
          </button>
        ))}
      </div>

      <div className="card overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50 border-b border-gray-100">
            <tr>{['Receipt No.', 'Fee Type', 'Period', 'Amount', 'Due Date', 'Paid Date', 'Status', 'Bill'].map(h => <th key={h} className="table-th">{h}</th>)}</tr>
          </thead>
          <tbody>
            {loading ? <tr><td colSpan={8}><Spinner /></td></tr>
              : payments.length === 0 ? <tr><td colSpan={8}><EmptyState title="No payment records" description="Your fee records will appear here." /></td></tr>
              : payments.map(p => (
                <tr key={p._id} className="table-row">
                  <td className="table-td font-mono text-xs text-gray-500">{p.receiptNumber}</td>
                  <td className="table-td text-sm capitalize">{p.feeType?.replace(/-/g, ' ')}</td>
                  <td className="table-td text-xs">{p.month ? `${MONTHS[p.month - 1]} ${p.year}` : '—'}</td>
                  <td className="table-td font-bold text-gray-900">₹{p.amount?.toLocaleString()}</td>
                  <td className="table-td text-xs">{p.dueDate ? new Date(p.dueDate).toLocaleDateString('en-IN') : '—'}</td>
                  <td className="table-td text-xs">{p.paidDate ? new Date(p.paidDate).toLocaleDateString('en-IN') : '—'}</td>
                  <td className="table-td"><Badge label={p.status} variant={p.status} /></td>
                  <td className="table-td">
                    {p.status === 'paid' ? (
                      <button onClick={() => setPrintBill(p)}
                        className="flex items-center gap-1.5 px-3 py-1 bg-accent/10 text-accent text-xs font-bold rounded-lg hover:bg-accent/20 transition-colors">
                        <Printer size={12} /> View Bill
                      </button>
                    ) : (
                      <span className="text-xs text-gray-300">—</span>
                    )}
                  </td>
                </tr>
              ))}
          </tbody>
        </table>
        <div className="px-4"><Pagination pagination={pagination} onPageChange={setPage} /></div>
      </div>

      {payments.some(p => p.status === 'pending' || p.status === 'overdue') && (
        <div className="mt-4 card p-4 bg-amber-50 border-amber-200">
          <p className="text-sm font-semibold text-amber-800">⚠️ You have pending/overdue dues. Please visit the hostel fee counter or contact your warden to make payment.</p>
        </div>
      )}

      {/* Printable Bill */}
      <ReceiptModal
        open={!!printBill}
        paymentId={printBill?._id}
        onClose={() => setPrintBill(null)}
      />
    </div>
  );
}