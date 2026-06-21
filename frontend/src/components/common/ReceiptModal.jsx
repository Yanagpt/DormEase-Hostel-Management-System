import { useState, useEffect } from 'react';
import { X, Printer, Download } from 'lucide-react';
import api from '../../api/axios';
import toast from 'react-hot-toast';

const MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December'];

/**
 * Printable payment receipt modal.
 * Usage: <ReceiptModal paymentId={id} open={bool} onClose={fn} />
 */
export default function ReceiptModal({ paymentId, open, onClose }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (open && paymentId) {
      setLoading(true);
      api.get('/payments/' + paymentId + '/receipt')
        .then(function(res) { setData(res.data.data); })
        .catch(function(err) { toast.error(err.response?.data?.message || 'Could not load receipt.'); onClose(); })
        .finally(function() { setLoading(false); });
    } else {
      setData(null);
    }
  }, [open, paymentId]);

  if (!open) return null;

  function handlePrint() {
    const printContents = document.getElementById('receipt-printable').innerHTML;
    const printWindow = window.open('', '_blank', 'width=700,height=900');
    printWindow.document.write(
      '<html><head><title>Receipt</title><style>' +
      'body{font-family:Arial,sans-serif;padding:40px;color:#1a1a1a;}' +
      '.receipt-header{display:flex;justify-content:space-between;align-items:flex-start;border-bottom:3px solid #e94560;padding-bottom:20px;margin-bottom:24px;}' +
      '.brand{font-size:22px;font-weight:800;color:#1a1a2e;}' +
      '.tag{display:inline-block;padding:4px 12px;background:#d1fae5;color:#065f46;border-radius:6px;font-size:12px;font-weight:700;}' +
      'table{width:100%;border-collapse:collapse;margin:20px 0;}' +
      'td{padding:10px 0;font-size:14px;border-bottom:1px solid #f0f0f0;}' +
      '.label{color:#6b7280;}' +
      '.value{text-align:right;font-weight:600;}' +
      '.total-row td{font-size:18px;font-weight:800;color:#059669;border-bottom:none;border-top:2px solid #1a1a2e;padding-top:16px;}' +
      '.footer{margin-top:40px;padding-top:20px;border-top:1px solid #e5e7eb;font-size:12px;color:#9ca3af;text-align:center;}' +
      '</style></head><body>' + printContents + '</body></html>'
    );
    printWindow.document.close();
    printWindow.focus();
    setTimeout(function() { printWindow.print(); }, 250);
  }

  return (
    <div onClick={onClose} style={{ position: 'fixed', inset: 0, zIndex: 60, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16, background: 'rgba(0,0,0,0.5)' }}>
      <div onClick={function(e) { e.stopPropagation(); }} style={{ background: '#fff', borderRadius: 16, width: '100%', maxWidth: 560, maxHeight: '92vh', overflowY: 'auto', boxShadow: '0 24px 60px rgba(0,0,0,0.2)' }}>

        {/* Toolbar */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '14px 20px', borderBottom: '1px solid #f0f0f0', position: 'sticky', top: 0, background: '#fff', zIndex: 1 }}>
          <span style={{ fontWeight: 700, fontSize: '0.95rem', color: '#111' }}>Payment Receipt</span>
          <div style={{ display: 'flex', gap: 8 }}>
            <button onClick={handlePrint} disabled={!data}
              style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '7px 14px', background: '#e94560', color: '#fff', border: 'none', borderRadius: 8, fontSize: '0.8rem', fontWeight: 700, cursor: data ? 'pointer' : 'not-allowed', opacity: data ? 1 : 0.5 }}>
              <Printer size={13} /> Print / Save PDF
            </button>
            <button onClick={onClose} style={{ padding: 8, background: '#f3f4f6', border: 'none', borderRadius: 8, cursor: 'pointer', color: '#6b7280' }}>
              <X size={14} />
            </button>
          </div>
        </div>

        {/* Receipt body */}
        <div style={{ padding: 24 }}>
          {loading || !data ? (
            <div style={{ textAlign: 'center', padding: 60, color: '#9ca3af' }}>Loading receipt...</div>
          ) : (
            <div id="receipt-printable">
              <div className="receipt-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', borderBottom: '3px solid #e94560', paddingBottom: 20, marginBottom: 24 }}>
                <div>
                  <div className="brand" style={{ fontSize: 22, fontWeight: 800, color: '#1a1a2e' }}>{data.hostel.name}</div>
                  <p style={{ margin: '4px 0 0', fontSize: 13, color: '#6b7280' }}>{data.hostel.address}</p>
                  <p style={{ margin: 0, fontSize: 13, color: '#6b7280' }}>{data.hostel.contact} · {data.hostel.email}</p>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <span className="tag" style={{ display: 'inline-block', padding: '4px 12px', background: '#d1fae5', color: '#065f46', borderRadius: 6, fontSize: 12, fontWeight: 700 }}>PAID</span>
                  <p style={{ margin: '8px 0 0', fontSize: 13, fontFamily: 'monospace', color: '#374151' }}>{data.payment.receiptNumber}</p>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 8 }}>
                <div>
                  <p style={{ margin: '0 0 4px', fontSize: 11, color: '#9ca3af', fontWeight: 700, textTransform: 'uppercase' }}>Billed To</p>
                  <p style={{ margin: 0, fontWeight: 700, fontSize: 15, color: '#111' }}>{data.student.name}</p>
                  <p style={{ margin: '2px 0 0', fontSize: 13, color: '#6b7280' }}>{data.student.email}</p>
                  {data.student.rollNumber && <p style={{ margin: '2px 0 0', fontSize: 13, color: '#6b7280' }}>Roll No: {data.student.rollNumber}</p>}
                  {data.student.room && <p style={{ margin: '2px 0 0', fontSize: 13, color: '#6b7280' }}>Room: {data.student.room.roomNumber}</p>}
                </div>
                <div style={{ textAlign: 'right' }}>
                  <p style={{ margin: '0 0 4px', fontSize: 11, color: '#9ca3af', fontWeight: 700, textTransform: 'uppercase' }}>Payment Date</p>
                  <p style={{ margin: 0, fontWeight: 600, fontSize: 14, color: '#111' }}>
                    {new Date(data.payment.paidDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'long', year: 'numeric' })}
                  </p>
                </div>
              </div>

              <table style={{ width: '100%', borderCollapse: 'collapse', margin: '20px 0' }}>
                <tbody>
                  <tr><td className="label" style={{ padding: '10px 0', fontSize: 14, color: '#6b7280', borderBottom: '1px solid #f0f0f0' }}>Fee Type</td>
                    <td className="value" style={{ padding: '10px 0', fontSize: 14, fontWeight: 600, textAlign: 'right', borderBottom: '1px solid #f0f0f0', textTransform: 'capitalize' }}>
                      {data.payment.feeType.replace(/-/g,' ')}
                    </td></tr>
                  {data.payment.month && (
                    <tr><td className="label" style={{ padding: '10px 0', fontSize: 14, color: '#6b7280', borderBottom: '1px solid #f0f0f0' }}>Billing Period</td>
                      <td className="value" style={{ padding: '10px 0', fontSize: 14, fontWeight: 600, textAlign: 'right', borderBottom: '1px solid #f0f0f0' }}>
                        {MONTHS[data.payment.month - 1]} {data.payment.year}
                      </td></tr>
                  )}
                  <tr><td className="label" style={{ padding: '10px 0', fontSize: 14, color: '#6b7280', borderBottom: '1px solid #f0f0f0' }}>Payment Method</td>
                    <td className="value" style={{ padding: '10px 0', fontSize: 14, fontWeight: 600, textAlign: 'right', borderBottom: '1px solid #f0f0f0', textTransform: 'capitalize' }}>
                      {(data.payment.paymentMethod || '—').replace(/-/g,' ')}
                    </td></tr>
                  {data.payment.transactionId && (
                    <tr><td className="label" style={{ padding: '10px 0', fontSize: 14, color: '#6b7280', borderBottom: '1px solid #f0f0f0' }}>Transaction ID</td>
                      <td className="value" style={{ padding: '10px 0', fontSize: 14, fontWeight: 600, textAlign: 'right', borderBottom: '1px solid #f0f0f0', fontFamily: 'monospace' }}>
                        {data.payment.transactionId}
                      </td></tr>
                  )}
                  {data.payment.remarks && (
                    <tr><td className="label" style={{ padding: '10px 0', fontSize: 14, color: '#6b7280', borderBottom: '1px solid #f0f0f0' }}>Remarks</td>
                      <td className="value" style={{ padding: '10px 0', fontSize: 14, fontWeight: 600, textAlign: 'right', borderBottom: '1px solid #f0f0f0' }}>
                        {data.payment.remarks}
                      </td></tr>
                  )}
                  <tr className="total-row">
                    <td style={{ fontSize: 18, fontWeight: 800, color: '#059669', borderTop: '2px solid #1a1a2e', paddingTop: 16 }}>Total Paid</td>
                    <td style={{ fontSize: 18, fontWeight: 800, color: '#059669', textAlign: 'right', borderTop: '2px solid #1a1a2e', paddingTop: 16 }}>
                      ₹{data.payment.amount.toLocaleString()}
                    </td>
                  </tr>
                </tbody>
              </table>

              <div className="footer" style={{ marginTop: 40, paddingTop: 20, borderTop: '1px solid #e5e7eb', fontSize: 12, color: '#9ca3af', textAlign: 'center' }}>
                This is a computer-generated receipt and does not require a signature.<br />
                Recorded by {data.payment.recordedBy?.name || 'System'} · Generated on {new Date().toLocaleDateString('en-IN')}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}