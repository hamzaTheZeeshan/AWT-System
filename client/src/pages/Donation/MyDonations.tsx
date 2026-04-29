import React, { useEffect, useState } from "react";
import "./MyDonations.css";

interface Donation {
  donation_id: number;
  type_name: string;
  amount: number | null;
  date: string;
  status: "pending" | "approved" | "rejected";
  campaign_id: number | null;
}

const STATUS_LABELS: Record<string, string> = {
  pending: "Pending",
  approved: "Approved",
  rejected: "Rejected",
};

const TYPE_ICONS: Record<string, string> = {
  Sadqah: "🤲",
  Zakat: "☪️",
  Khairat: "💚",
  Clothes: "👕",
  Books: "📚",
};

const formatDate = (dateStr: string) => {
  const d = new Date(dateStr);
  return d.toLocaleDateString("en-PK", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};

const formatAmount = (amount: number | null, typeName: string) => {
  if (amount !== null && amount !== undefined) {
    return `PKR ${Number(amount).toLocaleString()}`;  // ← add Number()
  }
  return typeName === "Clothes" ? "Items" : typeName === "Books" ? "Books" : "—";
};

const MyDonations: React.FC = () => {
  const [donations, setDonations] = useState<Donation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<"all" | "pending" | "approved" | "rejected">("all");

  useEffect(() => {
    const fetchDonations = async () => {
      try {
        setLoading(true);
        const token = sessionStorage.getItem("token");
        const res = await fetch("http://localhost:5000/api/donations/my-donations", {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        if (!res.ok) throw new Error("Failed to fetch donations");
        const data = await res.json();
        setDonations(data.donations || []);
      } catch (err: any) {
        setError(err.message || "Something went wrong");
      } finally {
        setLoading(false);
      }
    };

    fetchDonations();
  }, []);

  const filtered =
    filter === "all" ? donations : donations.filter((d) => d.status === filter);

  const totalApproved = donations
    .filter((d) => d.status === "approved" && d.amount)
    .reduce((sum, d) => sum + (Number(d.amount) || 0), 0);

  const approvedCount = donations.filter((d) => d.status === "approved").length;
  const pendingCount = donations.filter((d) => d.status === "pending").length;

  return (
    <div className="md-wrapper">
      {/* Header */}
      <div className="md-header">
        <div className="md-header-icon">A</div>
        <div>
          <p className="md-header-label">AWT SYSTEM</p>
          <h1 className="md-header-title">My Donations</h1>
          <p className="md-header-sub">Track your contributions and their status</p>
        </div>
      </div>

      {/* Stats Row */}
      <div className="md-stats">
        <div className="md-stat-card">
          <span className="md-stat-value">
            {loading ? "—" : donations.length}
          </span>
          <span className="md-stat-label">Total</span>
        </div>
        <div className="md-stat-card md-stat-approved">
          <span className="md-stat-value">
            {loading ? "—" : approvedCount}
          </span>
          <span className="md-stat-label">Approved</span>
        </div>
        <div className="md-stat-card md-stat-pending">
          <span className="md-stat-value">
            {loading ? "—" : pendingCount}
          </span>
          <span className="md-stat-label">Pending</span>
        </div>
        <div className="md-stat-card md-stat-money">
          <span className="md-stat-value">
            {loading ? "—" : `PKR ${totalApproved.toLocaleString()}`}
          </span>
          <span className="md-stat-label">Approved Amount</span>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="md-filters">
        {(["all", "approved", "pending", "rejected"] as const).map((f) => (
          <button
            key={f}
            className={`md-filter-btn ${filter === f ? "md-filter-active" : ""}`}
            onClick={() => setFilter(f)}
          >
            {f.charAt(0).toUpperCase() + f.slice(1)}
          </button>
        ))}
      </div>

      {/* Content */}
      {loading ? (
        <div className="md-loading">
          <div className="md-spinner" />
          <p>Loading your donations…</p>
        </div>
      ) : error ? (
        <div className="md-error">
          <span>⚠️</span>
          <p>{error}</p>
        </div>
      ) : filtered.length === 0 ? (
        <div className="md-empty">
          <span className="md-empty-icon">🤲</span>
          <p>No donations found</p>
          <small>Your generosity will show up here</small>
        </div>
      ) : (
        <div className="md-list">
          {filtered.map((donation) => (
            <div key={donation.donation_id} className="md-card">
              <div className="md-card-left">
                <div className="md-card-icon">
                  {TYPE_ICONS[donation.type_name] || "💛"}
                </div>
                <div className="md-card-info">
                  <span className="md-card-type">{donation.type_name}</span>
                  <span className="md-card-date">{formatDate(donation.date)}</span>
                  {donation.campaign_id && (
                    <span className="md-card-campaign">
                      Campaign #{donation.campaign_id}
                    </span>
                  )}
                </div>
              </div>
              <div className="md-card-right">
                <span className="md-card-amount">
                  {formatAmount(donation.amount, donation.type_name)}
                </span>
                <span className={`md-badge md-badge-${donation.status}`}>
                  {STATUS_LABELS[donation.status]}
                </span>
                <span className="md-card-id">#{donation.donation_id}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default MyDonations;