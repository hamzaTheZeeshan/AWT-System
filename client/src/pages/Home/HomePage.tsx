import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import "./HomePage.css";
import DonationCharts from "../Donation/DonationCharts";
import MyDonations from "../Donation/MyDonations";

const HomePage: React.FC = () => {
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [userName, setUserName] = useState<string | null>(null);
  const navigate = useNavigate();
  const [userRole, setUserRole] = useState<string | null>(null);

  // Read auth state on mount
  useEffect(() => {
    const token = sessionStorage.getItem("token");
    const userRaw = sessionStorage.getItem("user");
    if (token && userRaw) {
      try {
        const user = JSON.parse(userRaw);
        if (user?.name) setUserName(user.name);
      } catch {
        // malformed JSON — treat as logged out
      }
    }
  }, []);

  // Scroll shadow
  useEffect(() => {
    const token = sessionStorage.getItem("token");
    const userRaw = sessionStorage.getItem("user");
    if (token && userRaw) {
      try {
        const user = JSON.parse(userRaw);
        if (user?.name) setUserName(user.name);
        if (user?.role) setUserRole(user.role);  // ← add this line
      } catch {
        // malformed JSON — treat as logged out
      }
    }
  }, []);

  const handleLogout = () => {
    sessionStorage.removeItem("token");
    sessionStorage.removeItem("user");
    setUserName(null);
    navigate("/");
  };

  return (
    <div className="awt-root">

      {/* ── NAVBAR ── */}
      <header className={`awt-nav ${scrolled ? "awt-nav--scrolled" : ""}`}>

        {/* Logo */}
        <Link to="/" className="awt-nav__logo">
          <img src="/logo.png" alt="Alamgir Welfare Trust" className="awt-nav__logo-img" />
          <span className="awt-nav__logo-text">AWT System</span>
        </Link>

        {/* Nav links */}


        <nav className={`awt-nav__links ${menuOpen ? "awt-nav__links--open" : ""}`}>
          <Link to="/" className="awt-nav__link awt-nav__link--active">
            Home
          </Link>

          <Link to="/about" className="awt-nav__link">
            About
          </Link>

          <Link to="/services" className="awt-nav__link">
            Services
          </Link>

          <Link to="/contact" className="awt-nav__link">
            Contact Us
          </Link>

          {userRole === "admin" && (
            <Link to="/admin" className="awt-nav__link awt-nav__link--admin">
              Admin Control
            </Link>
          )}

          <Link to="/create-donation" className="awt-nav__link awt-nav__link--donate">
            Donate Now
          </Link>
        </nav>
        {/* Auth area */}
        <div className="awt-nav__auth">
          {userName ? (
            // ── Logged in ──
            <>
              <span className="awt-nav__welcome">
                Welcome, <strong>{userName}</strong>
              </span>
              <button
                className="awt-btn awt-btn--outline"
                onClick={handleLogout}
              >
                Log Out
              </button>
            </>
          ) : (
            // ── Logged out ──
            <>
              <Link to="/signin" className="awt-btn awt-btn--outline">Sign In</Link>
              <Link to="/signup" className="awt-btn awt-btn--solid">Sign Up</Link>
            </>
          )}
        </div>

        {/* Hamburger */}
        <button
          className={`awt-nav__hamburger ${menuOpen ? "open" : ""}`}
          onClick={() => setMenuOpen(!menuOpen)}
          aria-label="Toggle menu"
        >
          <span /><span /><span />
        </button>
      </header>

      {/* ── HERO BANNER ── */}
      <section className="awt-hero" id="home">
        <div className="awt-hero__bg" aria-hidden="true">
          <div className="awt-hero__overlay" />
          <div className="awt-hero__circle awt-hero__circle--1" />
          <div className="awt-hero__circle awt-hero__circle--2" />
        </div>

        <div className="awt-hero__content">
          <span className="awt-hero__eyebrow">Alamgir Welfare Trust</span>
          <h1 className="awt-hero__title">
            Serving Humanity,<br />
            <span className="awt-hero__title--accent">One Life at a Time</span>
          </h1>
          <p className="awt-hero__sub">
            Join us in making a difference through welfare, medical aid,
            clean water, education and food programmes across Pakistan.
          </p>
          <div className="awt-hero__cta">
            <Link to="/create-donation" className="awt-btn awt-btn--solid awt-btn--lg">Donate Now</Link>
            <Link to="/about" className="awt-btn awt-btn--solid awt-btn--lg">Learn More</Link>
          </div>
        </div>

        {/* Stat pills */}
        <div className="awt-hero__stats">
          {[
            { value: "50K+", label: "Lives Impacted" },
            { value: "12+", label: "Years of Service" },
            { value: "6", label: "Core Programmes" },
          ].map((s) => (
            <div key={s.label} className="awt-stat-pill">
              <span className="awt-stat-pill__value">{s.value}</span>
              <span className="awt-stat-pill__label">{s.label}</span>
            </div>
          ))}
        </div>
      </section>

      {/* ── HOW WE SERVE ── */}
      <section className="awt-serve" id="services">
        <h2 className="awt-section-title">How We Serve the Community</h2>
        <div className="awt-serve__grid">
          {[
            { icon: "❤️", label: "Welfare" },
            { icon: "🩺", label: "Medical" },
            { icon: "📱", label: "Online Donation" },
            { icon: "💧", label: "Clean Water" },
            { icon: "🎓", label: "Education" },
            { icon: "🍽️", label: "Food" },
          ].map((item) => (
            <div key={item.label} className="awt-serve__card">
              <div className="awt-serve__icon-wrap">
                <span className="awt-serve__icon">{item.icon}</span>
              </div>
              <p className="awt-serve__label">{item.label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── HOW CAN YOU HELP ── */}
      <section className="awt-help">
        <h2 className="awt-section-title">How Can You Help?</h2>
        <div className="awt-help__grid">
          {[
            {
              icon: "🔔",
              title: "Spread The Word",
              desc: "Help us by sharing information about AWT's services so that others can avail them.",
            },
            {
              icon: "🤝",
              title: "Work With Us",
              desc: "Volunteer at Alamgir Welfare Trust and do your part in serving the society.",
            },
            {
              icon: "💵",
              title: "Donate",
              desc: "Donate to Alamgir Welfare Trust and help us in helping others. Spread joy with a donation.",
            },
          ].map((item) => (
            <div key={item.title} className="awt-help__card">
              <div className="awt-help__icon-circle">
                <span className="awt-help__icon">{item.icon}</span>
              </div>
              <h3 className="awt-help__card-title">{item.title}</h3>
              <p className="awt-help__card-desc">{item.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── DONATION SECTION ── */}
      <section className="awt-donation" id="donation">
        <div className="awt-donation__inner">
          <div className="awt-donation__text">
            <h2 className="awt-donation__title">Make a Donation</h2>
            <p className="awt-donation__sub">
              Your generosity powers our programmes. Every rupee counts.
            </p>
            <Link to="/create-donation" className="awt-btn awt-btn--solid">Donate Now</Link>
          </div>
          <DonationCharts />
          <div className="awt-donation__widget-placeholder">
            <MyDonations />
          </div>
        </div>
      </section>

      {/* ── CONTACT TEASER ── */}
      <section className="awt-contact-teaser" id="contact">
        <h2 className="awt-section-title awt-section-title--light">Get in Touch</h2>
        <p className="awt-contact-teaser__sub">
          Have questions? Reach out to us and we'll get back to you.
        </p>
        <Link to="/contact" className="awt-btn awt-btn--solid awt-btn--lg">Contact Us</Link>
      </section>

      {/* ── FOOTER ── */}
      <footer className="awt-footer">
        <div className="awt-footer__inner">
          <div className="awt-footer__brand">
            <img src="/logo.png" alt="AWT" className="awt-footer__logo" />
            <span className="awt-footer__name">AWT System</span>
          </div>
          <p className="awt-footer__copy">
            © {new Date().getFullYear()} Alamgir Welfare Trust. All rights reserved.
          </p>
        </div>
      </footer>

    </div>
  );
};

export default HomePage;