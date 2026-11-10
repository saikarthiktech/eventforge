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

export default function VendorBookingsPage() {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  async function loadBookings() {
    try {
      const sessionResponse = await fetch("/api/auth/me");
      const sessionData = await sessionResponse.json();

      if (!sessionResponse.ok || !sessionData.authenticated) {
        window.location.href = "/login";
        return;
      }

      if (sessionData.user.role !== "VENDOR") {
        setError("Only vendor accounts can access this page.");
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
      setError("Unable to load booking requests");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadBookings();
  }, []);

  async function updateBooking(bookingId: string, status: string) {
    setMessage("");
    setError("");
    setUpdatingId(bookingId);

    try {
      const response = await fetch(`/api/bookings/${bookingId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ status }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error || "Unable to update booking");
      }

      setMessage(data.message);
      await loadBookings();
    } catch (updateError) {
      setError(
        updateError instanceof Error
          ? updateError.message
          : "Unable to update booking"
      );
    } finally {
      setUpdatingId("");
    }
  }

  async function handleLogout() {
    await fetch("/api/auth/logout", {
      method: "POST",
    });

    window.location.href = "/login";
  }

  if (loading) {
    return (
      <main className="vendor-bookings-page">
        <div className="dashboard-loading">
          Loading booking requests...
        </div>
      </main>
    );
  }

  return (
    <main className="vendor-bookings-page">
      <nav className="topbar">
        <a className="brand" href="/">
          <div className="brand-mark">E</div>

          <div>
            <strong>EventForge</strong>
            <span>Vendor workspace</span>
          </div>
        </a>

        <div className="dashboard-nav-actions">
          <a className="outline-button" href="/vendor-dashboard">
            Availability
          </a>

          <button className="logout-button" onClick={handleLogout}>
            Logout
          </button>
        </div>
      </nav>

      <section className="vendor-bookings-content">
        <div className="dashboard-welcome">
          <div>
            <p className="eyebrow">BOOKING REQUESTS</p>
            <h1>Review your requests.</h1>
            <p>
              Accept or reject organizer requests for your services.
            </p>
          </div>
        </div>

        {message && <p className="form-success">{message}</p>}
        {error && <p className="form-error">{error}</p>}

        {bookings.length === 0 ? (
          <div className="dashboard-empty">
            <h3>No booking requests yet</h3>
            <p>
              New organizer requests will appear here after they book one of
              your available services.
            </p>
          </div>
        ) : (
          <div className="booking-request-list">
            {bookings.map((booking) => (
              <article
                className="booking-request-card"
                key={booking.booking_id}
              >
                <div className="booking-request-main">
                  <span className="event-status">
                    {booking.booking_status}
                  </span>

                  <h2>{booking.event_name}</h2>

                  <p className="booking-service-name">
                    {booking.service_name}
                  </p>

                  <p className="booking-event-details">
                    {booking.event_date} · {booking.start_time} –{" "}
                    {booking.end_time}
                  </p>

                  <p className="booking-price">
                    Agreed price: ₹{booking.agreed_price}
                  </p>
                </div>

                {booking.booking_status === "PENDING" && (
                  <div className="booking-actions">
                    <button
                      className="accept-button"
                      disabled={updatingId === booking.booking_id}
                      onClick={() =>
                        updateBooking(booking.booking_id, "ACCEPTED")
                      }
                    >
                      Accept
                    </button>

                    <button
                      className="reject-button"
                      disabled={updatingId === booking.booking_id}
                      onClick={() =>
                        updateBooking(booking.booking_id, "REJECTED")
                      }
                    >
                      Reject
                    </button>
                  </div>
                )}
              </article>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}
