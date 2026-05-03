import React, { useEffect, useState } from "react";
import "./Table.css";
import "./ReceiversTable.css";

// Matches the result of getAllReceivers query:
// SELECT r.receiver_id, r.name, r.location, r.contact_info,
//        r.sufficiency, r.needs_description, r.priority,
//        CASE WHEN o.receiver_id IS NOT NULL THEN 1 ELSE 0 END as is_orphanage
// FROM receiver r
// LEFT JOIN Orphanage o ON r.receiver_id = o.receiver_id
interface Receiver {
  receiver_id: number;
  name: string;
  location: string;
  contact_info: string;
  sufficiency: "self_sufficient" | "not_self_sufficient";
  needs_description: string | null;
  priority: "low" | "medium" | "high" | null;
  is_orphanage: 0 | 1;
}

interface ReceiverFormData {
  name: string;
  location: string;
  contact_info: string;
  sufficiency: "self_sufficient" | "not_self_sufficient";
  needs_description: string;
  priority: "low" | "medium" | "high";
}

interface OrphanageFormData {
  name: string;
  location: string;
  contact_info: string;
}

type FilterType = "all" | "orphanage" | "general";

const BASE_URL = "http://localhost:5000/api/admin";

const EMPTY_RECEIVER: ReceiverFormData = {
  name: "",
  location: "",
  contact_info: "",
  sufficiency: "not_self_sufficient",
  needs_description: "",
  priority: "medium",
};

const EMPTY_ORPHANAGE: OrphanageFormData = {
  name: "",
  location: "",
  contact_info: "",
};

