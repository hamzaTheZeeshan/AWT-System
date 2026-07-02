import React, { useEffect, useState } from "react";
import "./Campaigns.css";

type CampaignStatus = "active" | "expired" | "completed";
type FilterTab = "all" | CampaignStatus;

interface Campaign {
  campaign_id: number;
  title: string;
  description: string;
  target_amount: number;
  end_date: string;
  amount_raised: number;
  status: CampaignStatus;
}

interface CampaignFormData {
  title: string;
  description: string;
  target_amount: string;
  end_date: string;
}

const BASE_URL = "https://awt-system.vercel.app/api/admin";

const EMPTY_FORM: CampaignFormData = {
  title: "",
  description: "",
  target_amount: "",
  end_date: "",
};

const getToken = () => sessionStorage.getItem("token");

function formatPKR(amount: number) {
  return `PKR ${amount.toLocaleString("en-PK")}`;
}

function formatDate(iso: string) {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("en-PK", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function toInputDate(iso: string) {
  return iso ? iso.slice(0, 10) : "";
}

function progressPct(raised: number, target: number) {
  if (!target) return 0;
  return Math.min(100, Math.round((raised / target) * 100));
}

const CampaignsPage: React.FC = () => {
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<FilterTab>("all");

  const [showCreate, setShowCreate] = useState(false);
  const [editTarget, setEditTarget] = useState<Campaign | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Campaign | null>(null);

  const [form, setForm] = useState<CampaignFormData>(EMPTY_FORM);
  const [actionLoading, setActionLoading] = useState(false);

  // ── Fetch ─────────────────────────────────────────
  const fetchCampaigns = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${BASE_URL}/campaigns`, {
        headers: { Authorization: `Bearer ${getToken()}` },
      });
      const data = await res.json();
      if (data.success) {
        setCampaigns(data.campaigns);
      } else {
        setError(data.message || "Failed to load campaigns");
      }
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCampaigns();
  }, []);

  // ── Create ───────────────────────────────────────
  const handleCreateCampaign = async () => {
    if (!form.title.trim() || !form.target_amount || !form.end_date) return;
    try {
      setActionLoading(true);
      const res = await fetch(`${BASE_URL}/campaigns`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${getToken()}`,
        },
        body: JSON.stringify({
          title: form.title.trim(),
          description: form.description.trim(),
          target_amount: Number(form.target_amount),
          end_date: form.end_date,
        }),
      });
      const data = await res.json();
      if (data.success) {
        const target = Number(form.target_amount);
        const newCampaign: Campaign = {
          campaign_id: data.campaign_id,
          title: form.title.trim(),
          description: form.description.trim(),
          target_amount: target,
          end_date: form.end_date,
          amount_raised: 0,
          status:
            0 >= target
              ? "completed"
              : new Date(form.end_date) < new Date()
              ? "expired"
              : "active",
        };
        setCampaigns((prev) => [newCampaign, ...prev]);
        setShowCreate(false);
        setForm(EMPTY_FORM);
      } else {
        alert(data.message || "Failed to create campaign");
      }
    } catch {
      alert("Network error.");
    } finally {
      setActionLoading(false);
    }
  };

  // ── Update ───────────────────────────────────────
  const handleUpdateCampaign = async () => {
    if (!editTarget) return;
    try {
      setActionLoading(true);
      const res = await fetch(`${BASE_URL}/campaigns/${editTarget.campaign_id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${getToken()}`,
        },
        body: JSON.stringify({
          title: form.title.trim(),
          description: form.description.trim(),
          target_amount: Number(form.target_amount),
          end_date: form.end_date,
        }),
      });
      const data = await res.json();
      if (data.success) {
        const target = Number(form.target_amount);
        setCampaigns((prev) =>
          prev.map((c) =>
            c.campaign_id === editTarget.campaign_id
              ? {
                  ...c,
                  title: form.title.trim(),
                  description: form.description.trim(),
                  target_amount: target,
                  end_date: form.end_date,
                  status:
                    c.amount_raised >= target
                      ? "completed"
                      : new Date(form.end_date) < new Date()
                      ? "expired"
                      : "active",
                }
              : c
          )
        );
        setEditTarget(null);
      } else {
        alert(data.message || "Failed to update campaign");
      }
    } catch {
      alert("Network error.");
    } finally {
      setActionLoading(false);
    }
  };

  // ── Delete ───────────────────────────────────────
  const handleDeleteCampaign = async () => {
    if (!deleteTarget) return;
    try {
      setActionLoading(true);
      const res = await fetch(`${BASE_URL}/campaigns/${deleteTarget.campaign_id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${getToken()}` },
      });
      const data = await res.json();
      if (data.success) {
        setCampaigns((prev) =>
          prev.filter((c) => c.campaign_id !== deleteTarget.campaign_id)
        );
        setDeleteTarget(null);
      } else {
        alert(data.message || "Failed to delete campaign");
      }
    } catch {
      alert("Network error.");
    } finally {
      setActionLoading(false);
    }
  };

  const closeModal = () => {
    setShowCreate(false);
    setEditTarget(null);
    setForm(EMPTY_FORM);
  };

  // ── Derived ──────────────────────────────────────
  const filtered =
    activeTab === "all"
      ? campaigns
      : campaigns.filter((c) => c.status === activeTab);

  const counts = {
    all: campaigns.length,
    active: campaigns.filter((c) => c.status === "active").length,
    expired: campaigns.filter((c) => c.status === "expired").length,
    completed: campaigns.filter((c) => c.status === "completed").length,
  };

  // ── UI ───────────────────────────────────────────
  return (
    <div className="admin-page">
      {/* ── Header ── */}
      <div className="page-header">
        <div>
          <h1 className="page-title">Campaigns</h1>
          <p className="page-subtitle">Create, manage, and track donation campaigns</p>
        </div>
        <button
          className="add-campaign-btn"
          onClick={() => {
            setForm(EMPTY_FORM);
            setShowCreate(true);
          }}
        >
          {/* plus icon */}
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
            <path d="M7 1v12M1 7h12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
          </svg>
          New Campaign
        </button>
      </div>

      {/* ── Filter Tabs ── */}
      <div className="filter-tabs">
        {(["all", "active", "expired", "completed"] as FilterTab[]).map((tab) => (
          <button
            key={tab}
            className={`filter-tab filter-${tab} ${activeTab === tab ? "active" : ""}`}
            onClick={() => setActiveTab(tab)}
          >
            {tab.charAt(0).toUpperCase() + tab.slice(1)}
            <span className="tab-count">{counts[tab]}</span>
          </button>
        ))}
      </div>

      {/* ── States ── */}
      {loading && <div className="table-empty">Loading campaigns…</div>}
      {error && (
        <div className="table-empty" style={{ color: "var(--color-rejected)" }}>
          {error}
        </div>
      )}

      {/* ── Table ── */}
      {!loading && !error && (
        <div className="table-card">
          <table className="data-table">
            <thead>
              <tr>
                <th>#</th>
                <th>Campaign</th>
                <th>Raised / Target</th>
                <th>End Date</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((c, i) => {
                const pct = progressPct(c.amount_raised, c.target_amount);
                return (
                  <tr key={c.campaign_id}>
                    <td>{i + 1}</td>

                    <td>
                      <div className="campaign-title">{c.title}</div>
                      {c.description && (
                        <div className="campaign-desc">{c.description}</div>
                      )}
                    </td>

                    <td className="amount-cell">
                      <span className="amount">{formatPKR(c.amount_raised)}</span>
                      <span className="amount-of"> / {formatPKR(c.target_amount)}</span>
                      <div className="progress-bar-wrap">
                        <div
                          className="progress-bar-fill"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                      <span className="progress-pct">{pct}%</span>
                    </td>

                    <td>{formatDate(c.end_date)}</td>

                    <td>
                      <span className={`campaign-status-badge campaign-status-${c.status}`}>
                        {c.status.charAt(0).toUpperCase() + c.status.slice(1)}
                      </span>
                    </td>

                    <td>
                      <div className="action-btns">
                        <button
                          className="edit-btn"
                          onClick={() => {
                            setEditTarget(c);
                            setForm({
                              title: c.title,
                              description: c.description,
                              target_amount: String(c.target_amount),
                              end_date: toInputDate(c.end_date),
                            });
                          }}
                        >
                          Edit
                        </button>
                        <button
                          className="delete-btn"
                          onClick={() => setDeleteTarget(c)}
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>

          {filtered.length === 0 && (
            <div className="table-empty">No campaigns found.</div>
          )}
        </div>
      )}

      {/* ── CREATE / EDIT MODAL ── */}
      {(showCreate || editTarget) && (
        <div className="modal-overlay" onClick={closeModal}>
          <div className="modal-box" onClick={(e) => e.stopPropagation()}>
            <div className="modal-title">
              {editTarget ? "Edit Campaign" : "New Campaign"}
            </div>

            <div className="modal-field">
              <label>Title</label>
              <input
                type="text"
                placeholder="e.g. Ramadan Relief Fund"
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
              />
            </div>

            <div className="modal-field">
              <label>Description</label>
              <textarea
                placeholder="Brief description of the campaign…"
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
              />
            </div>

            <div className="modal-field">
              <label>Target Amount (PKR)</label>
              <input
                type="number"
                placeholder="e.g. 500000"
                min={1}
                value={form.target_amount}
                onChange={(e) => setForm({ ...form, target_amount: e.target.value })}
              />
            </div>

            <div className="modal-field">
              <label>End Date</label>
              <input
                type="date"
                value={form.end_date}
                onChange={(e) => setForm({ ...form, end_date: e.target.value })}
              />
            </div>

            <div className="modal-actions">
              <button className="modal-cancel-btn" onClick={closeModal}>
                Cancel
              </button>
              <button
                className="modal-save-btn"
                disabled={
                  actionLoading ||
                  !form.title.trim() ||
                  !form.target_amount ||
                  !form.end_date
                }
                onClick={editTarget ? handleUpdateCampaign : handleCreateCampaign}
              >
                {actionLoading ? "Saving…" : editTarget ? "Save Changes" : "Create Campaign"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── DELETE CONFIRM MODAL ── */}
      {deleteTarget && (
        <div className="modal-overlay" onClick={() => setDeleteTarget(null)}>
          <div className="modal-box" onClick={(e) => e.stopPropagation()}>
            <div className="modal-title">Delete Campaign</div>
            <p className="confirm-text">
              Are you sure you want to delete{" "}
              <strong>{deleteTarget.title}</strong>? This action cannot be undone.
            </p>
            <div className="modal-actions">
              <button
                className="modal-cancel-btn"
                onClick={() => setDeleteTarget(null)}
              >
                Cancel
              </button>
              <button
                className="modal-delete-btn"
                onClick={handleDeleteCampaign}
                disabled={actionLoading}
              >
                {actionLoading ? "Deleting…" : "Yes, Delete"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CampaignsPage;