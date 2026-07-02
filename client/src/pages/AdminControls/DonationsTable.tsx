import React, { useEffect, useState } from "react";
import "./Table.css";
import "./DonationsTable.css";

// Matches the result of getAllDonations query:
// SELECT d.donation_id, u.name as donor_name, u.email,
//        dt.type_name, d.amount, d.date, d.status, d.campaign_id
// FROM Donation d
// JOIN Users u ON d.user_id = u.user_id
// JOIN Donation_Type dt ON d.donation_type_id = dt.donation_type_id
interface Donation {
  donation_id: number;
  donor_name: string;
  email: string;
  type_name: string;       // from Donation_Type: Money | Zakat | Sadqah | Clothes | Books
  amount: number;
  date: string;
  status: "pending" | "approved" | "rejected";
  campaign_id: number | null;
}

type FilterType = "all" | "pending" | "approved" | "rejected";

const BASE_URL = "https://awt-system.vercel.app/api/admin";

const DonationsTable: React.FC = () => {
  const [donations, setDonations] = useState<Donation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actioningId, setActioningId] = useState<number | null>(null);
  const [filter, setFilter] = useState<FilterType>("all");

  const getToken = () => sessionStorage.getItem("token");

  const fetchDonations = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${BASE_URL}/donations`, {
        headers: { Authorization: `Bearer ${getToken()}` },
      });
      const data = await res.json();
      if (data.success) {
        setDonations(data.donations);
      } else {
        setError(data.message || "Failed to fetch donations");
      }
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleAction = async (id: number, action: "approve" | "reject") => {
    setActioningId(id);
    try {
      const res = await fetch(`${BASE_URL}/donations/${id}/${action}`, {
        method: "PUT",
        headers: { Authorization: `Bearer ${getToken()}` },
      });
      const data = await res.json();
      if (data.success) {
        setDonations((prev) =>
          prev.map((d) =>
            d.donation_id === id
              ? { ...d, status: action === "approve" ? "approved" : "rejected" }
              : d
          )
        );
      } else {
        alert(data.message || `Failed to ${action} donation`);
      }
    } catch {
      alert("Network error.");
    } finally {
      setActioningId(null);
    }
  };

  useEffect(() => { fetchDonations(); }, []);

  const formatDate = (dateStr: string) =>
    new Date(dateStr).toLocaleDateString("en-PK", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });

  const filtered = filter === "all" ? donations : donations.filter((d) => d.status === filter);

  const counts = {
    all:      donations.length,
    pending:  donations.filter((d) => d.status === "pending").length,
    approved: donations.filter((d) => d.status === "approved").length,
    rejected: donations.filter((d) => d.status === "rejected").length,
  };

  return (
    <div className="table-page">
      <div className="page-header">
        <div>
          <h1 className="page-title">Donations</h1>
          <p className="page-subtitle">Review, approve or reject donations</p>
        </div>
        <button className="refresh-btn" onClick={fetchDonations} disabled={loading}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <polyline points="23 4 23 10 17 10" />
            <polyline points="1 20 1 14 7 14" />
            <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15" />
          </svg>
          Refresh
        </button>
      </div>

      <div className="filter-tabs">
        {(["all", "pending", "approved", "rejected"] as FilterType[]).map((tab) => (
          <button
            key={tab}
            className={`filter-tab ${filter === tab ? "active" : ""} filter-${tab}`}
            onClick={() => setFilter(tab)}
          >
            {tab.charAt(0).toUpperCase() + tab.slice(1)}
            <span className="tab-count">{counts[tab]}</span>
          </button>
        ))}
      </div>

      {loading && (
        <div className="loading-state">
          <div className="spinner" />
          <span>Loading donations...</span>
        </div>
      )}

      {error && (
        <div className="error-state">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="10" />
            <line x1="12" y1="8" x2="12" y2="12" />
            <line x1="12" y1="16" x2="12.01" y2="16" />
          </svg>
          {error}
        </div>
      )}

      {!loading && !error && (
        <div className="table-wrapper">
          <table className="data-table">
            <thead>
              <tr>
                <th>#</th>
                <th>Donor</th>
                <th>Type</th>
                <th>Amount</th>
                <th>Date</th>
                <th>Campaign</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((d, idx) => (
                <tr key={d.donation_id} className="table-row">
                  <td className="row-num">{idx + 1}</td>
                  <td>
                    <div className="user-cell">
                      <div className="user-avatar">
                        {d.donor_name.charAt(0).toUpperCase()}
                      </div>
                      <div className="user-details">
                        <span className="user-name">{d.donor_name}</span>
                        <span className="user-email">{d.email}</span>
                      </div>
                    </div>
                  </td>
                  <td>
                    <span className="type-badge">{d.type_name}</span>
                  </td>
                  <td className="amount-cell">
                    <span className="amount">PKR {Number(d.amount).toLocaleString()}</span>
                  </td>
                  <td className="muted">{formatDate(d.date)}</td>
                  <td className="muted">{d.campaign_id ? `#${d.campaign_id}` : "—"}</td>
                  <td>
                    <span className={`status-badge status-${d.status}`}>
                      {d.status.charAt(0).toUpperCase() + d.status.slice(1)}
                    </span>
                  </td>
                  <td>
                    {d.status === "pending" ? (
                      <div className="action-btns">
                        <button
                          className="approve-btn"
                          onClick={() => handleAction(d.donation_id, "approve")}
                          disabled={actioningId === d.donation_id}
                        >
                          {actioningId === d.donation_id ? "..." : "Approve"}
                        </button>
                        <button
                          className="reject-btn"
                          onClick={() => handleAction(d.donation_id, "reject")}
                          disabled={actioningId === d.donation_id}
                        >
                          {actioningId === d.donation_id ? "..." : "Reject"}
                        </button>
                      </div>
                    ) : (
                      <span className="no-action">—</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {filtered.length === 0 && (
            <div className="empty-state">
              No {filter !== "all" ? filter : ""} donations found.
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default DonationsTable;
