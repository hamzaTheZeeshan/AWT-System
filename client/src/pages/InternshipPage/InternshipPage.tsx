import { useEffect, useState } from "react";
import "./InternshipPage.css";

type Tab = "apply" | "my-applications";
type ApplicationStatus = "pending" | "approved" | "rejected";

interface Application {
  intern_id: number;
  role: string;
  assigned_task: string;
  end_date: string;
  status: ApplicationStatus;
  applied_at: string;
  rejected_reason?: string;
}

const ROLE_OPTIONS = [
  "Frontend Developer",
  "Backend Developer",
  "UI/UX Designer",
  "Data Analyst",
  "Marketing Intern",
  "Content Writer",
  "DevOps Engineer",
  "Mobile Developer",
];

export default function InternshipPage() {
  const [activeTab, setActiveTab] = useState<Tab>("apply");

  // Apply form
  const [role, setRole] = useState("");
  const [assignedTask, setAssignedTask] = useState("");
  const [endDate, setEndDate] = useState("");
  const [loading, setLoading] = useState(false);
  const [feedback, setFeedback] = useState<{
    type: "success" | "error";
    msg: string;
  } | null>(null);

  // My Applications
  const [applications, setApplications] = useState<Application[]>([]);
  const [appsLoading, setAppsLoading] = useState(false);
  const [appsError, setAppsError] = useState<string | null>(null);

  // Fetch applications when tab is opened
  useEffect(() => {
    if (activeTab !== "my-applications") return;

    const fetchApplications = async () => {
      try {
        setAppsLoading(true);
        setAppsError(null);
        const token = sessionStorage.getItem("token");
        const res = await fetch("http://localhost:5000/api/interns/my-applications", {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        if (!res.ok) throw new Error("Failed to fetch applications");
        const data = await res.json();
        setApplications(data.applications || []);
      } catch (err: any) {
        setAppsError(err.message || "Something went wrong");
      } finally {
        setAppsLoading(false);
      }
    };

    fetchApplications();
  }, [activeTab]);



  const handleApply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!role || !assignedTask || !endDate) {
      setFeedback({ type: "error", msg: "Please fill in all required fields." });
      return;
    }
    setLoading(true);
    setFeedback(null);
    try {
      const token = sessionStorage.getItem("token");
      const res = await fetch("http://localhost:5000/api/interns/apply", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          role: role,
          assigned_task: assignedTask,
          end_date: endDate
        }),
      });
      if (!res.ok) throw new Error("Failed to submit application");
      setFeedback({ type: "success", msg: "Application submitted successfully!" });
      setRole("");
      setAssignedTask("");
      setEndDate("");
    } catch (err: any) {
      setFeedback({ type: "error", msg: err.message || "Something went wrong. Please try again." });
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (iso: string) =>
    new Date(iso).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });

  return (
    <div className="page-wrapper">
      <div className="card intern-card">
        {/* ── Header ── */}
        <div className="header">
          <div className="logo">
            <span className="logo-letter">A</span>
          </div>
          <span className="brand-name">AWT System</span>
          <h1 className="heading">
            Internship Program
            <span>Apply or track your applications</span>
          </h1>
        </div>

        {/* ── Tab Bar ── */}
        <div className="tab-bar">
          <button
            className={`tab-btn ${activeTab === "apply" ? "tab-active" : ""}`}
            onClick={() => {
              setActiveTab("apply");
              setFeedback(null);
            }}
          >
            ✦ Apply Now
          </button>
          <button
            className={`tab-btn ${activeTab === "my-applications" ? "tab-active" : ""}`}
            onClick={() => setActiveTab("my-applications")}
          >
            ◈ My Applications
          </button>
        </div>

        {/* ── Apply Tab ── */}
        {activeTab === "apply" && (
          <form className="form" onSubmit={handleApply}>
            {/* Role */}
            <div>
              <p className="field-label">
                Internship Role <span className="required">*</span>
              </p>
              <div className="input-group">
                <span className="input-icon">💼</span>
                <div className="select-wrapper">
                  <select value={role} onChange={(e) => setRole(e.target.value)}>
                    <option value="">Select a role</option>
                    {ROLE_OPTIONS.map((r) => (
                      <option key={r} value={r}>
                        {r}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {/* Assigned Task */}
            <div>
              <p className="field-label">
                Assigned Task <span className="required">*</span>
              </p>
              <div className="input-group input-group--textarea">
                <span className="input-icon textarea-icon">📋</span>
                <textarea
                  className="intern-textarea"
                  placeholder="Describe the task or project you'll work on…"
                  value={assignedTask}
                  onChange={(e) => setAssignedTask(e.target.value)}
                  rows={3}
                />
              </div>
            </div>

            {/* End Date */}
            <div>
              <p className="field-label">
                Expected End Date <span className="required">*</span>
              </p>
              <div className="input-group">
                <span className="input-icon">📅</span>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  min={new Date().toISOString().split("T")[0]}
                />
              </div>
            </div>

            {feedback && (
              <div
                className={`feedback ${feedback.type === "error" ? "error-msg" : "success-msg"
                  }`}
              >
                {feedback.msg}
              </div>
            )}

            <button type="submit" className="submit-btn" disabled={loading}>
              {loading ? "Submitting…" : "Submit Application"}
            </button>
          </form>
        )}

        {/* ── My Applications Tab ── */}
        {activeTab === "my-applications" && (
          <div className="applications-list">
            {appsLoading ? (
              <div className="md-loading">
                <div className="md-spinner" />
                <p>Loading your applications…</p>
              </div>
            ) : appsError ? (
              <div className="md-error">
                <span>⚠️</span>
                <p>{appsError}</p>
              </div>
            ) : applications.length === 0 ? (
              <div className="empty-state">
                <span className="empty-icon">📭</span>
                <p>No applications yet. Apply for an internship to get started.</p>
              </div>
            ) : (
              applications.map((app) => (
                <div key={app.intern_id} className="application-card">
                  <div className="app-card-top">
                    <div className="app-info">
                      <p className="app-role">{app.role}</p>
                      <p className="app-task">{app.assigned_task}</p>
                    </div>
                    <span className={`status-badge status-${app.status}`}>
                      {app.status.charAt(0).toUpperCase() + app.status.slice(1)}
                    </span>
                  </div>
                  <div className="app-card-bottom">
                    <span>📅 Ends {formatDate(app.end_date)}</span>
                    <span>Applied {formatDate(app.applied_at)}</span>
                  </div>
                  {app.status === "rejected" && app.rejected_reason && (
                    <div className="rejection-reason">
                      ⚠ {app.rejected_reason}
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
}