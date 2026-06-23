import React, { useEffect, useState } from "react";
import "./Table.css";

// Matches the Users table schema exactly:
// user_id, name, email, phone, role
interface User {
  user_id: number;
  name: string;
  email: string;
  phone: string;
  role: string;
}

const BASE_URL = "https://legal-impart-demise.ngrok-free.dev/api/admin";

const UsersTable: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<number | null>(null);

  const getToken = () => sessionStorage.getItem("token");

  const fetchUsers = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${BASE_URL}/users`, {
        headers: { Authorization: `Bearer ${getToken()}` },
      });
      const data = await res.json();
      if (data.success) {
        setUsers(data.users);
      } else {
        setError(data.message || "Failed to fetch users");
      }
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (userId: number) => {
    setDeletingId(userId);
    try {
      const res = await fetch(`${BASE_URL}/users/${userId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${getToken()}` },
      });
      const data = await res.json();
      if (data.success) {
        setUsers((prev) => prev.filter((u) => u.user_id !== userId));
      } else {
        alert(data.message || "Failed to delete user");
      }
    } catch {
      alert("Network error. Could not delete user.");
    } finally {
      setDeletingId(null);
      setConfirmDelete(null);
    }
  };

  useEffect(() => { fetchUsers(); }, []);

  return (
    <div className="table-page">
      <div className="page-header">
        <div>
          <h1 className="page-title">All Users</h1>
          <p className="page-subtitle">Manage registered users on the platform</p>
        </div>
        <button className="refresh-btn" onClick={fetchUsers} disabled={loading}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <polyline points="23 4 23 10 17 10" />
            <polyline points="1 20 1 14 7 14" />
            <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15" />
          </svg>
          Refresh
        </button>
      </div>

      {loading && (
        <div className="loading-state">
          <div className="spinner" />
          <span>Loading users...</span>
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
        <>
          <div className="stats-chip">
            <span>{users.length} total users</span>
          </div>
          <div className="table-wrapper">
            <table className="data-table">
              <thead>
                <tr>
                  <th>#</th>
                  <th>Name</th>
                  <th>Email</th>
                  <th>Phone</th>
                  <th>Role</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {users.map((user, idx) => (
                  <tr key={user.user_id} className="table-row">
                    <td className="row-num">{idx + 1}</td>
                    <td>
                      <div className="user-cell">
                        <div className="user-avatar">
                          {user.name.charAt(0).toUpperCase()}
                        </div>
                        <span className="user-name">{user.name}</span>
                      </div>
                    </td>
                    <td className="muted">{user.email}</td>
                    <td className="muted">{user.phone || "—"}</td>
                    <td>
                      <span className={`role-badge role-${user.role.toLowerCase()}`}>
                        {user.role}
                      </span>
                    </td>
                    <td>
                      {confirmDelete === user.user_id ? (
                        <div className="confirm-row">
                          <button
                            className="confirm-yes"
                            onClick={() => handleDelete(user.user_id)}
                            disabled={deletingId === user.user_id}
                          >
                            {deletingId === user.user_id ? "Deleting..." : "Confirm"}
                          </button>
                          <button className="confirm-no" onClick={() => setConfirmDelete(null)}>
                            Cancel
                          </button>
                        </div>
                      ) : (
                        <button className="delete-btn" onClick={() => setConfirmDelete(user.user_id)}>
                          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <polyline points="3 6 5 6 21 6" />
                            <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
                            <path d="M10 11v6M14 11v6M9 6V4h6v2" />
                          </svg>
                          Delete
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {users.length === 0 && <div className="empty-state">No users found.</div>}
          </div>
        </>
      )}
    </div>
  );
};

export default UsersTable;
