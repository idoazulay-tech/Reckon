import { Link } from "wouter";
import { useAuth } from "@/contexts/AuthContext";
import { LogoMark } from "@/components/LogoMark";
import { Check } from "lucide-react";

const FEATURES = [
  {
    num: "01",
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/></svg>
    ),
    title: "Paste Any Job URL",
    desc: "Drop a link from LinkedIn, Indeed, or any careers page. Reckon reads it instantly and extracts every requirement.",
  },
  {
    num: "02",
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>
    ),
    title: "AI Match Score",
    desc: "Get a precise 0–100% score showing how well your resume matches the role — backed by Claude's deep reasoning.",
  },
  {
    num: "03",
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 11l3 3L22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/></svg>
    ),
    title: "Missing Skills Pinpointed",
    desc: "Know exactly which skills the employer wants that your resume doesn't show — with explanations of why each matters.",
  },
  {
    num: "04",
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21.2 8.4c.5.38.8.97.8 1.6v10a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V10a2 2 0 0 1 .8-1.6l8-6a2 2 0 0 1 2.4 0l8 6Z"/><path d="m22 10-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 10"/></svg>
    ),
    title: "Personalized Outreach Email",
    desc: "Generates a highly targeted email that speaks directly to the hiring manager's needs — not a generic template.",
  },
  {
    num: "05",
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="18" height="18" x="3" y="3" rx="2"/><path d="M3 9h18M3 15h18M9 3v18M15 3v18"/></svg>
    ),
    title: "Kanban Job Tracker",
    desc: "Track every application from Saved to Offer in one drag-and-drop board. Get nudges when it's time to follow up.",
  },
  {
    num: "06",
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>
    ),
    title: "ATS Risk Analysis",
    desc: "Know your odds of passing automated screening before you apply. Reckon flags formatting and keyword issues ATS systems reject.",
  },
];

export default function Landing() {
  const { user } = useAuth();

  return (
    <>
      <div className="aurora" aria-hidden="true" />
      <div className="grain" aria-hidden="true" />

      <div className="landing">
        {/* Nav */}
        <nav className="land-nav">
          <LogoMark />
          <div className="land-nav-links">
            <a href="#features">Features</a>
            <a href="#pricing">Pricing</a>
          </div>
          <div className="land-nav-cta">
            {user ? (
              <Link href="/dashboard" className="btn btn-primary btn-sm">
                Dashboard
              </Link>
            ) : (
              <>
                <Link href="/login" className="btn btn-ghost btn-sm">Login</Link>
                <Link href="/signup" className="btn btn-primary btn-sm">Get Started</Link>
              </>
            )}
          </div>
        </nav>

        {/* Hero */}
        <div className="hero">
          <div className="hero-pill">
            <span className="dot" />
            AI-Powered Job Search Intelligence
          </div>

          <h1 className="hero-title">
            Stop guessing why<br />you're not getting<br /><em>interviews</em>
          </h1>

          <p className="hero-sub">
            Reckon reads every job posting, compares it to your resume, and tells you exactly what's missing — then writes the perfect outreach email for you.
          </p>

          <div className="hero-cta">
            <Link href="/signup" className="btn btn-primary btn-lg">
              Start Free — No Credit Card
            </Link>
            <a href="#features" className="btn btn-ghost btn-lg">
              See How It Works
            </a>
          </div>
        </div>

        {/* Stats */}
        <div className="stats-row">
          <div>
            <div className="stat-num">78<em>%</em></div>
            <div className="stat-lbl">avg match score improvement after using Reckon</div>
          </div>
          <div>
            <div className="stat-num">3<em>×</em></div>
            <div className="stat-lbl">more interview callbacks reported by users</div>
          </div>
          <div>
            <div className="stat-num">&lt;30<em>s</em></div>
            <div className="stat-lbl">to fully analyze any job posting end to end</div>
          </div>
          <div>
            <div className="stat-num">12<em>k</em></div>
            <div className="stat-lbl">jobs analyzed on the platform this month</div>
          </div>
        </div>

        {/* Features */}
        <section id="features" className="features-section">
          <div className="section-head">
            <span className="kicker">Features</span>
            <div className="h-display" style={{ fontSize: 40 }}>
              Everything you need to<br /><em>land more interviews</em>
            </div>
          </div>

          <div className="feat-grid">
            {FEATURES.map((f, i) => (
              <div key={i} className="feat-card">
                <span className="feat-num">{f.num}</span>
                <div className="feat-ico">{f.icon}</div>
                <div className="feat-title">{f.title}</div>
                <div className="feat-desc">{f.desc}</div>
              </div>
            ))}
          </div>
        </section>

        {/* Pricing */}
        <section id="pricing" className="pricing-section">
          <div className="section-head">
            <span className="kicker">Pricing</span>
            <div className="h-display" style={{ fontSize: 40 }}>
              Simple, transparent<br /><em>pricing</em>
            </div>
          </div>

          <div className="price-grid">
            {/* Free / PAYG */}
            <div className="price-card">
              <div className="price-tag">Pay As You Go</div>
              <div className="price-amt">
                <span className="curr">$</span>
                1
                <span className="per">/ 12 analyses</span>
              </div>
              <div className="price-desc">First 3 analyses always free. Top up when you need more.</div>
              <ul className="price-feat-list">
                {["12 analyses per $1 top-up", "Full AI email generation", "Complete missing skills list", "ATS risk assessment", "No subscription, no lock-in"].map((f, i) => (
                  <li key={i}><Check size={14} /> {f}</li>
                ))}
              </ul>
              <Link href="/signup" className="btn btn-ghost btn-block">
                Start Free
              </Link>
            </div>

            {/* Monthly */}
            <div className="price-card price-card-feat">
              <div className="price-ribbon">Best Value</div>
              <div className="price-tag">Monthly</div>
              <div className="price-amt">
                <span className="curr">$</span>
                19
                <span className="per">/ month</span>
              </div>
              <div className="price-desc">7-day free trial. Cancel any time. Unlimited everything.</div>
              <ul className="price-feat-list">
                {["Unlimited job analyses", "Full AI email generation", "Complete skill gap analysis", "ATS risk assessment", "Priority AI processing"].map((f, i) => (
                  <li key={i}><Check size={14} /> {f}</li>
                ))}
              </ul>
              <Link href="/signup" className="btn btn-primary btn-block">
                Start Free Trial
              </Link>
            </div>
          </div>
        </section>

        {/* Footer */}
        <footer className="land-foot">
          <LogoMark />
          <div className="foot-links">
            <a href="#features">Features</a>
            <a href="#pricing">Pricing</a>
            <Link href="/login">Login</Link>
          </div>
          <div className="foot-meta">© {new Date().getFullYear()} Reckon</div>
        </footer>
      </div>
    </>
  );
}
