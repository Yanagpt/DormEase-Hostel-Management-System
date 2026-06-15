import { useState, useEffect, useCallback } from 'react';
import { Bell, Pin } from 'lucide-react';
import api from '../../api/axios';
import { PageHeader, Badge, Spinner, Pagination, EmptyState } from '../../components/common/UI';

const TAG_OPTIONS = ['important','maintenance','event','general','emergency','fees'];
const TAG_COLORS = { important: 'red', maintenance: 'amber', event: 'purple', general: 'blue', emergency: 'red', fees: 'green' };

export default function StudentNotices() {
  const [notices, setNotices] = useState([]);
  const [pagination, setPagination] = useState(null);
  const [loading, setLoading] = useState(true);
  const [tagFilter, setTagFilter] = useState('');
  const [page, setPage] = useState(1);

  const fetchNotices = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page, limit: 10 });
      if (tagFilter) params.set('tag', tagFilter);
      const res = await api.get(`/notices?${params}`);
      setNotices(res.data.data);
      setPagination(res.data.pagination);
    } catch { }
    finally { setLoading(false); }
  }, [page, tagFilter]);

  useEffect(() => { fetchNotices(); }, [fetchNotices]);

  return (
    <div>
      <PageHeader title="Notices" subtitle="Stay updated with hostel announcements" />

      <div className="flex gap-2 mb-5 flex-wrap">
        {['', ...TAG_OPTIONS].map(t => (
          <button key={t} onClick={() => { setTagFilter(t); setPage(1); }}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors capitalize ${tagFilter === t ? 'bg-accent text-white' : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'}`}>
            {t === '' ? 'All' : t}
          </button>
        ))}
      </div>

      {loading ? <Spinner /> : notices.length === 0 ? (
        <EmptyState icon={Bell} title="No notices" description="Check back later for hostel announcements." />
      ) : (
        <div className="space-y-3 mb-4">
          {notices.map(n => (
            <div key={n._id} className={`card p-5 ${n.isPinned ? 'border-accent/30' : ''}`}>
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-xl bg-accent/10 flex items-center justify-center text-accent flex-shrink-0 mt-0.5">
                  <Bell size={18} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                    {n.isPinned && <Pin size={12} className="text-accent flex-shrink-0" />}
                    <Badge label={n.tag} variant={TAG_COLORS[n.tag] || 'blue'} />
                    <span className="text-xs text-gray-400">By {n.postedBy?.name}</span>
                    <span className="text-xs text-gray-400">· {new Date(n.createdAt).toLocaleDateString('en-IN')}</span>
                  </div>
                  <h3 className="font-bold text-gray-900 mb-2">{n.title}</h3>
                  <p className="text-sm text-gray-600 leading-relaxed">{n.body}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
      <Pagination pagination={pagination} onPageChange={setPage} />
    </div>
  );
}
