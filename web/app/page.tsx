const features = [
  {
    title: "Smart vendor discovery",
    description:
      "Find approved vendors by category, city, service type, capacity, and price.",
  },
  {
    title: "Conflict-free scheduling",
    description:
      "Prevent overlapping bookings for the same vendor at the database level.",
  },
  {
    title: "Multi-vendor coordination",
    description:
      "Manage catering, audio-visual, photography, decoration, and other services in one event workspace.",
  },
];

const stats = [
  { label: "Active events", value: "12" },
  { label: "Approved vendors", value: "48" },
  { label: "Pending bookings", value: "07" },
  { label: "Estimated budget", value: "₹8.4L" },
];

export default function Home() {
  return (
    <main className="site-shell">
      <nav className="topbar">
        <div className="brand">
          <div className="brand-mark">E</div>
          <div>
            <strong>EventForge</strong>
            <span>Vendor scheduling platform</span>
          </div>
        </div>

        <div className="nav-links">
          <a href="/dashboard">Dashboard</a>
          <a href="#features">Features</a>
          <a href="#workflow">How it works</a>
          <button className="outline-button">Sign in</button>
        </div>
      </nav>

      <section className="hero">
        <div className="hero-copy">
          <p className="eyebrow">SMART EVENT OPERATIONS</p>
          <h1>
            Plan every vendor.
              

            <span>Perfect every detail.</span>
          </h1>
          <p className="hero-text">
            EventForge helps organizers discover vendors, coordinate services,
            and secure conflict-free bookings for multi-vendor events.
          </p>

          <div className="hero-actions">
            <a className="primary-button" href="/events/new">
               Create an event
            </a>

            <a className="secondary-button" href="/vendors">
               Explore vendors
            </a>

          </div>

          <div className="hero-note">
            <span className="status-dot" />
            PostgreSQL + MongoDB connected
          </div>
        </div>

        <div className="hero-card">
          <div className="card-heading">
            <div>
              <p className="card-label">UPCOMING EVENT</p>
              <h2>PES Tech Summit</h2>
            </div>
            <span className="confirmed-badge">Published</span>
          </div>

          <div className="event-meta">
            <span>20 Feb 2027</span>
            <span>Bengaluru</span>
            <span>350 guests</span>
          </div>

          <div className="progress-row">
            <div>
              <span>Vendor coordination</span>
              <strong>72%</strong>
            </div>
            <div className="progress-track">
              <div className="progress-value" />
            </div>
          </div>

          <div className="booking-list">
            <div className="booking-item">
              <span className="booking-icon purple">AV</span>
              <div>
                <strong>Rohan Sound & Light</strong>
                <small>Conference AV Package</small>
              </div>
              <span className="booking-status accepted">Accepted</span>
            </div>

            <div className="booking-item">
              <span className="booking-icon orange">MG</span>
              <div>
                <strong>Maya Gourmet Catering</strong>
                <small>Premium Vegetarian Buffet</small>
              </div>
              <span className="booking-status pending">Pending</span>
            </div>
          </div>
        </div>
      </section>

      <section id="dashboard" className="dashboard-section">
        <div className="section-heading">
          <div>
            <p className="eyebrow">ORGANIZER OVERVIEW</p>
            <h2>Your event workspace</h2>
          </div>
          <button className="small-button">View reports</button>
        </div>

        <div className="stats-grid">
          {stats.map((stat) => (
            <div className="stat-card" key={stat.label}>
              <span>{stat.label}</span>
              <strong>{stat.value}</strong>
            </div>
          ))}
        </div>
      </section>

      <section id="features" className="features-section">
        <div className="section-heading">
          <div>
            <p className="eyebrow">BUILT FOR COMPLEX EVENTS</p>
            <h2>One system for every moving part</h2>
          </div>
        </div>

        <div className="features-grid">
          {features.map((feature, index) => (
            <article className="feature-card" key={feature.title}>
              <div className={`feature-number number-${index + 1}`}>
                0{index + 1}
              </div>
              <h3>{feature.title}</h3>
              <p>{feature.description}</p>
            </article>
          ))}
        </div>
      </section>

      <section id="workflow" className="workflow-section">
        <div>
          <p className="eyebrow">EVENTFORGE WORKFLOW</p>
          <h2>From event brief to confirmed schedule.</h2>
        </div>

        <div className="workflow-steps">
          <span>01 Define your event</span>
          <span>02 Discover vendors</span>
          <span>03 Check availability</span>
          <span>04 Confirm bookings</span>
        </div>
      </section>

      <footer className="footer">
        <span>EventForge © 2026</span>
        <span>DBMS Level 3 Experiential Learning Project</span>
      </footer>
    </main>
  );
}