const ReceiversTable: React.FC = () => {
  const [receivers, setReceivers] = useState<Receiver[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<FilterType>("all");
  const [actioningId, setActioningId] = useState<number | null>(null);

  // Modal state
  const [showReceiverModal, setShowReceiverModal] = useState(false);
  const [showOrphanageModal, setShowOrphanageModal] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<Receiver | null>(null);
  const [receiverForm, setReceiverForm] = useState<ReceiverFormData>(EMPTY_RECEIVER);
  const [orphanageForm, setOrphanageForm] = useState<OrphanageFormData>(EMPTY_ORPHANAGE);

  const getToken = () => sessionStorage.getItem("token");

  // ── Fetch ──────────────────────────────────────────────────────────────────
  const fetchReceivers = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${BASE_URL}/receivers`, {
        headers: { Authorization: `Bearer ${getToken()}` },
      });
      const data = await res.json();
      if (data.success) {
        setReceivers(data.receivers);
      } else {
        setError(data.message || "Failed to fetch receivers");
      }
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchReceivers(); }, []);

  // ── Create Receiver ────────────────────────────────────────────────────────
  const handleCreateReceiver = async () => {
    if (!receiverForm.name.trim() || !receiverForm.location.trim()) return;
    try {
      const res = await fetch(`${BASE_URL}/receivers`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${getToken()}`,
        },
        body: JSON.stringify({
          name:             receiverForm.name.trim(),
          location:         receiverForm.location.trim(),
          contact_info:     receiverForm.contact_info.trim(),
          sufficiency:      receiverForm.sufficiency,
          needs_description: receiverForm.needs_description.trim() || null,
          priority:         receiverForm.priority,
        }),
      });
      const data = await res.json();
      if (data.success) {
        const newReceiver: Receiver = {
          receiver_id:      data.receiver_id,
          name:             receiverForm.name.trim(),
          location:         receiverForm.location.trim(),
          contact_info:     receiverForm.contact_info.trim(),
          sufficiency:      receiverForm.sufficiency,
          needs_description: receiverForm.needs_description.trim() || null,
          priority:         receiverForm.priority,
          is_orphanage:     0,
        };
        setReceivers((prev) => [...prev, newReceiver]);
        setShowReceiverModal(false);
        setReceiverForm(EMPTY_RECEIVER);
      } else {
        alert(data.message || "Failed to create receiver");
      }
    } catch {
      alert("Network error.");
    }
  };

  // ── Create Orphanage ───────────────────────────────────────────────────────
  const handleCreateOrphanage = async () => {
    if (!orphanageForm.name.trim() || !orphanageForm.location.trim()) return;
    try {
      const res = await fetch(`${BASE_URL}/orphanages`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${getToken()}`,
        },
        body: JSON.stringify({
          name:         orphanageForm.name.trim(),
          location:     orphanageForm.location.trim(),
          contact_info: orphanageForm.contact_info.trim(),
        }),
      });
      const data = await res.json();
      if (data.success) {
        const newOrphanage: Receiver = {
          receiver_id:      data.receiver_id,
          name:             orphanageForm.name.trim(),
          location:         orphanageForm.location.trim(),
          contact_info:     orphanageForm.contact_info.trim(),
          sufficiency:      "not_self_sufficient",
          needs_description: null,
          priority:         null,
          is_orphanage:     1,
        };
        setReceivers((prev) => [...prev, newOrphanage]);
        setShowOrphanageModal(false);
        setOrphanageForm(EMPTY_ORPHANAGE);
      } else {
        alert(data.message || "Failed to create orphanage");
      }
    } catch {
      alert("Network error.");
    }
  };

  // ── Delete ─────────────────────────────────────────────────────────────────
  const handleDelete = async (receiver: Receiver) => {
    setActioningId(receiver.receiver_id);
    try {
      const res = await fetch(`${BASE_URL}/receivers/${receiver.receiver_id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${getToken()}` },
      });
      const data = await res.json();
      if (data.success) {
        setReceivers((prev) => prev.filter((r) => r.receiver_id !== receiver.receiver_id));
        setDeleteTarget(null);
      } else {
        alert(data.message || "Failed to delete receiver");
      }
    } catch {
      alert("Network error.");
    } finally {
      setActioningId(null);
    }
  };

  // ── Derived data ───────────────────────────────────────────────────────────
  const filtered =
    filter === "all"
      ? receivers
      : filter === "orphanage"
      ? receivers.filter((r) => r.is_orphanage === 1)
      : receivers.filter((r) => r.is_orphanage === 0);

  const counts = {
    all:       receivers.length,
    orphanage: receivers.filter((r) => r.is_orphanage === 1).length,
    general:   receivers.filter((r) => r.is_orphanage === 0).length,
  };

  return (
    <div className="table-page">
      {/* ── Header ── */}
      <div className="page-header">
        <div>
          <h1 className="page-title">Receivers</h1>
          <p className="page-subtitle">Manage donation receivers and orphanages</p>
        </div>
        <div className="header-actions">
          <button
            className="add-orphanage-btn"
            onClick={() => { setShowOrphanageModal(true); setOrphanageForm(EMPTY_ORPHANAGE); }}
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="12" y1="5" x2="12" y2="19" />
              <line x1="5" y1="12" x2="19" y2="12" />
            </svg>
            Add Orphanage
          </button>
          <button
            className="add-receiver-btn"
            onClick={() => { setShowReceiverModal(true); setReceiverForm(EMPTY_RECEIVER); }}
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="12" y1="5" x2="12" y2="19" />
              <line x1="5" y1="12" x2="19" y2="12" />
            </svg>
            Add Receiver
          </button>
        </div>
      </div>

      {/* ── Filter Tabs ── */}
      <div className="filter-tabs">
        {(["all", "orphanage", "general"] as FilterType[]).map((tab) => (
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

      {/* ── Loading ── */}
      {loading && (
        <div className="loading-state">
          <div className="spinner" />
          <span>Loading receivers...</span>
        </div>
      )}

      {/* ── Error ── */}
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

      {/* ── Table ── */}
      {!loading && !error && (
        <div className="table-wrapper">
          <table className="data-table">
            <thead>
              <tr>
                <th>#</th>
                <th>Receiver</th>
                <th>Type</th>
                <th>Location</th>
                <th>Contact</th>
                <th>Priority</th>
                <th>Sufficiency</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((r, idx) => (
                <tr key={r.receiver_id} className="table-row">
                  <td className="row-num">{idx + 1}</td>

                  {/* Receiver name + needs */}
                  <td>
                    <div className="user-cell">
                      <div className="user-avatar">
                        {r.name.charAt(0).toUpperCase()}
                      </div>
                      <div className="user-details">
                        <span className="user-name">{r.name}</span>
                        {r.needs_description && (
                          <span className="user-email" title={r.needs_description}>
                            {r.needs_description}
                          </span>
                        )}
                      </div>
                    </div>
                  </td>

                  {/* Orphanage / General badge */}
                  <td>
                    <span className={`type-badge type-badge-${r.is_orphanage ? "orphanage" : "general"}`}>
                      {r.is_orphanage ? "Orphanage" : "General"}
                    </span>
                  </td>

                  <td className="muted">{r.location || "—"}</td>
                  <td className="muted">{r.contact_info || "—"}</td>

                  {/* Priority badge */}
                  <td>
                    {r.priority ? (
                      <span className={`status-badge priority-${r.priority}`}>
                        {r.priority.charAt(0).toUpperCase() + r.priority.slice(1)}
                      </span>
                    ) : (
                      <span className="no-action">—</span>
                    )}
                  </td>

                  {/* Sufficiency badge */}
                  <td>
                    <span className={`status-badge sufficiency-${r.sufficiency === "self_sufficient" ? "self" : "not"}`}>
                      {r.sufficiency === "self_sufficient" ? "Self-sufficient" : "Needs Support"}
                    </span>
                  </td>

                  {/* Delete */}
                  <td>
                    <button
                      className="reject-btn"
                      onClick={() => setDeleteTarget(r)}
                      disabled={actioningId === r.receiver_id}
                    >
                      {actioningId === r.receiver_id ? "..." : "Delete"}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {filtered.length === 0 && (
            <div className="empty-state">
              No {filter !== "all" ? filter : ""} receivers found.
            </div>
          )}
        </div>
      )}

      {/* ── Add Receiver Modal ── */}
      {showReceiverModal && (
        <div className="modal-overlay" onClick={() => setShowReceiverModal(false)}>
          <div className="modal-box" onClick={(e) => e.stopPropagation()}>
            <div className="modal-title">Add Receiver</div>

            <div className="modal-field">
              <label>Name</label>
              <input
                type="text"
                value={receiverForm.name}
                onChange={(e) => setReceiverForm((f) => ({ ...f, name: e.target.value }))}
                placeholder="Full name or organization"
              />
            </div>
            <div className="modal-field">
              <label>Location</label>
              <input
                type="text"
                value={receiverForm.location}
                onChange={(e) => setReceiverForm((f) => ({ ...f, location: e.target.value }))}
                placeholder="City, area or address"
              />
            </div>
            <div className="modal-field">
              <label>Contact Info</label>
              <input
                type="text"
                value={receiverForm.contact_info}
                onChange={(e) => setReceiverForm((f) => ({ ...f, contact_info: e.target.value }))}
                placeholder="Phone or email"
              />
            </div>
            <div className="modal-field">
              <label>Sufficiency</label>
              <select
                value={receiverForm.sufficiency}
                onChange={(e) =>
                  setReceiverForm((f) => ({
                    ...f,
                    sufficiency: e.target.value as ReceiverFormData["sufficiency"],
                  }))
                }
              >
                <option value="not_self_sufficient">Not Self-sufficient</option>
                <option value="self_sufficient">Self-sufficient</option>
              </select>
            </div>
            <div className="modal-field">
              <label>Priority</label>
              <select
                value={receiverForm.priority}
                onChange={(e) =>
                  setReceiverForm((f) => ({
                    ...f,
                    priority: e.target.value as ReceiverFormData["priority"],
                  }))
                }
              >
                <option value="high">High</option>
                <option value="medium">Medium</option>
                <option value="low">Low</option>
              </select>
            </div>
            <div className="modal-field">
              <label>Needs Description</label>
              <textarea
                value={receiverForm.needs_description}
                onChange={(e) => setReceiverForm((f) => ({ ...f, needs_description: e.target.value }))}
                placeholder="Describe what this receiver needs (optional)"
              />
            </div>

            <div className="modal-actions">
              <button className="modal-cancel-btn" onClick={() => setShowReceiverModal(false)}>
                Cancel
              </button>
              <button
                className="modal-save-btn"
                disabled={!receiverForm.name.trim() || !receiverForm.location.trim()}
                onClick={handleCreateReceiver}
              >
                Add Receiver
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Add Orphanage Modal ── */}
      {showOrphanageModal && (
        <div className="modal-overlay" onClick={() => setShowOrphanageModal(false)}>
          <div className="modal-box" onClick={(e) => e.stopPropagation()}>
            <div className="modal-title">Add Orphanage</div>

            <div className="modal-field">
              <label>Orphanage Name</label>
              <input
                type="text"
                value={orphanageForm.name}
                onChange={(e) => setOrphanageForm((f) => ({ ...f, name: e.target.value }))}
                placeholder="Name of orphanage"
              />
            </div>
            <div className="modal-field">
              <label>Location</label>
              <input
                type="text"
                value={orphanageForm.location}
                onChange={(e) => setOrphanageForm((f) => ({ ...f, location: e.target.value }))}
                placeholder="City, area or address"
              />
            </div>
            <div className="modal-field">
              <label>Contact Info</label>
              <input
                type="text"
                value={orphanageForm.contact_info}
                onChange={(e) => setOrphanageForm((f) => ({ ...f, contact_info: e.target.value }))}
                placeholder="Phone or email"
              />
            </div>

            <div className="modal-actions">
              <button className="modal-cancel-btn" onClick={() => setShowOrphanageModal(false)}>
                Cancel
              </button>
              <button
                className="modal-save-btn"
                disabled={!orphanageForm.name.trim() || !orphanageForm.location.trim()}
                onClick={handleCreateOrphanage}
              >
                Add Orphanage
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Confirm Delete Modal ── */}
      {deleteTarget && (
        <div className="modal-overlay" onClick={() => setDeleteTarget(null)}>
          <div className="modal-box" onClick={(e) => e.stopPropagation()}>
            <div className="modal-title">Delete Receiver</div>
            <p className="confirm-text">
              Are you sure you want to delete{" "}
              <strong>&ldquo;{deleteTarget.name}&rdquo;</strong>? This cannot be
              undone. Receivers with existing distributions cannot be deleted.
            </p>
            <div className="modal-actions">
              <button className="modal-cancel-btn" onClick={() => setDeleteTarget(null)}>
                Cancel
              </button>
              <button
                className="modal-delete-btn"
                disabled={actioningId === deleteTarget.receiver_id}
                onClick={() => handleDelete(deleteTarget)}
              >
                {actioningId === deleteTarget.receiver_id ? "Deleting..." : "Delete"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ReceiversTable;
