"use client";

import { useEffect, useState } from "react";

type User = {
  fullName: string;
  email: string;
  role: string;
};

type EventRecord = {
  event_id: string;
  event_name: string;
  event_type: string;
  event_date: string;
  start_time: string;
  end_time: string;
  venue_city: string;
  expected_guests: number;
  status: string;
};

export default function DashboardPage() {
  const [user, setUser] = useState<User | null>(null);
  const [events, setEvents] = useState<EventRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadDashboard() {
      try {
        const sessionResponse = await fetch("/api/auth/me");
        const sessionData = await sessionResponse.json();

        if (!sessionResponse.ok || !sessionData.authenticated) {
          window.location.href = "/login";
          return;
        }

        setUser(sessionData.user);

        const eventsResponse = await fetch("/api/events");
        const eventsData = await eventsResponse.json();

        if (!eventsResponse.ok || !eventsData.success) {
          throw new Error("Unable to load events");
        }

        setEvents(eventsData.events);
      } catch (dashboardError) {
        console.error(dashboardError);
        setError("Unable to load dashboard data");
      } finally {
        setLoading(false);
      }
    }

    loadDashboard();
  }, []);

  async function handleLogout() {
    await fetch("/api/auth/logout", {
      method: "POST",
    });

    window.location.href = "/login";
  }

  if (loading) {
    return (
      <main className="dashboard-page">
        <div className="dashboard-loading">Loading dashboard...</div>
      </main>
    );
  }

  return (
    <main className="dashboard-page">
      <nav className="topbar">
        <a className="brand" href="/">
          <div className="brand-mark">E</div>

          <div>
            <strong>EventForge</strong>
            <span>Organizer workspace</span>
          </div>
        </a>

        <div className="dashboard-nav-actions">
          <a className="outline-button" href="/vendors">
            Explore vendors
          </a>

          <button className="logout-button" onClick={handleLogout}>
            Logout
          </button>
        </div>
      </nav>

      <section className="dashboard-content">
        <div className="dashboard-welcome">
          <div>
            <p className="eyebrow">ORGANIZER DASHBOARD</p>

            <h1>Welcome, {user?.fullName}.</h1>

            <p>
              Manage your events and coordinate the vendors needed to bring
              them to life.
            </p>
          </div>

          <a className="primary-button dashboard-create" href="/events/new">
            Create an event
          </a>
        </div>

        {error && <p className="form-error">{error}</p>}

        <div className="dashboard-stats">
          <div className="dashboard-stat">
            <span>Total events</span>
            <strong>{events.length}</strong>
          </div>

          <div className="dashboard-stat">
            <span>Upcoming events</span>
            <strong>
              {
                events.filter(
                  (event) =>
                    event.status !== "COMPLETED" &&
                    event.status !== "CANCELLED"
                ).length
              }
            </strong>
          </div>

          <div className="dashboard-stat">
            <span>Account role</span>
            <strong>{user?.role}</strong>
          </div>
        </div>

        <section className="dashboard-events-section">
          <div className="dashboard-section-heading">
            <div>
              <p className="eyebrow">YOUR EVENTS</p>
              <h2>Event workspace</h2>
            </div>

            <a className="small-button" href="/events/new">
              Add event
            </a>
          </div>

          {events.length === 0 ? (
            <div className="dashboard-empty">
              <h3>No events yet</h3>
              <p>Create your first event to begin vendor coordination.</p>
              <a className="primary-button" href="/events/new">
                Create your first event
              </a>
            </div>
          ) : (
            <div className="dashboard-event-list">
              {events.map((event) => (
                <article className="dashboard-event-card" key={event.event_id}>
                  <div>
                    <span className="event-status">{event.status}</span>
                    <h3>{event.event_name}</h3>
                    <p>
                      {event.event_type} · {event.venue_city} ·{" "}
                      {event.expected_guests} guests
                    </p>
                  </div>

                  <div className="dashboard-event-date">
                    <strong>{event.event_date}</strong>
                    <span>
                      {event.start_time} – {event.end_time}
                    </span>
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>
      </section>
    </main>
  );
}
