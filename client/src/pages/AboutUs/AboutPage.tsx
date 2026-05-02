import React, { useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import "./AboutPage.css";

const objectives = [
  "To provide all possible, financial and other help to poor of the society.",
  "To collect the left-over foods from the marriage halls and other sources and to distribute them to needy poor people, Orphan houses, Madrassas and Jails.",
  "To provide necessary items of dowry to the poor girls on their marriage.",
  "To provide financial assistance to the needy persons at the time of their wedding, valimas etc.",
  "To provide financial assistance to widows and orphans.",
];

const AboutPage: React.FC = () => {
  const observerRef = useRef<IntersectionObserver | null>(null);

  useEffect(() => {
    observerRef.current = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("visible");
          }
        });
      },
      { threshold: 0.12 }
    );

    document.querySelectorAll(".reveal").forEach((el) => {
      observerRef.current?.observe(el);
    });

    return () => observerRef.current?.disconnect();
  }, []);

  return (
    <div className="about-root">

      {/* ── NAVBAR (matches HomePage) ── */}
      <header className="awt-nav">
        <Link to="/" className="awt-nav__logo">
          <img src="/logo.png" alt="Alamgir Welfare Trust" className="awt-nav__logo-img" />
          <span className="awt-nav__logo-text">AWT System</span>
        </Link>
        <nav className="awt-nav__links">
          <Link to="/" className="awt-nav__link">Home</Link>
          <Link to="/about" className="awt-nav__link awt-nav__link--active">About</Link>
          <Link to="/contact" className="awt-nav__link">Contact Us</Link>
          <Link to="/create-donation" className="awt-nav__link awt-nav__link--donate">Donate Now</Link>
        </nav>
      </header>

      {/* ── HERO ── */}
      <section className="about-hero">
        <div className="about-hero__bg" aria-hidden="true">
          <div className="about-hero__overlay" />
          <div className="about-hero__circle about-hero__circle--1" />
          <div className="about-hero__circle about-hero__circle--2" />
          <div className="about-hero__circle about-hero__circle--3" />
        </div>
        <div className="about-hero__content">
          <span className="about-hero__eyebrow">Who We Are</span>
          <h1 className="about-hero__title">
            About <span className="about-hero__title--accent">Alamgir</span><br />
            Welfare Trust
          </h1>
          <p className="about-hero__sub">
            Two decades of serving the indigent and underprivileged — built on hope,
            trust, and the belief that small things can matter a lot.
          </p>
        </div>
        <div className="about-hero__scroll-hint" aria-hidden="true">
          <span />
        </div>
      </section>

      {/* ── HISTORY ── */}
      <section className="about-section about-history">
        <div className="about-section__inner">
          <div className="about-history__text reveal">
            <span className="about-label">Our Story</span>
            <h2 className="about-section__title">History of AWT</h2>
            <p>
              It's been two decades since Alamgir Welfare Trust Int'l is serving the indigent
              and underprivileged humanity for the betterment of society. Established by
              <strong> Shaheed Anwer Naseem Chandna</strong>, a renowned businessman who
              reasoned that small things can matter a lot — and that the affluent society
              wasted a lot. If somehow this wastage could be salvaged, it could bring about
              a change in the lives of the needy.
            </p>
            <p>
              To begin with, he focused on the leftover food of wedding receptions, causing
              his staff to collect and distribute it among the poor on a regular basis. The
              experiment proved to be extremely successful.
            </p>
            <p>
              Seeing the poor at close quarters, Mr. Chandna realised that apart from food,
              a major problem was health. In <strong>1994</strong> he founded the Alamgir Trust
              to institutionalise philanthropic work and provide free medicines and medical care
              to the poor. Likeminded people joined the cause — <em>"Log saath aatay gaye, or
                Karwaan Banta Gaya"</em> — and today, with more than
              <strong> 600 Million Rupees</strong>, the Trust helps the poor in almost every
              field of life, with health and education being the most important.
            </p>
          </div>

          <div className="about-history__card reveal">
            <div className="about-history__card-inner">
              <div className="about-history__year">1993</div>
              <p className="about-history__card-label">Founded</p>
              <div className="about-history__divider" />
              <div className="about-history__stat">600M+</div>
              <p className="about-history__card-label">PKR in welfare</p>
              <div className="about-history__divider" />
              <div className="about-history__stat">200K+</div>
              <p className="about-history__card-label">Patients annually</p>
            </div>
          </div>
        </div>
      </section>

      {/* ── VISION / MISSION ── */}
      <section className="about-section about-vm">
        <div className="about-section__inner about-vm__grid">

          <div className="about-vm__card reveal">
            <div className="about-vm__icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                <circle cx="12" cy="12" r="3" />
                <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7z" />
              </svg>
            </div>
            <h3 className="about-vm__title">Vision</h3>
            <p className="about-vm__text">
              Alamgir Welfare Trust has a vision of making Pakistan a great country to
              live in, where every person has means to feed his family, kids have a right
              to education, and every patient has resources to get treatment. The organisation
              endeavours for a society whose key characteristic is patience and tolerance.
            </p>
          </div>

          <div className="about-vm__card reveal">
            <div className="about-vm__icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
              </svg>
            </div>
            <h3 className="about-vm__title">Mission</h3>
            <p className="about-vm__text">
              To provide free Health Care, Educational, Marriage Assistance and Food related
              services to the underprivileged class — reaching those who need it most,
              with dignity and compassion.
            </p>
          </div>

        </div>
      </section>

      {/* ── OBJECTIVES ── */}
      <section className="about-section about-objectives">
        <div className="about-section__inner">
          <div className="about-objectives__header reveal">
            <span className="about-label">What We Stand For</span>
            <h2 className="about-section__title">Our Objectives</h2>
          </div>
          <ul className="about-objectives__list">
            {objectives.map((obj, i) => (
              <li key={i} className="about-objectives__item reveal" style={{ animationDelay: `${i * 0.08}s` }}>
                <span className="about-objectives__dot" aria-hidden="true" />
                <span>{obj}</span>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* ── CHAIRMAN MESSAGE ── */}
      <section className="about-section about-chairman">
        <div className="about-section__inner about-chairman__grid">
          <div className="about-chairman__text reveal">
            <span className="about-label">A Word From Leadership</span>
            <h2 className="about-section__title">Chairman's Message</h2>
            <p>
              Alhamdulillah, it is your trust and confidence which enabled us to serve humanity
              in the most efficient way. We started a long time ago in 1993, with bare hands
              and no resources but we were full of hope and confidence, bestowed upon us by
              Allah the Almighty and the trust of our donors… The rest, as you all know, is history.
            </p>
            <p>
              An organisation started from scratch is now providing free treatment to over two
              hundred thousand patients annually. Thousands of destitute students are being
              educated, hundreds of indigent parents helped to arrange marriage of their
              daughters, people otherwise unable to put two square meals for their kids are
              fed daily. We provide grocery and household items to thousands of families and
              employment opportunities to people seeking work — and the list goes on.
            </p>
            <p className="about-chairman__closing">
              Come close and observe what we are doing — you are welcome to visit any time.
              But keep us blessed with your trust, confidence and cooperation.
              <br /><br />
              <em>May Allah accept our virtuous deeds for the betterment of our people and society. (Ameen.)</em>
            </p>
            <p className="about-chairman__name">— Chohdry Nisar Ahmed, Chairman AWT</p>
          </div>

          <div className="about-chairman__portrait reveal">
            <img
              src="/chairman.jpg"
              alt="Chohdry Nisar Ahmed"
              className="about-chairman__img"
            />
          </div>
        </div>
      </section>

      {/* ── CTA ── */}
      <section className="about-cta">
        <div className="about-cta__inner reveal">
          <h2 className="about-cta__title">Be Part of the Change</h2>
          <p className="about-cta__sub">
            Your donation, however small, changes a life. Join thousands who trust AWT.
          </p>
          <div className="about-cta__btns">
            <Link to="/create-donation" className="awt-btn awt-btn--solid awt-btn--lg">Donate Now</Link>
            <Link to="/contact" className="awt-btn awt-btn--ghost awt-btn--lg">Contact Us</Link>
          </div>
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

export default AboutPage;
