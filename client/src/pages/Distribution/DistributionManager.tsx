import { useEffect, useState, useMemo, useCallback } from 'react';
import './DistributionManager.css';

// ── Types ──────────────────────────────────────────────────────────────────

interface Distribution {
  distribution_id?: number;
  dist_id?: number;
  receiver_id?: number | null;
  orphanage_id?: number | null;
  receiver_name?: string | null;
  receiver_type?: 'general' | 'orphanage' | null;
  amount?: number | string | null;
  date?: string | null;
  note?: string | null;
}

interface Stats {
  total: number;
  general: number;
  orphanage: number;
  totalAmount: number;
}

type FilterType = '' | 'general' | 'orphanage';

// ── Constants ──────────────────────────────────────────────────────────────

const PAGE_SIZE = 10;

// ── Helpers ────────────────────────────────────────────────────────────────

function getInitials(name: string | null | undefined): string {
  if (!name) return '?';
  return name
    .split(' ')
    .slice(0, 2)
    .map((w) => w[0])
    .join('')
    .toUpperCase();
}

function formatDate(d: string | null | undefined): string {
  if (!d) return '—';
  return new Date(d).toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

function formatAmount(n: number | string | null | undefined): string {
  if (n == null) return '—';
  return Number(n).toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

function computeStats(data: Distribution[]): Stats {
  return {
    total: data.length,
    general: data.filter((d) => d.receiver_type === 'general').length,
    orphanage: data.filter((d) => d.receiver_type === 'orphanage').length,
    totalAmount: data.reduce((s, d) => s + (parseFloat(String(d.amount ?? 0)) || 0), 0),
  };
}

// ── Icons ──────────────────────────────────────────────────────────────────

const IconSearch = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="11" cy="11" r="8" /><path d="m21 21-4.35-4.35" />
  </svg>
);

const IconRefresh = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M23 4v6h-6" /><path d="M1 20v-6h6" />
    <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15" />
  </svg>
);

const IconChevronLeft = () => (
  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
    <path d="M15 18l-6-6 6-6" />
  </svg>
);

const IconChevronRight = () => (
  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
    <path d="M9 18l6-6-6-6" />
  </svg>
);

const IconAlert = () => (
  <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
    <circle cx="12" cy="12" r="10" /><path d="M12 8v4m0 4h.01" />
  </svg>
);

// ── Sub-components ─────────────────────────────────────────────────────────

function StatCards({ stats }: { stats: Stats | null }) {
  const fmt = (n: number | undefined) => (n == null ? '—' : String(n));
  return (
    <div className="dm-stats">
      <div className="dm-stat-card">
        <div className="dm-stat-value">{stats ? fmt(stats.total) : '—'}</div>
        <div className="dm-stat-label">Total Distributions</div>
      </div>
      <div className="dm-stat-card dm-stat-general">
        <div className="dm-stat-value">{stats ? fmt(stats.general) : '—'}</div>
        <div className="dm-stat-label">General</div>
      </div>
      <div className="dm-stat-card dm-stat-orphanage">
        <div className="dm-stat-value">{stats ? fmt(stats.orphanage) : '—'}</div>
        <div className="dm-stat-label">Orphanage</div>
      </div>
      <div className="dm-stat-card">
        <div className="dm-stat-value">{stats ? formatAmount(stats.totalAmount) : '—'}</div>
        <div className="dm-stat-label">Total Amount</div>
      </div>
    </div>
  );
}

function TableRow({ dist, index }: { dist: Distribution; index: number }) {
  const isOrphanage = dist.receiver_type === 'orphanage';
  const name = dist.receiver_name || '—';
  const rid = dist.receiver_id
    ? `#R-${dist.receiver_id}`
    : dist.orphanage_id
    ? `#O-${dist.orphanage_id}`
    : '—';

  return (
    <tr>
      <td className="dm-td-num">{index}</td>
      <td>
        <div className="dm-receiver-cell">
          <div className={`dm-avatar${isOrphanage ? ' orphanage' : ''}`}>
            {getInitials(name)}
          </div>
          <div>
            <div className="dm-receiver-name">{name}</div>
            <div className="dm-receiver-id">{rid}</div>
          </div>
        </div>
      </td>
      <td>
        <span className={`dm-type-chip ${isOrphanage ? 'orphanage' : 'general'}`}>
          {isOrphanage ? 'Orphanage' : 'General'}
        </span>
      </td>
      <td>
        <div className="dm-amount">{formatAmount(dist.amount)}</div>
        <div className="dm-amount-label">PKR</div>
      </td>
      <td>
        <div className="dm-date">{formatDate(dist.date)}</div>
      </td>
      <td>
        {dist.note ? (
          <div className="dm-note" title={dist.note}>{dist.note}</div>
        ) : (
          <span className="dm-note-empty">No note</span>
        )}
      </td>
    </tr>
  );
}

// ── Main Component ─────────────────────────────────────────────────────────

