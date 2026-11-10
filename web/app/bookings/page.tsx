"use client";

import { useEffect, useState } from "react";

type Booking = {
  booking_id: string;
  event_id: string;
  service_id: string;
  agreed_price: string;
  booking_status: string;
  booked_at: string;
  event_name: string;
  event_date: string;
  start_time: string;
  end_time: string;
  business_name: string;
  service_name: string;
};

export default function OrganizerBookingsPage() {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadBookings() {
      try {
        const sessionResponse = await fetch("/api/auth/me");
        const sessionData = await sessionResponse.json();

        if (!sessionResponse.ok || !sessionData.authenticated) {
          window.location.href = "/login";
          return;
        }

        if (sessionData.user.role !== "ORGANIZER") {
          setError("Only organizer accounts can access this page.");
          setLoading(false);
          return;
        }

        const response = await fetch("/api/bookings");
        const data = await response.json();

        if (!response.ok || !data.success) {
          throw new Error(data.error || "Unable to load bookings");
        }

        setBookings(data.bookings);
      } catch (loadError) {
        console.error(loadError);

        setError(
          loadError instanceof Error
            ? loadError.message
            : "Unable to load booking history"
        );
      } finally {
        setLoading(false);
      }
    }

    loadBookings();
  }, []);

  async function handleLogout() {
    await fetch("/api/auth/logout", {
      method: "POST",
    });

    window.location.href = "/login";
  }

  function statusClass(status: string) {
    if (status === "ACCEPTED" || status === "COMPLETED") {
      return "booking-status accepted";
    }

    if (status === "REJECTED" || status === "CANCELLED") {
      return "booking-status rejected";
    }

    return "booking-status pending";
  }

  if (loading) {
    return (
      <main className="organizer-bookings-page">
        <div className="dashboard-loading">
          Loading booking history...
        </div>
      </main>
    );
  }

  return (
    <main className="organizer-bookings-page">
      <nav className="topbar">
        <a className="brand" href="/">
          <div className="brand-mark">E</div>

          <div>
            <strong>EventForge</strong>
            <span>Organizer workspace</span>
          </div>
        </a>

        <div className="dashboard-nav-actions">
          <a className="outline-button" href="/dashboard">
            Dashboard
          </a>

          <a className="outline-button" href="/vendors">
            Find vendors
          </a>

          <button className="logout-button" onClick={handleLogout}>
            Logout
          </button>
        </div>
      </nav>

      <section className="organizer-bookings-content">
        <div className="dashboard-welcome">
          <div>
            <p className="eyebrow">ORGANIZER BOOKINGS</p>
            <h1>Track your vendor requests.</h1>
            <p>
              Review the current status of the services requested for your
              events.
            </p>
          </div>

          <a className="primary-button dashboard-create" href="/vendors">
            Find a vendor
          </a>
        </div>

        {error && <p className="form-error">{error}</p>}

        {bookings.length === 0 ? (
          <div className="dashboard-empty">
            <h3>No bookings yet</h3>
            <p>
              Your vendor booking requests will appear here after you submit
              them.
            </p>

            <a className="primary-button" href="/vendors">
              Explore vendors
            </a>
          </div>
        ) : (
          <div className="organizer-booking-list">
            {bookings.map((booking) => (
              <article
                className="organizer-booking-card"
                key={booking.booking_id}
              >
                <div>
                  <span className={statusClass(booking.booking_status)}>
                    {booking.booking_status}
                  </span>

                  <h2>{booking.event_name}</h2>

                  <p className="organizer-booking-service">
                    {booking.service_name}
                  </p>

                  <p className="organizer-booking-vendor">
                    Vendor: {booking.business_name}
                  </p>

                  <p className="organizer-booking-date">
                    {booking.event_date} · {booking.start_time} –{" "}
                    {booking.end_time}
                  </p>
                </div>

                <div className="organizer-booking-price">
                  <span>Agreed price</span>
                  <strong>₹{booking.agreed_price}</strong>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}
