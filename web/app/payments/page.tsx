"use client";

import { FormEvent, useEffect, useState } from "react";

type Booking = {
  booking_id: string;
  event_name: string;
  service_name: string;
  booking_status: string;
  agreed_price: string;
};

type Payment = {
  payment_id: string;
  booking_id: string;
  event_name: string;
  business_name: string;
  service_name: string;
  amount: string;
  payment_status: string;
  payment_method: string;
  paid_at: string | null;
};

export default function PaymentsPage() {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [selectedBooking, setSelectedBooking] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("UPI");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  async function loadPaymentData() {
    try {
      const sessionResponse = await fetch("/api/auth/me");
      const sessionData = await sessionResponse.json();

      if (!sessionResponse.ok || !sessionData.authenticated) {
        window.location.href = "/login";
        return;
      }

      if (sessionData.user.role !== "ORGANIZER") {
        setError("Only organizers can access payments.");
        setLoading(false);
        return;
      }

      const [bookingResponse, paymentResponse] = await Promise.all([
        fetch("/api/bookings"),
        fetch("/api/payments"),
      ]);

      const bookingData = await bookingResponse.json();
      const paymentData = await paymentResponse.json();

      if (!bookingResponse.ok || !bookingData.success) {
        throw new Error(
          bookingData.error || "Unable to load bookings"
        );
      }

      if (!paymentResponse.ok || !paymentData.success) {
        throw new Error(
          paymentData.error || "Unable to load payments"
        );
      }

      const eligibleBookings = bookingData.bookings.filter(
        (booking: Booking) =>
          booking.booking_status === "PENDING" ||
          booking.booking_status === "ACCEPTED"
      );

      setBookings(eligibleBookings);
      setPayments(paymentData.payments);

      if (eligibleBookings.length > 0) {
        setSelectedBooking(eligibleBookings[0].booking_id);
      }
    } catch (loadError) {
      console.error(loadError);

      setError(
        loadError instanceof Error
          ? loadError.message
          : "Unable to load payment data"
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadPaymentData();
  }, []);

  async function handleCreatePayment(
    event: FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    setMessage("");
    setError("");
    setSaving(true);

    try {
      const response = await fetch("/api/payments", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          bookingId: selectedBooking,
          paymentMethod,
        }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error || "Unable to create payment");
      }

      setMessage(data.message);
      await loadPaymentData();
    } catch (paymentError) {
      setError(
        paymentError instanceof Error
          ? paymentError.message
          : "Unable to create payment"
      );
    } finally {
      setSaving(false);
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
      <main className="payments-page">
        <div className="dashboard-loading">
          Loading payment information...
        </div>
      </main>
    );
  }

  return (
    <main className="payments-page">
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

          <a className="outline-button" href="/bookings">
            My bookings
          </a>

          <button className="logout-button" onClick={handleLogout}>
            Logout
          </button>
        </div>
      </nav>

      <section className="payments-content">
        <div className="dashboard-welcome">
          <div>
            <p className="eyebrow">PAYMENT TRACKING</p>
            <h1>Track event payments.</h1>
            <p>
              Create and review payment records for your vendor bookings.
            </p>
          </div>
        </div>

        {message && <p className="form-success">{message}</p>}
        {error && <p className="form-error">{error}</p>}

        <div className="payments-layout">
          <form
            className="payment-form-card"
            onSubmit={handleCreatePayment}
          >
            <p className="eyebrow">NEW PAYMENT RECORD</p>
            <h2>Record a payment method</h2>

            {bookings.length === 0 ? (
              <div className="dashboard-empty">
                <h3>No eligible bookings</h3>
                <p>
                  A pending or accepted booking is required before creating
                  a payment record.
                </p>
              </div>
            ) : (
              <>
                <label>
                  Booking
                  <select
                    required
                    value={selectedBooking}
                    onChange={(event) =>
                      setSelectedBooking(event.target.value)
                    }
                  >
                    {bookings.map((booking) => (
                      <option
                        value={booking.booking_id}
                        key={booking.booking_id}
                      >
                        {booking.event_name} — {booking.service_name}
                      </option>
                    ))}
                  </select>
                </label>

                <label>
                  Payment method
                  <select
                    value={paymentMethod}
                    onChange={(event) =>
                      setPaymentMethod(event.target.value)
                    }
                  >
                    <option value="UPI">UPI</option>
                    <option value="CARD">Card</option>
                    <option value="BANK_TRANSFER">
                      Bank transfer
                    </option>
                    <option value="CASH">Cash</option>
                  </select>
                </label>

                <button
                  className="primary-button form-submit"
                  type="submit"
                  disabled={saving}
                >
                  {saving
                    ? "Creating payment..."
                    : "Create payment record"}
                </button>
              </>
            )}
          </form>

          <section className="payment-list-card">
            <p className="eyebrow">PAYMENT HISTORY</p>
            <h2>Your payment records</h2>

            {payments.length === 0 ? (
              <div className="dashboard-empty">
                <h3>No payment records yet</h3>
                <p>
                  Payment records will appear here after a booking is
                  created.
                </p>
              </div>
            ) : (
              <div className="payment-list">
                {payments.map((payment) => (
                  <article className="payment-item" key={payment.payment_id}>
                    <div>
                      <span
                        className={`payment-status ${payment.payment_status.toLowerCase()}`}
                      >
                        {payment.payment_status}
                      </span>

                      <h3>{payment.event_name}</h3>

                      <p>
                        {payment.business_name} · {payment.service_name}
                      </p>

                      <span className="payment-method">
                        Method: {payment.payment_method}
                      </span>
                    </div>

                    <strong>₹{payment.amount}</strong>
                  </article>
                ))}
              </div>
            )}
          </section>
        </div>
      </section>
    </main>
  );
}
