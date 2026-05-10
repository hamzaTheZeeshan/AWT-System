import React, { useEffect, useState } from "react";
import "./InternManager.css";

interface Intern {
  intern_id: number;
  user_id: number | null;
  name: string;
  role: string;
  assigned_task: string;
  end_date: string;
  status: string;
}

interface InternForm {
  name: string;
  role: string;
  assigned_task: string;
  end_date: string;
  user_id: string;
}

const BASE_URL = "http://localhost:5000/api";
const EMPTY_FORM: InternForm = { name: "", role: "", assigned_task: "", end_date: "", user_id: "" };

const getToken = () => sessionStorage.getItem("token");
const getInitials = (name?: string | null) => {
  if (!name) return "NA";

  return name
    .split(" ")
    .slice(0, 2)
    .map((w) => w[0])
    .join("")
    .toUpperCase();
};
const formatDate = (iso: string) => {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("en-PK", { day: "2-digit", month: "short", year: "numeric" });
};
const daysLeft = (end: string) => Math.ceil((new Date(end).getTime() - Date.now()) / (1000 * 60 * 60 * 24));

const InternManager: React.FC = () => {
  const [interns, setInterns] = useState<Intern[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [modalMode, setModalMode] = useState<"create" | "edit" | null>(null);
  const [editTarget, setEditTarget] = useState<Intern | null>(null);
  const [form, setForm] = useState<InternForm>(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Intern | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [search, setSearch] = useState("");

  const fetchInterns = async () => {
    setLoading(true); setError(null);
    try {
      const res = await fetch(`${BASE_URL}/admin/interns`, { headers: { Authorization: `Bearer ${getToken()}` } });
      const data = await res.json();
      if (data.success) {
        setInterns(data.interns);
      } else {
        setError(data.message || "Failed to fetch interns");
      }
    } catch { setError("Network error. Please try again."); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchInterns(); }, []);

  const openCreate = () => { setForm(EMPTY_FORM); setFormError(null); setEditTarget(null); setModalMode("create"); };
  const openEdit = (intern: Intern) => {
    setForm({ name: intern.name, role: intern.role, assigned_task: intern.assigned_task, end_date: intern.end_date?.split("T")[0] ?? "", user_id: intern.user_id != null ? String(intern.user_id) : "" });
    setFormError(null); setEditTarget(intern); setModalMode("edit");
  };
  const closeModal = () => { if (saving) return; setModalMode(null); setEditTarget(null); };
  const handleInput = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));

  const handleCreate = async () => {
    if (!form.name || !form.role || !form.assigned_task || !form.end_date) { setFormError("All fields except User ID are required."); return; }
    setSaving(true); setFormError(null);
    try {
      const res = await fetch(`${BASE_URL}/admin/interns`, { method: "POST", headers: { "Content-Type": "application/json", Authorization: `Bearer ${getToken()}` }, body: JSON.stringify({ name: form.name, role: form.role, assigned_task: form.assigned_task, end_date: form.end_date, user_id: form.user_id ? Number(form.user_id) : null }) });
      const data = await res.json();
      // FIX: replaced ternary expression with if/else (no-unused-expressions)
      if (data.success) {
        setModalMode(null);
        fetchInterns();
      } else {
        setFormError(data.message || "Failed to create intern");
      }
    } catch { setFormError("Network error."); }
    finally { setSaving(false); }
  };

  const handleUpdate = async () => {
    if (!editTarget) return;
    if (!form.name || !form.role || !form.assigned_task || !form.end_date) { setFormError("All fields are required."); return; }
    setSaving(true); setFormError(null);
    try {
      const res = await fetch(`${BASE_URL}/admin/interns/${editTarget.intern_id}`, { method: "PUT", headers: { "Content-Type": "application/json", Authorization: `Bearer ${getToken()}` }, body: JSON.stringify({ name: form.name, role: form.role, assigned_task: form.assigned_task, end_date: form.end_date }) });
      const data = await res.json();
      // FIX: replaced ternary expression with if/else (no-unused-expressions)
      if (data.success) {
        setModalMode(null);
        fetchInterns();
      } else {
        setFormError(data.message || "Failed to update intern");
      }
    } catch { setFormError("Network error."); }
    finally { setSaving(false); }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      const res = await fetch(`${BASE_URL}/admin/interns/${deleteTarget.intern_id}`, { method: "DELETE", headers: { Authorization: `Bearer ${getToken()}` } });
      const data = await res.json();
      // FIX: replaced ternary expression with if/else (no-unused-expressions)
      if (data.success) {
        setDeleteTarget(null);
        fetchInterns();
      } else {
        alert(data.message || "Failed to delete intern");
      }
    } catch { alert("Network error."); }
    finally { setDeleting(false); }
  };

  const filtered = interns.filter((i) => {
    const name = i.name?.toLowerCase() || "";
    const role = i.role?.toLowerCase() || "";
    const task = i.assigned_task?.toLowerCase() || "";
    const query = search.toLowerCase();

    return (
      name.includes(query) ||
      role.includes(query) ||
      task.includes(query)
    );
  });
  const total = interns.length;
  const active = interns.filter((i) => daysLeft(i.end_date) > 0).length;
  const expiring = interns.filter((i) => daysLeft(i.end_date) > 0 && daysLeft(i.end_date) <= 14).length;

  return (
    <div className="im-wrapper">
      <div className="im-header">
        <div className="im-header-icon">IM</div>
        <div>
          <p className="im-header-label">Admin Panel</p>
          <h1 className="im-header-title">Intern Manager</h1>
          <p className="im-header-sub">Manage your internship programme</p>
        </div>
        <div className="im-header-actions">
          <button className="im-refresh-btn" onClick={fetchInterns} disabled={loading} title="Refresh">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="16" height="16">
              <polyline points="23 4 23 10 17 10" /><polyline points="1 20 1 14 7 14" />
              <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15" />
            </svg>
          </button>
          <button className="im-add-btn" onClick={openCreate}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" width="16" height="16">
              <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
            </svg>
            Add Intern
          </button>
        </div>
      </div>

      <div className="im-stats">
        <div className="im-stat-card"><span className="im-stat-value">{total}</span><span className="im-stat-label">Total Interns</span></div>
        <div className="im-stat-card im-stat-active"><span className="im-stat-value">{active}</span><span className="im-stat-label">Active</span></div>
        <div className="im-stat-card im-stat-expiring"><span className="im-stat-value">{expiring}</span><span className="im-stat-label">Expiring Soon</span></div>
        <div className="im-stat-card"><span className="im-stat-value">{total - active}</span><span className="im-stat-label">Completed</span></div>
      </div>

      <div className="im-search-wrap">
        <svg className="im-search-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="16" height="16">
          <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
        </svg>
        <input className="im-search" type="text" placeholder="Search by name, role, or task…" value={search} onChange={(e) => setSearch(e.target.value)} />
      </div>

      {loading && <div className="im-loading"><div className="im-spinner" /><span>Loading interns…</span></div>}
      {error && <div className="im-error"><span>⚠️</span>{error}<button className="im-add-btn" onClick={fetchInterns}>Retry</button></div>}

      {!loading && !error && (
        filtered.length === 0 ? (
          <div className="im-empty">
            <div className="im-empty-icon">🎓</div>
            <p>{search ? "No interns match your search." : "No interns found."}</p>
            <small>Add your first intern to get started.</small>
          </div>
        ) : (
          <div className="im-table-wrap">
            <table className="im-table">
              <thead>
                <tr><th>#</th><th>Intern</th><th>Role</th><th>Assigned Task</th><th>End Date</th><th>Status</th><th>Actions</th></tr>
              </thead>
              <tbody>
                {filtered.map((intern, idx) => {
                  const dl = daysLeft(intern.end_date);
                  const isExpired = dl <= 0;
                  const isExpiring = dl > 0 && dl <= 14;
                  return (
                    <tr key={intern.intern_id}>
                      <td className="im-td-num">{idx + 1}</td>
                      <td>
                        <div className="im-name-cell">
                          <div className="im-avatar">{getInitials(intern.name)}</div>
                          <div><div className="im-name">{intern.name}</div>{intern.user_id && <div className="im-uid">UID #{intern.user_id}</div>}</div>
                        </div>
                      </td>
                      <td><span className="im-role-chip">{intern.role}</span></td>
                      <td className="im-task">{intern.assigned_task}</td>
                      <td>
                        <div className="im-date">{formatDate(intern.end_date)}</div>
                        {!isExpired && <div className={`im-days ${isExpiring ? "im-days-warn" : ""}`}>{dl}d left</div>}
                      </td>
                      <td><span className={`im-badge ${isExpired ? "im-badge-completed" : "im-badge-approved"}`}>{isExpired ? "Completed" : "Active"}</span></td>
                      <td>
                        <div className="im-actions">
                          <button className="im-edit-btn" onClick={() => openEdit(intern)}>
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="14" height="14"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" /><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" /></svg>
                            Edit
                          </button>
                          <button className="im-delete-btn" onClick={() => setDeleteTarget(intern)}>
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="14" height="14"><polyline points="3 6 5 6 21 6" /><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" /><path d="M10 11v6M14 11v6" /><path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" /></svg>
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )
      )}

      {modalMode && (
        <div className="im-overlay" onClick={closeModal}>
          <div className="im-modal" onClick={(e) => e.stopPropagation()}>
            <div className="im-modal-header">
              <h2 className="im-modal-title">{modalMode === "create" ? "Add New Intern" : "Edit Intern"}</h2>
              <button className="im-modal-close" onClick={closeModal} disabled={saving}>✕</button>
            </div>
            <div className="im-modal-body">
              <div className="im-field"><label>Full Name *</label><input name="name" value={form.name} onChange={handleInput} placeholder="e.g. Ayesha Khan" disabled={saving} /></div>
              <div className="im-field"><label>Role *</label><input name="role" value={form.role} onChange={handleInput} placeholder="e.g. Frontend Developer" disabled={saving} /></div>
              <div className="im-field im-field-full"><label>Assigned Task *</label><textarea name="assigned_task" value={form.assigned_task} onChange={handleInput} placeholder="Describe the task assigned to this intern…" rows={3} disabled={saving} /></div>
              <div className="im-field"><label>End Date *</label><input type="date" name="end_date" value={form.end_date} onChange={handleInput} disabled={saving} /></div>
              {modalMode === "create" && <div className="im-field"><label>User ID <span className="im-optional">(optional)</span></label><input type="number" name="user_id" value={form.user_id} onChange={handleInput} placeholder="Link to existing user" disabled={saving} /></div>}
            </div>
            {formError && <div className="im-form-error">⚠ {formError}</div>}
            <div className="im-modal-footer">
              <button className="im-cancel-btn" onClick={closeModal} disabled={saving}>Cancel</button>
              <button className="im-save-btn" onClick={modalMode === "create" ? handleCreate : handleUpdate} disabled={saving}>{saving ? "Saving…" : modalMode === "create" ? "Create Intern" : "Save Changes"}</button>
            </div>
          </div>
        </div>
      )}

      {deleteTarget && (
        <div className="im-overlay" onClick={() => { if (!deleting) setDeleteTarget(null); }}>
          <div className="im-modal im-modal-sm" onClick={(e) => e.stopPropagation()}>
            <div className="im-delete-icon">🗑️</div>
            <h2 className="im-modal-title" style={{ textAlign: "center" }}>Delete Intern?</h2>
            <p className="im-delete-msg">Are you sure you want to remove <strong>{deleteTarget.name}</strong> from the system? This action cannot be undone.</p>
            <div className="im-modal-footer" style={{ justifyContent: "center" }}>
              <button className="im-cancel-btn" onClick={() => setDeleteTarget(null)} disabled={deleting}>Cancel</button>
              <button className="im-del-confirm-btn" onClick={handleDelete} disabled={deleting}>{deleting ? "Deleting…" : "Yes, Delete"}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default InternManager;