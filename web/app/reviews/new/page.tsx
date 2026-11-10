"use client";

import { FormEvent, useState } from "react";

export default function NewReviewPage() {
  const [eventId, setEventId] = useState("");
  const [vendorId, setVendorId] = useState(
    "44444444-4444-4444-4444-444444444444"
  );
  const [rating, setRating] = useState("5");
  const [comment, setComment] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setMessage("");
    setError("");
    setSaving(true);

    try {
      const response = await fetch("/api/reviews", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          eventId,
          vendorId,
          rating: Number(rating),
          comment,
        }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error || "Unable to submit review");
      }

      setMessage(data.message);
      setEventId("");
      setRating("5");
      setComment("");
    } catch (reviewError) {
      setError(
        reviewError instanceof Error
          ? reviewError.message
          : "Unable to submit review"
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

  return (
    <main className="review-page">
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

          <button className="logout-button" onClick={handleLogout}>
            Logout
          </button>
        </div>
      </nav>

      <section className="review-content">
        <div className="review-intro">
          <p className="eyebrow">POST-EVENT REVIEW</p>
          <h1>Share your vendor experience.</h1>
          <p>
            Reviews help future organizers choose reliable event partners.
          </p>
        </div>

        <form className="review-card" onSubmit={handleSubmit}>
          <label>
            Event ID
            <input
              required
              value={eventId}
              onChange={(event) => setEventId(event.target.value)}
              placeholder="Paste the event UUID"
            />
          </label>

          <label>
            Vendor ID
            <input
              required
              value={vendorId}
              onChange={(event) => setVendorId(event.target.value)}
            />
          </label>

          <label>
            Rating
            <select
              value={rating}
              onChange={(event) => setRating(event.target.value)}
            >
              <option value="5">5 — Excellent</option>
              <option value="4">4 — Very good</option>
              <option value="3">3 — Good</option>
              <option value="2">2 — Needs improvement</option>
              <option value="1">1 — Poor</option>
            </select>
          </label>

          <label>
            Comment
            <textarea
              required
              rows={5}
              value={comment}
              onChange={(event) => setComment(event.target.value)}
              placeholder="Write your feedback"
            />
          </label>

          {message && <p className="form-success">{message}</p>}
          {error && <p className="form-error">{error}</p>}

          <button
            className="primary-button form-submit"
            type="submit"
            disabled={saving}
          >
            {saving ? "Submitting..." : "Submit review"}
          </button>

          <p className="review-note">
            Reviews require an accepted or completed booking.
          </p>
        </form>
      </section>
    </main>
  );
}
