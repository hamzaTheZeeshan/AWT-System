import React, { useEffect, useState } from "react";
import "./Table.css";
import "./OrphanagesTable.css";

// Matches getAllOrphanages query:
// SELECT orphanage_id, name, location, contact_info
// FROM Orphanage ORDER BY name
interface Orphanage {
  orphanage_id: number;
  name: string;
  location: string;
  contact_info: string;
}

interface OrphanageFormData {
  name: string;
  location: string;
  contact_info: string;
}

const EMPTY_FORM: OrphanageFormData = {
  name: "",
  location: "",
  contact_info: "",
};

const BASE_URL = "https://awt-system.vercel.app/api/admin";

const OrphanagesTable: React.FC = () => {
  const [orphanages, setOrphanages] = useState<Orphanage[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actioningId, setActioningId] = useState<number | null>(null);

  // Modal state
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editTarget, setEditTarget] = useState<Orphanage | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Orphanage | null>(null);
  const [form, setForm] = useState<OrphanageFormData>(EMPTY_FORM);

  const getToken = () => sessionStorage.getItem("token");

  // ── Fetch ──────────────────────────────────────────────────────────────────
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

  // ── Open modals ────────────────────────────────────────────────────────────
  const openCreate = () => {
    setForm(EMPTY_FORM);
    setShowCreateModal(true);
  };

  const openEdit = (o: Orphanage) => {
    setForm({ name: o.name, location: o.location, contact_info: o.contact_info });
    setEditTarget(o);
  };

  // ── Create ─────────────────────────────────────────────────────────────────
  const handleCreate = async () => {
    if (!form.name.trim() || !form.location.trim()) return;
    try {
      const res = await fetch(`${BASE_URL}/orphanages`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${getToken()}`,
        },
        body: JSON.stringify({
          name:         form.name.trim(),
          location:     form.location.trim(),
          contact_info: form.contact_info.trim(),
        }),
      });
      const data = await res.json();
      if (data.success) {
        const newOrphanage: Orphanage = {
          orphanage_id: data.orphanage_id,
          name:         form.name.trim(),
          location:     form.location.trim(),
          contact_info: form.contact_info.trim(),
        };
        setOrphanages((prev) => [...prev, newOrphanage]);
        setShowCreateModal(false);
        setForm(EMPTY_FORM);
      } else {
        alert(data.message || "Failed to create orphanage");
      }
    } catch {
      alert("Network error.");
    }
  };

  // ── Edit ───────────────────────────────────────────────────────────────────
  const handleEdit = async () => {
    if (!editTarget || !form.name.trim() || !form.location.trim()) return;
    setActioningId(editTarget.orphanage_id);
    try {
      const res = await fetch(`${BASE_URL}/orphanages/${editTarget.orphanage_id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${getToken()}`,
        },
        body: JSON.stringify({
          name:         form.name.trim(),
          location:     form.location.trim(),
          contact_info: form.contact_info.trim(),
        }),
      });
      const data = await res.json();
      if (data.success) {
        setOrphanages((prev) =>
          prev.map((o) =>
            o.orphanage_id === editTarget.orphanage_id
              ? { ...o, name: form.name.trim(), location: form.location.trim(), contact_info: form.contact_info.trim() }
              : o
          )
        );
        setEditTarget(null);
        setForm(EMPTY_FORM);
      } else {
        alert(data.message || "Failed to update orphanage");
      }
    } catch {
      alert("Network error.");
    } finally {
      setActioningId(null);
    }
  };

  // ── Delete ─────────────────────────────────────────────────────────────────
  const handleDelete = async (o: Orphanage) => {
    setActioningId(o.orphanage_id);
    try {
      const res = await fetch(`${BASE_URL}/orphanages/${o.orphanage_id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${getToken()}` },
      });
      const data = await res.json();
      if (data.success) {
        setOrphanages((prev) => prev.filter((x) => x.orphanage_id !== o.orphanage_id));
        setDeleteTarget(null);
      } else {
        alert(data.message || "Failed to delete orphanage");
      }
    } catch {
      alert("Network error.");
    } finally {
      setActioningId(null);
    }
  };

  const setField = (field: keyof OrphanageFormData) =>
    (e: React.ChangeEvent<HTMLInputElement>) =>
      setForm((f) => ({ ...f, [field]: e.target.value }));

  const formValid = form.name.trim() && form.location.trim();

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <div className="table-page">

      {/* Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">Orphanages</h1>
          <p className="page-subtitle">Manage registered orphanages</p>
        </div>
        <button className="add-orphanage-btn" onClick={openCreate}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <line x1="12" y1="5" x2="12" y2="19" />
            <line x1="5" y1="12" x2="19" y2="12" />
          </svg>
          Add Orphanage
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

      {/* Table */}
      {!loading && !error && (
        <div className="table-wrapper">
          <table className="data-table">
            <thead>
              <tr>
                <th>#</th>
                <th>Orphanage</th>
                <th>Location</th>
                <th>Contact</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {orphanages.map((o, idx) => (
                <tr key={o.orphanage_id} className="table-row">
                  <td className="row-num">{idx + 1}</td>

                  {/* Name cell — same user-cell pattern as donations */}
                  <td>
                    <div className="user-cell">
                      <div className="user-avatar">
                        {o.name.charAt(0).toUpperCase()}
                      </div>
                      <div className="user-details">
                        <span className="user-name">{o.name}</span>
                      </div>
                    </div>
                  </td>

                  <td className="muted">{o.location || "—"}</td>
                  <td className="muted">{o.contact_info || "—"}</td>

                  <td>
                    <div className="action-btns">
                      <button
                        className="approve-btn"
                        onClick={() => openEdit(o)}
                        disabled={actioningId === o.orphanage_id}
                      >
                        Edit
                      </button>
                      <button
                        className="reject-btn"
                        onClick={() => setDeleteTarget(o)}
                        disabled={actioningId === o.orphanage_id}
                      >
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {orphanages.length === 0 && (
            <div className="empty-state">No orphanages found.</div>
          )}
        </div>
      )}

      {/* ── Create Modal ── */}
      {showCreateModal && (
        <div className="modal-overlay" onClick={() => setShowCreateModal(false)}>
          <div className="modal-box" onClick={(e) => e.stopPropagation()}>
            <div className="modal-title">Add Orphanage</div>

            <div className="modal-field">
              <label>Orphanage Name</label>
              <input
                type="text"
                value={form.name}
                onChange={setField("name")}
                placeholder="Name of orphanage"
              />
            </div>
            <div className="modal-field">
              <label>Location</label>
              <input
                type="text"
                value={form.location}
                onChange={setField("location")}
                placeholder="City, area or address"
              />
            </div>
            <div className="modal-field">
              <label>Contact Info</label>
              <input
                type="text"
                value={form.contact_info}
                onChange={setField("contact_info")}
                placeholder="Phone or email"
              />
            </div>

            <div className="modal-actions">
              <button className="modal-cancel-btn" onClick={() => setShowCreateModal(false)}>
                Cancel
              </button>
              <button
                className="modal-save-btn"
                disabled={!formValid}
                onClick={handleCreate}
              >
                Add Orphanage
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Edit Modal ── */}
      {editTarget && (
        <div className="modal-overlay" onClick={() => setEditTarget(null)}>
          <div className="modal-box" onClick={(e) => e.stopPropagation()}>
            <div className="modal-title">Edit Orphanage</div>

            <div className="modal-field">
              <label>Orphanage Name</label>
              <input
                type="text"
                value={form.name}
                onChange={setField("name")}
                placeholder="Name of orphanage"
              />
            </div>
            <div className="modal-field">
              <label>Location</label>
              <input
                type="text"
                value={form.location}
                onChange={setField("location")}
                placeholder="City, area or address"
              />
            </div>
            <div className="modal-field">
              <label>Contact Info</label>
              <input
                type="text"
                value={form.contact_info}
                onChange={setField("contact_info")}
                placeholder="Phone or email"
              />
            </div>

            <div className="modal-actions">
              <button className="modal-cancel-btn" onClick={() => setEditTarget(null)}>
                Cancel
              </button>
              <button
                className="modal-save-btn"
                disabled={!formValid || actioningId === editTarget.orphanage_id}
                onClick={handleEdit}
              >
                {actioningId === editTarget.orphanage_id ? "Saving..." : "Save Changes"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Confirm Delete Modal ── */}
      {deleteTarget && (
        <div className="modal-overlay" onClick={() => setDeleteTarget(null)}>
          <div className="modal-box" onClick={(e) => e.stopPropagation()}>
            <div className="modal-title">Delete Orphanage</div>
            <p className="confirm-text">
              Are you sure you want to delete{" "}
              <strong>&ldquo;{deleteTarget.name}&rdquo;</strong>? This cannot be
              undone. Orphanages with existing distributions cannot be deleted.
            </p>
            <div className="modal-actions">
              <button className="modal-cancel-btn" onClick={() => setDeleteTarget(null)}>
                Cancel
              </button>
              <button
                className="modal-delete-btn"
                disabled={actioningId === deleteTarget.orphanage_id}
                onClick={() => handleDelete(deleteTarget)}
              >
                {actioningId === deleteTarget.orphanage_id ? "Deleting..." : "Delete"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default OrphanagesTable;
