import { X, AlertCircle } from 'lucide-react';

// ── StatCard ──────────────────────────────────────────────────────────────────
export function StatCard({ label, value, sub, icon: Icon, color = '#e94560', trend }) {
  return (
    <div className="stat-card">
      <div className="flex justify-between items-start mb-3">
        <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: color + '18', color }}>
          <Icon size={18} />
        </div>
        {trend !== undefined && (
          <span className={`text-xs font-semibold px-2 py-0.5 rounded-md ${trend >= 0 ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-600'}`}>
            {trend >= 0 ? '+' : ''}{trend}%
          </span>
        )}
      </div>
      <div className="text-2xl font-bold text-gray-900 leading-none mb-1">{value}</div>
      <div className="text-sm text-gray-500">{label}</div>
      {sub && <div className="text-xs text-gray-400 mt-0.5">{sub}</div>}
    </div>
  );
}

// ── Badge ─────────────────────────────────────────────────────────────────────
const BADGE_MAP = {
  green: 'badge-green', red: 'badge-red', amber: 'badge-amber',
  blue: 'badge-blue', purple: 'badge-purple', gray: 'badge-gray',
  paid: 'badge-green', pending: 'badge-amber', overdue: 'badge-red',
  open: 'badge-red', 'in-progress': 'badge-amber', resolved: 'badge-green',
  closed: 'badge-gray', rejected: 'badge-red', approved: 'badge-green',
  cancelled: 'badge-gray', available: 'badge-green', full: 'badge-red',
  maintenance: 'badge-amber', active: 'badge-green', inactive: 'badge-gray',
  high: 'badge-red', medium: 'badge-amber', low: 'badge-blue', urgent: 'badge-red',
  important: 'badge-red', event: 'badge-purple', general: 'badge-blue',
};

export function Badge({ label, variant }) {
  const cls = BADGE_MAP[variant || label?.toLowerCase()] || 'badge-gray';
  return <span className={cls}>{label}</span>;
}

// ── Modal ─────────────────────────────────────────────────────────────────────
export function Modal({ open, onClose, title, children, size = 'md' }) {
  if (!open) return null;
  const widths = { sm: 'max-w-md', md: 'max-w-lg', lg: 'max-w-2xl', xl: 'max-w-4xl' };
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" />
      <div
        className={`relative bg-white rounded-2xl shadow-2xl w-full ${widths[size]} max-h-[90vh] overflow-y-auto`}
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center justify-between p-6 border-b border-gray-100">
          <h2 className="text-lg font-bold text-gray-900">{title}</h2>
          <button onClick={onClose} className="w-8 h-8 rounded-lg hover:bg-gray-100 flex items-center justify-center text-gray-500 transition-colors">
            <X size={16} />
          </button>
        </div>
        <div className="p-6">{children}</div>
      </div>
    </div>
  );
}

// ── Spinner ───────────────────────────────────────────────────────────────────
export function Spinner({ size = 20 }) {
  return (
    <div className="flex items-center justify-center p-8">
      <div className="animate-spin rounded-full border-2 border-gray-200 border-t-accent" style={{ width: size, height: size }} />
    </div>
  );
}

// ── Pagination ────────────────────────────────────────────────────────────────
export function Pagination({ pagination, onPageChange }) {
  if (!pagination || pagination.pages <= 1) return null;
  const { page, pages, total, limit } = pagination;
  const from = (page - 1) * limit + 1;
  const to = Math.min(page * limit, total);

  return (
    <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-100">
      <span className="text-sm text-gray-500">Showing {from}–{to} of {total}</span>
      <div className="flex items-center gap-1">
        <button
          onClick={() => onPageChange(page - 1)}
          disabled={!pagination.hasPrev}
          className="px-3 py-1.5 text-sm border border-gray-200 rounded-lg disabled:opacity-40 hover:bg-gray-50 transition-colors"
        >Prev</button>
        {Array.from({ length: Math.min(5, pages) }, (_, i) => {
          const p = page <= 3 ? i + 1 : page + i - 2;
          if (p < 1 || p > pages) return null;
          return (
            <button key={p} onClick={() => onPageChange(p)}
              className={`w-8 h-8 text-sm rounded-lg transition-colors ${p === page ? 'bg-accent text-white' : 'hover:bg-gray-50 border border-gray-200'}`}>
              {p}
            </button>
          );
        })}
        <button
          onClick={() => onPageChange(page + 1)}
          disabled={!pagination.hasNext}
          className="px-3 py-1.5 text-sm border border-gray-200 rounded-lg disabled:opacity-40 hover:bg-gray-50 transition-colors"
        >Next</button>
      </div>
    </div>
  );
}

// ── EmptyState ────────────────────────────────────────────────────────────────
export function EmptyState({ icon: Icon = AlertCircle, title = 'No data found', description = '' }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <div className="w-14 h-14 rounded-2xl bg-gray-100 flex items-center justify-center mb-4 text-gray-400">
        <Icon size={24} />
      </div>
      <p className="font-semibold text-gray-700 mb-1">{title}</p>
      {description && <p className="text-sm text-gray-400 max-w-xs">{description}</p>}
    </div>
  );
}

// ── PageHeader ────────────────────────────────────────────────────────────────
export function PageHeader({ title, subtitle, actions }) {
  return (
    <div className="flex items-start justify-between mb-7">
      <div>
        <h1 className="page-title">{title}</h1>
        {subtitle && <p className="text-sm text-gray-500 mt-1">{subtitle}</p>}
      </div>
      {actions && <div className="flex items-center gap-2">{actions}</div>}
    </div>
  );
}

// ── FormField ─────────────────────────────────────────────────────────────────
export function FormField({ label, error, children }) {
  return (
    <div>
      {label && <label className="label">{label}</label>}
      {children}
      {error && <p className="text-xs text-red-500 mt-1">{error}</p>}
    </div>
  );
}

// ── ConfirmDialog ─────────────────────────────────────────────────────────────
export function ConfirmDialog({ open, onClose, onConfirm, title, message, confirmLabel = 'Confirm', danger = false, loading = false }) {
  return (
    <Modal open={open} onClose={onClose} title={title} size="sm">
      <p className="text-sm text-gray-600 mb-6">{message}</p>
      <div className="flex justify-end gap-3">
        <button onClick={onClose} className="btn-outline">Cancel</button>
        <button onClick={onConfirm} disabled={loading}
          className={`px-4 py-2 rounded-lg font-semibold text-sm transition-opacity disabled:opacity-50 ${danger ? 'bg-red-500 text-white hover:bg-red-600' : 'btn-primary'}`}>
          {loading ? 'Processing...' : confirmLabel}
        </button>
      </div>
    </Modal>
  );
}
