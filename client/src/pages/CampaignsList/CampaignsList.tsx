import React, { useEffect, useState } from "react";
import "../AdminControls/Table.css";
import "./CampaignsList.css";

// Matches getActiveCampaigns query:
// SELECT c.campaign_id, c.title, c.description, c.target_amount,
//        c.end_date, COALESCE(SUM(d.amount), 0) as amount_raised
// FROM Campaign c
// LEFT JOIN Donation d ON c.campaign_id = d.campaign_id AND d.status = 'approved'
// WHERE c.end_date >= CURDATE()
interface Campaign {
  campaign_id: number;
  title: string;
  description: string;
  target_amount: number;
  end_date: string;
  amount_raised: number;
}

interface DonateFormData {
  amount: string;
}

const BASE_URL = "https://awt-system.vercel.app/api";

const MONEY_TYPE_ID = 1; // Money donation_type_id from your Donation_Type table

const CampaignsList: React.FC = () => {
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Donate modal state
  const [donateTarget, setDonateTarget] = useState<Campaign | null>(null);
  const [form, setForm] = useState<DonateFormData>({ amount: "" });
  const [donating, setDonating] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const getToken = () => sessionStorage.getItem("token");

  // ── Fetch active campaigns ─────────────────────────────────────────────────
  const fetchCampaigns = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${BASE_URL}/campaigns/active`, {
        headers: { Authorization: `Bearer ${getToken()}` },
      });
      const data = await res.json();
      if (data.success) {
        setCampaigns(data.campaigns);
      } else {
        setError(data.message || "Failed to fetch campaigns");
      }
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchCampaigns(); }, []);

  // ── Open donate modal ──────────────────────────────────────────────────────
  const openDonate = (campaign: Campaign) => {
    setDonateTarget(campaign);
    setForm({ amount: "" });
    setSuccessMsg(null);
  };

  const closeDonate = () => {
    if (donating) return; // block close while request is in flight
    setDonateTarget(null);
    setSuccessMsg(null);
  };

  // ── Submit donation ────────────────────────────────────────────────────────
  const handleDonate = async () => {
    if (!donateTarget) return;
    const amount = Number(form.amount);
    if (!amount || amount <= 0) return;

    setDonating(true);
    try {
      const res = await fetch(`${BASE_URL}/donations/create`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${getToken()}`,
        },
        body: JSON.stringify({
          donation_type_id: MONEY_TYPE_ID,
          amount,
          campaign_id: donateTarget.campaign_id,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setSuccessMsg(
          `Donation of PKR ${amount.toLocaleString()} submitted! It will be reflected once approved.`
        );
        // Optimistically update amount_raised in the list
        setCampaigns((prev) =>
          prev.map((c) =>
            c.campaign_id === donateTarget.campaign_id
              ? { ...c, amount_raised: c.amount_raised + amount }
              : c
          )
        );
      } else {
        alert(data.message || "Failed to submit donation");
      }
    } catch {
      alert("Network error.");
    } finally {
      setDonating(false);
    }
  };

  // ── Helpers ────────────────────────────────────────────────────────────────
  const formatPKR = (n: number) => `PKR ${Number(n).toLocaleString("en-PK")}`;

  const formatDate = (dateStr: string) =>
    new Date(dateStr).toLocaleDateString("en-PK", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });

  const progressPct = (raised: number, target: number) =>
    target ? Math.min(100, Math.round((raised / target) * 100)) : 0;

  const daysLeft = (endDate: string) => {
    const diff = new Date(endDate).getTime() - Date.now();
    return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
  };

  const remaining = (c: Campaign) =>
    Math.max(0, c.target_amount - c.amount_raised);

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <div className="table-page">
      {/* Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">Active Campaigns</h1>
          <p className="page-subtitle">Support a cause — every contribution matters</p>
        </div>
        <button className="refresh-btn" onClick={fetchCampaigns} disabled={loading}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <polyline points="23 4 23 10 17 10" />
            <polyline points="1 20 1 14 7 14" />
            <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15" />
          </svg>
          Refresh
        </button>
      </div>

      {/* Loading */}
      {loading && (
        <div className="loading-state">
          <div className="spinner" />
          <span>Loading campaigns...</span>
        </div>
      )}

      {/* Error */}
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

      {/* Campaign Cards */}
      {!loading && !error && (
        <>
          {campaigns.length === 0 ? (
            <div className="empty-state">No active campaigns at the moment.</div>
          ) : (
            <div className="campaigns-grid">
              {campaigns.map((c) => {
                const pct  = progressPct(c.amount_raised, c.target_amount);
                const days = daysLeft(c.end_date);
                const rem  = remaining(c);

                return (
                  <div key={c.campaign_id} className="campaign-card">
                    {/* Card Header */}
                    <div className="campaign-card-header">
                      <div className="campaign-card-title">{c.title}</div>
                      <span className={`days-badge ${days <= 7 ? "days-urgent" : ""}`}>
                        {days === 0 ? "Ends today" : `${days}d left`}
                      </span>
                    </div>

                    {/* Description */}
                    {c.description && (
                      <p className="campaign-card-desc">{c.description}</p>
                    )}

                    {/* Progress */}
                    <div className="campaign-progress">
                      <div className="campaign-progress-bar-wrap">
                        <div
                          className="campaign-progress-bar-fill"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                      <div className="campaign-progress-labels">
                        <span className="campaign-raised">
                          {formatPKR(c.amount_raised)} raised
                        </span>
                        <span className="campaign-pct">{pct}%</span>
                      </div>
                    </div>

                    {/* Stats row */}
                    <div className="campaign-stats">
                      <div className="campaign-stat">
                        <span className="campaign-stat-label">Goal</span>
                        <span className="campaign-stat-value">{formatPKR(c.target_amount)}</span>
                      </div>
                      <div className="campaign-stat">
                        <span className="campaign-stat-label">Remaining</span>
                        <span className="campaign-stat-value">{formatPKR(rem)}</span>
                      </div>
                      <div className="campaign-stat">
                        <span className="campaign-stat-label">Ends</span>
                        <span className="campaign-stat-value">{formatDate(c.end_date)}</span>
                      </div>
                    </div>

                    {/* Donate Button */}
                    <button
                      className="donate-btn"
                      onClick={() => openDonate(c)}
                      disabled={rem === 0}
                    >
                      {rem === 0 ? "Goal Reached" : "Donate Now"}
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </>
      )}

      {/* ── Donate Modal ── */}
      {donateTarget && (
        <div className="modal-overlay" onClick={closeDonate}>
          <div className="modal-box" onClick={(e) => e.stopPropagation()}>

            {successMsg ? (
              /* Success state */
              <>
                <div className="modal-success-icon">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <circle cx="12" cy="12" r="10" />
                    <polyline points="9 12 11 14 15 10" />
                  </svg>
                </div>
                <div className="modal-title">Donation Submitted!</div>
                <p className="confirm-text">{successMsg}</p>
                <div className="modal-actions">
                  <button className="modal-save-btn" onClick={closeDonate}>Done</button>
                </div>
              </>
            ) : (
              /* Donate form */
              <>
                <div className="modal-title">Donate to Campaign</div>
                <div className="modal-campaign-name">{donateTarget.title}</div>

                <div className="modal-meta-row">
                  <span className="modal-meta-item">
                    <span className="modal-meta-label">Remaining</span>
                    <span className="modal-meta-value">
                      {formatPKR(remaining(donateTarget))}
                    </span>
                  </span>
                  <span className="modal-meta-item">
                    <span className="modal-meta-label">Ends</span>
                    <span className="modal-meta-value">
                      {formatDate(donateTarget.end_date)}
                    </span>
                  </span>
                </div>

                <div className="modal-field">
                  <label>Amount (PKR)</label>
                  <input
                    type="number"
                    min={1}
                    max={remaining(donateTarget)}
                    value={form.amount}
                    onChange={(e) => setForm({ amount: e.target.value })}
                    placeholder={`Max ${formatPKR(remaining(donateTarget))}`}
                    disabled={donating}
                  />
                </div>

                {/* Quick amount chips */}
                <div className="quick-amounts">
                  {[500, 1000, 2500, 5000].map((amt) => {
                    const rem = remaining(donateTarget);
                    if (amt > rem) return null;
                    return (
                      <button
                        key={amt}
                        className={`quick-chip ${Number(form.amount) === amt ? "active" : ""}`}
                        onClick={() => setForm({ amount: String(amt) })}
                        disabled={donating}
                      >
                        {formatPKR(amt)}
                      </button>
                    );
                  })}
                </div>

                <div className="modal-actions">
                  <button
                    className="modal-cancel-btn"
                    onClick={closeDonate}
                    disabled={donating}
                  >
                    Cancel
                  </button>
                  <button
                    className="modal-save-btn"
                    disabled={!form.amount || Number(form.amount) <= 0 || donating}
                    onClick={handleDonate}
                  >
                    {donating ? "Submitting..." : "Confirm Donation"}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default CampaignsList;
