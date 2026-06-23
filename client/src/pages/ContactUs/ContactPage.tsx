import React, { useState } from "react";
import { Link } from "react-router-dom";
import "./ContactPage.css";

const ContactPage: React.FC = () => {
  const [form, setForm] = useState({ name: "", email: "", phone: "", message: "" });
  const [submitted, setSubmitted] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.MouseEvent) => {
  e.preventDefault();

  if (!form.name || !form.email || !form.message) return;

  try {
    const response = await fetch("https://legal-impart-demise.ngrok-free.dev/api/contact", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        fullName: form.name,
        email: form.email,
        phone: form.phone,
        message: form.message
      })
    });

    const data = await response.json();

    if (response.ok) {
      setSubmitted(true);

      setForm({
        name: "",
        email: "",
        phone: "",
        message: ""
      });
    } else {
      alert(data.error);
    }

  } catch (error) {
    console.log(error);
    alert("Failed to send message");
  }
};

  return (
    <div className="contact-root">

      {/* ── NAVBAR ── */}
      <header className="awt-nav">
        <Link to="/" className="awt-nav__logo">
          <img src="/logo.png" alt="Alamgir Welfare Trust" className="awt-nav__logo-img" />
          <span className="awt-nav__logo-text">AWT System</span>
        </Link>
        <nav className="awt-nav__links">
          <Link to="/"       className="awt-nav__link">Home</Link>
          <Link to="/about"  className="awt-nav__link">About</Link>
          <Link to="/contact" className="awt-nav__link awt-nav__link--active">Contact Us</Link>
          <Link to="/create-donation" className="awt-nav__link awt-nav__link--donate">Donate Now</Link>
        </nav>
      </header>

      {/* ── HERO ── */}
      <section className="contact-hero">
        <div className="contact-hero__bg" aria-hidden="true">
          <div className="contact-hero__overlay" />
          <div className="contact-hero__circle contact-hero__circle--1" />
          <div className="contact-hero__circle contact-hero__circle--2" />
        </div>
        <div className="contact-hero__content">
          <span className="contact-hero__eyebrow">Reach Out</span>
          <h1 className="contact-hero__title">
            Get in <span className="contact-hero__title--accent">Touch</span>
          </h1>
          <p className="contact-hero__sub">
            We'd love to hear from you — whether it's a question, a partnership,
            or simply wanting to know more about how we serve.
          </p>
        </div>
      </section>

      {/* ── MAIN CONTENT ── */}
      <section className="contact-body">
        <div className="contact-body__inner">

          {/* ── LEFT: Offices ── */}
          <div className="contact-offices">

            <div className="contact-office-card">
              <div className="contact-office-card__icon">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                  <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
                  <polyline points="9 22 9 12 15 12 15 22" />
                </svg>
              </div>
              <h3 className="contact-office-card__title">Head Office</h3>
              <ul className="contact-office-card__list">
                <li>
                  <span className="contact-office-card__field-icon">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>
                  </span>
                  <span>Alamgir Masjid, Alamgir Road, Bahadurabad, Karachi</span>
                </li>
                <li>
                  <span className="contact-office-card__field-icon">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 12a19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 3.61 1h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L7.91 8.6a16 16 0 0 0 6 6l.96-.96a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z"/></svg>
                  </span>
                  <span>+92 (21) 111-153-153, +92 (21) 34852055-60 (6 Lines)</span>
                </li>
                <li>
                  <span className="contact-office-card__field-icon">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="2" y="2" width="20" height="20" rx="2"/><path d="M8 10h8M8 14h5"/></svg>
                  </span>
                  <span>Fax: +92 (21) 34929343</span>
                </li>
                <li>
                  <span className="contact-office-card__field-icon">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>
                  </span>
                  <span>info@alamgirwelfaretrust.com.pk</span>
                </li>
              </ul>
            </div>

            <div className="contact-office-card">
              <div className="contact-office-card__icon">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                  <rect x="2" y="7" width="20" height="14" rx="2" />
                  <path d="M16 7V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2" />
                  <line x1="12" y1="12" x2="12" y2="16" />
                  <line x1="10" y1="14" x2="14" y2="14" />
                </svg>
              </div>
              <h3 className="contact-office-card__title">Capital Office</h3>
              <ul className="contact-office-card__list">
                <li>
                  <span className="contact-office-card__field-icon">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>
                  </span>
                  <span>307, Sector G-10/1, Sawan Road, Islamabad</span>
                </li>
                <li>
                  <span className="contact-office-card__field-icon">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 12a19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 3.61 1h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L7.91 8.6a16 16 0 0 0 6 6l.96-.96a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z"/></svg>
                  </span>
                  <span>+92 (51) 111-153-153</span>
                </li>
                <li>
                  <span className="contact-office-card__field-icon">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="2" y="2" width="20" height="20" rx="2"/><path d="M8 10h8M8 14h5"/></svg>
                  </span>
                  <span>Fax: +92 (51) 2354327</span>
                </li>
                <li>
                  <span className="contact-office-card__field-icon">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>
                  </span>
                  <span>info@alamgirwelfaretrust.com.pk</span>
                </li>
              </ul>
            </div>

          </div>

          {/* ── RIGHT: Contact Form ── */}
          <div className="contact-form-wrap">
            <span className="about-label">Send a Message</span>
            <h2 className="contact-form-wrap__title">We're here to help</h2>

            {submitted ? (
              <div className="contact-success">
                <div className="contact-success__icon">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                </div>
                <h3>Message Sent!</h3>
                <p>Thank you for reaching out. We'll get back to you shortly.</p>
              </div>
            ) : (
              <div className="contact-form">
                <div className="contact-form__row">
                  <div className="contact-form__field">
                    <label htmlFor="name">Full Name <span>*</span></label>
                    <input
                      id="name"
                      name="name"
                      type="text"
                      placeholder="Your full name"
                      value={form.name}
                      onChange={handleChange}
                    />
                  </div>
                  <div className="contact-form__field">
                    <label htmlFor="email">Email Address <span>*</span></label>
                    <input
                      id="email"
                      name="email"
                      type="email"
                      placeholder="your@email.com"
                      value={form.email}
                      onChange={handleChange}
                    />
                  </div>
                </div>
                <div className="contact-form__field">
                  <label htmlFor="phone">Phone Number</label>
                  <input
                    id="phone"
                    name="phone"
                    type="tel"
                    placeholder="+92 300 0000000"
                    value={form.phone}
                    onChange={handleChange}
                  />
                </div>
                <div className="contact-form__field">
                  <label htmlFor="message">Message <span>*</span></label>
                  <textarea
                    id="message"
                    name="message"
                    rows={5}
                    placeholder="How can we help you?"
                    value={form.message}
                    onChange={handleChange}
                  />
                </div>
                <button
                  className="contact-form__submit awt-btn awt-btn--solid awt-btn--lg"
                  onClick={handleSubmit}
                  disabled={!form.name || !form.email || !form.message}
                >
                  Send Message
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <line x1="22" y1="2" x2="11" y2="13" />
                    <polygon points="22 2 15 22 11 13 2 9 22 2" />
                  </svg>
                </button>
              </div>
            )}
          </div>

        </div>
      </section>

      {/* ── MAP ── */}
      <section className="contact-map">
        <div className="contact-map__header">
          <span className="about-label">Find Us</span>
          <h2 className="contact-map__title">Our Location — Karachi</h2>
        </div>
        <div className="contact-map__frame">
          <iframe
            title="Alamgir Welfare Trust Location"
            src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3619.7!2d67.0600!3d24.8800!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x3eb33e4b1234abcd%3A0xabc123!2sAlamgir+Welfare+Trust+International!5e0!3m2!1sen!2spk!4v1"
            width="100%"
            height="100%"
            style={{ border: 0 }}
            allowFullScreen
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
          />
        </div>
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

export default ContactPage;
