import { useState, FormEvent } from "react";
import "./auth.css";
import { AWTLogo, EmailIcon, LockIcon, UserIcon, PhoneIcon, SocialButtons } from "./AuthComponents";
import { useNavigate } from "react-router-dom";

interface RegisterForm {
  name: string;
  email: string;
  password: string;
  phone: string;
}

interface RegisterProps {
  onNavigateToLogin?: () => void;
}

export default function Register({ onNavigateToLogin }: RegisterProps) {
  const [form, setForm] = useState<RegisterForm>({
    name: "",
    email: "",
    password: "",
    phone: "",
  });
  const [message, setMessage] = useState("");
  const [isError, setIsError] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const navigate = useNavigate();

  const goToLogin = () => {
    navigate("/signin");
  };

  const handleRegister = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage("");

    try {
      const res = await fetch("https://legal-impart-demise.ngrok-free.dev/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      const data = await res.json();

      if (data.success) {
        setIsError(false);
        setMessage("Account created! Please sign in.");
        setForm({ name: "", email: "", password: "", phone: "" });
      } else {
        setIsError(true);
        setMessage(data.message || "Registration failed");
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
          Register here</h1>

        <form onSubmit={handleRegister} style={{ width: "100%" }}>
          <div className="auth-field-group">
            <div className="auth-input-wrap">
              <span className="auth-input-icon"><UserIcon /></span>
              <input
                type="text"
                name="name"
                placeholder="Full name"
                value={form.name}
                onChange={handleChange}
                className="auth-input"
                required
              />
            </div>

            <div className="auth-input-wrap">
              <span className="auth-input-icon"><EmailIcon /></span>
              <input
                type="email"
                name="email"
                placeholder="E-mail"
                value={form.email}
                onChange={handleChange}
                className="auth-input"
                required
              />
            </div>

            <div className="auth-input-wrap">
              <span className="auth-input-icon"><LockIcon /></span>
              <input
                type="password"
                name="password"
                placeholder="Password"
                value={form.password}
                onChange={handleChange}
                className="auth-input"
                required
              />
            </div>

            <div className="auth-input-wrap">
              <span className="auth-input-icon"><PhoneIcon /></span>
              <input
                type="tel"
                name="phone"
                placeholder="Phone number"
                value={form.phone}
                onChange={handleChange}
                className="auth-input"
                required
              />
            </div>
          </div>

          <p className={`auth-message ${isError ? "auth-message--error" : "auth-message--success"}`}>
            {message}
          </p>

          <button type="submit" className="auth-submit-btn" disabled={loading}>
            {loading ? "Creating account…" : "Sign up"}
          </button>
        </form>

        <div className="auth-divider">
          <div className="auth-divider__line" />
          <span className="auth-divider__text">or</span>
          <div className="auth-divider__line" />
        </div>

        <SocialButtons />

        <p className="auth-footer">
          Already have an account?{" "}
          <button className="auth-footer__link" onClick={goToLogin} type="button">
            Sign in
          </button>
        </p>

      </div>
    </div>
  );
}
