import { useState, FormEvent } from "react";
import "./auth.css";
import { AWTLogo, EmailIcon, LockIcon, SocialButtons } from "./AuthComponents";

interface LoginProps {
  onNavigateToRegister?: () => void;
}

export default function Login({ onNavigateToRegister }: LoginProps) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [isError, setIsError] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage("");

    try {
      const res = await fetch("http://localhost:5000/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();

      if (data.success) {
        localStorage.setItem("token", data.token);
        localStorage.setItem("user", JSON.stringify(data.user));
        setIsError(false);
        setMessage("Login successful!");
      } else {
        setIsError(true);
        setMessage(data.message || "Invalid credentials");
      }
    } catch (error) {
      console.error(error);
      setIsError(true);
      setMessage("Server error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-card">

        <div className="auth-logo-wrap">
          <AWTLogo />
          <span className="auth-logo-text">AWT System</span>
        </div>

        <h1 className="auth-heading">
          Welcome back<br />Sign in to continue
        </h1>

        <form onSubmit={handleLogin} style={{ width: "100%" }}>
          <div className="auth-field-group">
            <div className="auth-input-wrap">
              <span className="auth-input-icon"><EmailIcon /></span>
              <input
                type="email"
                placeholder="E-mail"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="auth-input"
                required
              />
            </div>

            <div className="auth-input-wrap">
              <span className="auth-input-icon"><LockIcon /></span>
              <input
                type="password"
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="auth-input"
                required
              />
            </div>
          </div>

          <p className={`auth-message ${isError ? "auth-message--error" : "auth-message--success"}`}>
            {message}
          </p>

          <button type="submit" className="auth-submit-btn" disabled={loading}>
            {loading ? "Signing in…" : "Sign in"}
          </button>
        </form>

        <div className="auth-divider">
          <div className="auth-divider__line" />
          <span className="auth-divider__text">or</span>
          <div className="auth-divider__line" />
        </div>

        <SocialButtons />

        <p className="auth-footer">
          Don't have an account?{" "}
          <button className="auth-footer__link" onClick={onNavigateToRegister} type="button">
            Sign up
          </button>
        </p>

      </div>
    </div>
  );
}
