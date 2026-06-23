import React, { useEffect, useState } from "react";
import "./Table.css";
import "./ReceiversTable.css";

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

interface DistributableDonation {
  donation_id: number;
  donor_name: string;
  type_name: "Money" | "Zakat" | "Sadqah" | "Clothes" | "Books";
  amount: number | null;
  remaining_amount: number | null;
  status: string;
  date: string;
}

type FilterType = "all" | "orphanage" | "general";

const BASE_URL = "https://legal-impart-demise.ngrok-free.dev/api/admin";

const MONEY_TYPES = ["Money", "Zakat", "Sadqah"];

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

  // ── Standard modals ────────────────────────────────────────────────────────
  const [showReceiverModal, setShowReceiverModal] = useState(false);
  const [showOrphanageModal, setShowOrphanageModal] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<Receiver | null>(null);
  const [receiverForm, setReceiverForm] = useState<ReceiverFormData>(EMPTY_RECEIVER);
  const [orphanageForm, setOrphanageForm] = useState<OrphanageFormData>(EMPTY_ORPHANAGE);

  // ── Allocate modal ─────────────────────────────────────────────────────────
  const [allocateTarget, setAllocateTarget] = useState<Receiver | null>(null);
  const [donations, setDonations] = useState<DistributableDonation[]>([]);
  const [donationsLoading, setDonationsLoading] = useState(false);
  const [donationsError, setDonationsError] = useState<string | null>(null);
  const [selectedDonationId, setSelectedDonationId] = useState<number | "">("");
  const [quantity, setQuantity] = useState("");
  const [allocating, setAllocating] = useState(false);

  const getToken = () => sessionStorage.getItem("token");

  // ── Fetch receivers ────────────────────────────────────────────────────────
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

  // ── Open allocate modal + fetch donations ──────────────────────────────────
  const openAllocateModal = async (receiver: Receiver) => {
    setAllocateTarget(receiver);
    setSelectedDonationId("");
    setQuantity("");
    setDonationsError(null);
    setDonationsLoading(true);
    try {
      const res = await fetch(`${BASE_URL}/donations?distributable=1`, {
        headers: { Authorization: `Bearer ${getToken()}` },
      });
      const data = await res.json();
      if (data.success) {
        setDonations(data.donations);
      } else {
        setDonationsError(data.message || "Failed to fetch donations");
      }
    } catch {
      setDonationsError("Network error.");
    } finally {
      setDonationsLoading(false);
    }
  };

  // ── Derived values for selected donation ───────────────────────────────────
  const selectedDonation = donations.find((d) => d.donation_id === selectedDonationId);
  const isMoneyType = MONEY_TYPES.includes(selectedDonation?.type_name ?? "");
  const inputLabel = isMoneyType ? "Amount" : "Quantity";
  const availableQty = selectedDonation
    ? isMoneyType
      ? selectedDonation.remaining_amount
      : selectedDonation.amount
    : null;

  // Auto-fill when donation is selected
  const handleDonationSelect = (id: number | "") => {
    setSelectedDonationId(id);
    if (id === "") { setQuantity(""); return; }
    const donation = donations.find((d) => d.donation_id === id);
    if (!donation) return;
    const isMoney = MONEY_TYPES.includes(donation.type_name);
    const available = isMoney ? donation.remaining_amount : donation.amount;
    setQuantity(available !== null ? String(available) : "");
  };

  // ── Create distribution ────────────────────────────────────────────────────
  const handleAllocate = async () => {
    if (!allocateTarget || selectedDonationId === "") return;
    const qty = parseFloat(quantity);
    if (!qty || qty <= 0) { alert("Please enter a valid value."); return; }

    setAllocating(true);
    try {
      const res = await fetch(`${BASE_URL}/distribution`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${getToken()}`,
        },
        body: JSON.stringify({
          donation_id: selectedDonationId,
          receiver_id: allocateTarget.receiver_id,
          quantity: qty,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setAllocateTarget(null);
        alert(`Distribution #${data.distribution_id} created successfully.`);
      } else {
        alert(data.message || "Failed to create distribution");
      }
    } catch {
      alert("Network error.");
    } finally {
      setAllocating(false);
    }
  };

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
          name:              receiverForm.name.trim(),
          location:          receiverForm.location.trim(),
          contact_info:      receiverForm.contact_info.trim(),
          sufficiency:       receiverForm.sufficiency,
          needs_description: receiverForm.needs_description.trim() || null,
          priority:          receiverForm.priority,
        }),
      });
      const data = await res.json();
      if (data.success) {
        const newReceiver: Receiver = {
          receiver_id:       data.receiver_id,
          name:              receiverForm.name.trim(),
          location:          receiverForm.location.trim(),
          contact_info:      receiverForm.contact_info.trim(),
          sufficiency:       receiverForm.sufficiency,
          needs_description: receiverForm.needs_description.trim() || null,
          priority:          receiverForm.priority,
          is_orphanage:      0,
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
          receiver_id:       data.receiver_id,
          name:              orphanageForm.name.trim(),
          location:          orphanageForm.location.trim(),
          contact_info:      orphanageForm.contact_info.trim(),
          sufficiency:       "not_self_sufficient",
          needs_description: null,
          priority:          null,
          is_orphanage:      1,
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

  // ── Derived ────────────────────────────────────────────────────────────────
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

      {/* ── Loading / Error ── */}
      {loading && (
        <div className="loading-state">
          <div className="spinner" />
          <span>Loading receivers...</span>
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

                  <td>
                    <span className={`type-badge type-badge-${r.is_orphanage ? "orphanage" : "general"}`}>
                      {r.is_orphanage ? "Orphanage" : "General"}
                    </span>
                  </td>

                  <td className="muted">{r.location || "—"}</td>
                  <td className="muted">{r.contact_info || "—"}</td>

                  <td>
                    {r.priority ? (
                      <span className={`status-badge priority-${r.priority}`}>
                        {r.priority.charAt(0).toUpperCase() + r.priority.slice(1)}
                      </span>
                    ) : (
                      <span className="no-action">—</span>
                    )}
                  </td>

                  <td>
                    <span className={`status-badge sufficiency-${r.sufficiency === "self_sufficient" ? "self" : "not"}`}>
                      {r.sufficiency === "self_sufficient" ? "Self-sufficient" : "Needs Support"}
                    </span>
                  </td>

                  <td>
                    <div className="action-btns">
                      <button
                        className="allocate-btn"
                        onClick={() => openAllocateModal(r)}
                      >
                        Allocate
                      </button>
                      <button
                        className="reject-btn"
                        onClick={() => setDeleteTarget(r)}
                        disabled={actioningId === r.receiver_id}
                      >
                        {actioningId === r.receiver_id ? "..." : "Delete"}
                      </button>
                    </div>
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

      {/* ══════════════════════════════════════════════════════════════════════
          Allocate Modal
      ══════════════════════════════════════════════════════════════════════ */}
      {allocateTarget && (
        <div className="modal-overlay" onClick={() => setAllocateTarget(null)}>
          <div className="modal-box" onClick={(e) => e.stopPropagation()}>
            <div className="modal-title">Allocate Donation</div>
            <p className="confirm-text">
              Allocating resources to <strong>{allocateTarget.name}</strong>
            </p>

            {donationsLoading && (
              <div className="loading-state" style={{ padding: "1rem 0" }}>
                <div className="spinner" />
                <span>Loading donations...</span>
              </div>
            )}

            {donationsError && (
              <div className="error-state">{donationsError}</div>
            )}

            {!donationsLoading && !donationsError && (
              <>
                {/* Donation selector */}
                <div className="modal-field">
                  <label>Select Donation</label>
                  <select
                    value={selectedDonationId}
                    onChange={(e) =>
                      handleDonationSelect(
                        e.target.value === "" ? "" : Number(e.target.value)
                      )
                    }
                  >
                    <option value="">— Choose a donation —</option>
                    {donations.map((d) => {
                      const isMoney = MONEY_TYPES.includes(d.type_name);
                      const avail = isMoney ? d.remaining_amount : d.amount;
                      return (
                        <option key={d.donation_id} value={d.donation_id}>
                          #{d.donation_id} · {d.donor_name} · {d.type_name} · {isMoney ? "Remaining" : "Qty"}: {avail ?? 0}
                        </option>
                      );
                    })}
                  </select>
                  {donations.length === 0 && (
                    <p className="field-hint">No distributable donations available.</p>
                  )}
                </div>

                {/* Available hint — only shown once a donation is selected */}
                {selectedDonation && availableQty !== null && (
                  <p className="field-hint">
                    {isMoneyType ? "Remaining amount" : "Available quantity"}:{" "}
                    <strong>{availableQty}</strong>
                  </p>
                )}

                {/* Single input — label and placeholder change based on type */}
                <div className="modal-field">
                  <label>{selectedDonation ? inputLabel : "Amount / Quantity"}</label>
                  <input
                    type="number"
                    min="1"
                    max={availableQty ?? undefined}
                    value={quantity}
                    onChange={(e) => setQuantity(e.target.value)}
                    placeholder={
                      selectedDonation
                        ? `Enter ${inputLabel.toLowerCase()} (max: ${availableQty ?? "—"})`
                        : "Select a donation first"
                    }
                    disabled={selectedDonationId === ""}
                  />
                </div>
              </>
            )}

            <div className="modal-actions">
              <button className="modal-cancel-btn" onClick={() => setAllocateTarget(null)}>
                Cancel
              </button>
              <button
                className="modal-save-btn"
                disabled={
                  allocating ||
                  selectedDonationId === "" ||
                  !quantity ||
                  Number(quantity) <= 0
                }
                onClick={handleAllocate}
              >
                {allocating ? "Allocating..." : "Confirm Allocation"}
              </button>
            </div>
          </div>
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