import React, { useEffect, useState } from "react";
import "../AdminControls/Table.css";
import "./OrphanagesList.css";

// Matches getAllOrphanages query:
// SELECT orphanage_id, name, location, contact_info
// FROM Orphanage
// ORDER BY orphanage_id
interface Orphanage {
  orphanage_id: number;
  name: string;
  location: string;
  contact_info: string;
}

const BASE_URL = "https://awt-system.vercel.app/api";

const OrphanagesList: React.FC = () => {
  const [orphanages, setOrphanages] = useState<Orphanage[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Donate / support modal state
  const [donateTarget, setDonateTarget] = useState<Orphanage | null>(null);
  const [amount, setAmount] = useState("");
  const [donating, setDonating] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const getToken = () => sessionStorage.getItem("token");

  // ── Fetch orphanages ───────────────────────────────────────────────────────
  const fetchOrphanages = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${BASE_URL}/orphanages`, {
        headers: { Authorization: `Bearer ${getToken()}` },
      });
      const data = await res.json();
      if (data.success) {
        setOrphanages(data.orphanages);
      } else {
        setError(data.message || "Failed to fetch orphanages");
      }
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchOrphanages(); }, []);

  // ── Open donate modal ──────────────────────────────────────────────────────
  const openDonate = (orphanage: Orphanage) => {
    setDonateTarget(orphanage);
    setAmount("");
    setSuccessMsg(null);
  };

  const closeDonate = () => {
    if (donating) return;
    setDonateTarget(null);
    setSuccessMsg(null);
  };

  // ── Submit donation to orphanage ──────────────────────────────────────────
  const handleDonate = async () => {
    if (!donateTarget) return;
    const numAmount = Number(amount);
    if (!numAmount || numAmount <= 0) return;

    setDonating(true);
    try {
      const res = await fetch(`${BASE_URL}/donations/create`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${getToken()}`,
        },
        body: JSON.stringify({
          donation_type_id: 1, // Money
          amount: numAmount,
          orphanage_id: donateTarget.orphanage_id,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setSuccessMsg(
          `Donation of PKR ${numAmount.toLocaleString()} submitted to ${donateTarget.name}! It will be reflected once approved.`
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

  // Derive initials for avatar
  const getInitials = (name: string) =>
    name
      .split(" ")
      .slice(0, 2)
      .map((w) => w[0])
      .join("")
      .toUpperCase();

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <div className="table-page">
      {/* Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">Orphanages</h1>
          <p className="page-subtitle">Support a home — your kindness changes lives</p>
        </div>
        <button className="refresh-btn" onClick={fetchOrphanages} disabled={loading}>
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
          <span>Loading orphanages...</span>
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

      {/* Orphanage Cards */}
      {!loading && !error && (
        <>
          {orphanages.length === 0 ? (
            <div className="empty-state">No orphanages found.</div>
          ) : (
            <div className="orphanages-grid">
              {orphanages.map((o) => (
                <div key={o.orphanage_id} className="orphanage-card">
                  {/* Avatar + Name */}
                  <div className="orphanage-card-header">
                    <div className="orphanage-avatar">
                      {getInitials(o.name)}
                    </div>
                    <div className="orphanage-card-title">{o.name}</div>
                  </div>

                  {/* Info rows */}
                  <div className="orphanage-info">
                    {o.location && (
                      <div className="orphanage-info-row">
                        <svg className="orphanage-info-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z" />
                          <circle cx="12" cy="9" r="2.5" />
                        </svg>
                        <span>{o.location}</span>
                      </div>
                    )}
                    {o.contact_info && (
                      <div className="orphanage-info-row">
                        <svg className="orphanage-info-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
                        </svg>
                        <span>{o.contact_info}</span>
                      </div>
                    )}
                  </div>

                  {/* Donate Button */}
                  <button
                    className="donate-btn"
                    onClick={() => openDonate(o)}
                  >
                    Donate Now
                  </button>
                </div>
              ))}
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
                <div className="modal-title">Donate to Orphanage</div>
                <div className="modal-campaign-name">{donateTarget.name}</div>

                <div className="modal-meta-row">
                  {donateTarget.location && (
                    <span className="modal-meta-item">
                      <span className="modal-meta-label">Location</span>
                      <span className="modal-meta-value">{donateTarget.location}</span>
                    </span>
                  )}
                  {donateTarget.contact_info && (
                    <span className="modal-meta-item">
                      <span className="modal-meta-label">Contact</span>
                      <span className="modal-meta-value">{donateTarget.contact_info}</span>
                    </span>
                  )}
                </div>

                <div className="modal-field">
                  <label>Amount (PKR)</label>
                  <input
                    type="number"
                    min={1}
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    placeholder="Enter amount"
                    disabled={donating}
                  />
                </div>

                {/* Quick amount chips */}
                <div className="quick-amounts">
                  {[500, 1000, 2500, 5000].map((amt) => (
                    <button
                      key={amt}
                      className={`quick-chip ${Number(amount) === amt ? "active" : ""}`}
                      onClick={() => setAmount(String(amt))}
                      disabled={donating}
                    >
                      {formatPKR(amt)}
                    </button>
                  ))}
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
                    disabled={!amount || Number(amount) <= 0 || donating}
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

export default OrphanagesList;