export default function DistributionManager() {
  const [allData, setAllData]     = useState<Distribution[]>([]);
  const [loading, setLoading]     = useState(true);
  const [error, setError]         = useState<string | null>(null);
  const [search, setSearch]       = useState('');
  const [typeFilter, setTypeFilter] = useState<FilterType>('');
  const [currentPage, setCurrentPage] = useState(1);
  const [spinning, setSpinning]   = useState(false);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setSpinning(true);
    setError(null);
    try {
      const token = sessionStorage.getItem('token');

      const res = await fetch('https://legal-impart-demise.ngrok-free.dev/api/admin/distributions', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json = await res.json();
      setAllData(json.distributions ?? []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load distributions');
    } finally {
      setLoading(false);
      setSpinning(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  // Reset to page 1 whenever filters change
  useEffect(() => { setCurrentPage(1); }, [search, typeFilter]);

  const stats = useMemo(() => computeStats(allData), [allData]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return allData.filter((d) => {
      const name = (d.receiver_name ?? '').toLowerCase();
      const id   = String(d.distribution_id ?? d.dist_id ?? '').toLowerCase();
      const matchQ    = !q || name.includes(q) || id.includes(q);
      const matchType = !typeFilter || d.receiver_type === typeFilter;
      return matchQ && matchType;
    });
  }, [allData, search, typeFilter]);

  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);
  const pageStart  = (currentPage - 1) * PAGE_SIZE;
  const pageRows   = filtered.slice(pageStart, pageStart + PAGE_SIZE);

  const pageNumbers = useMemo(() => {
    const start = Math.max(1, currentPage - 2);
    const end   = Math.min(totalPages, start + 4);
    return Array.from({ length: end - start + 1 }, (_, i) => start + i);
  }, [currentPage, totalPages]);

  // ── Render ───────────────────────────────────────────────────────────────

  const renderTableBody = () => {
    if (loading) {
      return (
        <tr>
          <td colSpan={6}>
            <div className="dm-loading">
              <div className="dm-spinner" />
              Loading distributions…
            </div>
          </td>
        </tr>
      );
    }
    if (error) {
      return (
        <tr>
          <td colSpan={6}>
            <div className="dm-error">
              <IconAlert />
              <span>{error}</span>
              <button className="dm-retry-btn" onClick={fetchData}>Try again</button>
            </div>
          </td>
        </tr>
      );
    }
    if (!filtered.length) {
      return (
        <tr>
          <td colSpan={6}>
            <div className="dm-empty">
              <div className="dm-empty-icon">📭</div>
              <p>No distributions found</p>
              <small>Try adjusting your search or filter</small>
            </div>
          </td>
        </tr>
      );
    }
    return pageRows.map((d, i) => (
      <TableRow
        key={d.distribution_id ?? d.dist_id ?? i}
        dist={d}
        index={pageStart + i + 1}
      />
    ));
  };

  return (
    <div className="dm-wrapper">

      {/* Header */}
      <div className="dm-header">
        <div className="dm-header-icon">DM</div>
        <div className="dm-header-info">
          <p className="dm-header-label">Admin Panel</p>
          <h1 className="dm-header-title">Distribution Manager</h1>
          <p className="dm-header-sub">View all aid distributions</p>
        </div>
        <button
          className={`dm-refresh-btn${spinning ? ' spinning' : ''}`}
          onClick={fetchData}
          title="Refresh"
          disabled={loading}
        >
          <IconRefresh />
        </button>
      </div>

      {/* Stats */}
      <StatCards stats={loading ? null : stats} />

      {/* Filters */}
      <div className="dm-filters">
        <div className="dm-search-wrap">
          <span className="dm-search-icon"><IconSearch /></span>
          <input
            className="dm-search"
            type="text"
            placeholder="Search by receiver name or ID…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <select
          className="dm-filter-select"
          value={typeFilter}
          onChange={(e) => setTypeFilter(e.target.value as FilterType)}
        >
          <option value="">All Types</option>
          <option value="general">General</option>
          <option value="orphanage">Orphanage</option>
        </select>
      </div>

      {/* Table */}
      <div className="dm-table-wrap">
        <table className="dm-table">
          <thead>
            <tr>
              <th>#</th>
              <th>Receiver</th>
              <th>Type</th>
              <th>Amount</th>
              <th>Date</th>
              <th>Note</th>
            </tr>
          </thead>
          <tbody>{renderTableBody()}</tbody>
        </table>

        {/* Pagination — only when we have rows */}
        {!loading && !error && filtered.length > 0 && (
          <div className="dm-pagination">
            <span>
              Showing {pageStart + 1}–{Math.min(pageStart + PAGE_SIZE, filtered.length)} of {filtered.length}
            </span>
            <div className="dm-page-btns">
              <button
                className="dm-page-btn"
                onClick={() => setCurrentPage((p) => p - 1)}
                disabled={currentPage === 1}
              >
                <IconChevronLeft />
              </button>

              {pageNumbers.map((p) => (
                <button
                  key={p}
                  className={`dm-page-btn${p === currentPage ? ' active' : ''}`}
                  onClick={() => setCurrentPage(p)}
                >
                  {p}
                </button>
              ))}

              <button
                className="dm-page-btn"
                onClick={() => setCurrentPage((p) => p + 1)}
                disabled={currentPage === totalPages}
              >
                <IconChevronRight />
              </button>
            </div>
          </div>
        )}
      </div>

    </div>
  );
}