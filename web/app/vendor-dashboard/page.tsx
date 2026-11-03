"use client";

import { FormEvent, useEffect, useState } from "react";

type User = {
  fullName: string;
  email: string;
  role: string;
};

type AvailabilitySlot = {
  slot_id: string;
  service_id: string;
  slot_date: string;
  start_time: string;
  end_time: string;
  status: string;
  service_name: string;
  business_name: string;
};

export default function VendorDashboardPage() {
  const [user, setUser] = useState<User | null>(null);
  const [slots, setSlots] = useState<AvailabilitySlot[]>([]);
  const [serviceId, setServiceId] = useState("");
  const [slotDate, setSlotDate] = useState("");
  const [startTime, setStartTime] = useState("09:00");
  const [endTime, setEndTime] = useState("18:00");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  async function loadDashboard() {
    try {
      const sessionResponse = await fetch("/api/auth/me");
      const sessionData = await sessionResponse.json();

      if (!sessionResponse.ok || !sessionData.authenticated) {
        window.location.href = "/login";
        return;
      }

      if (sessionData.user.role !== "VENDOR") {
        setError("Only vendor accounts can access this dashboard.");
        setLoading(false);
        return;
      }

      setUser(sessionData.user);

      const slotsResponse = await fetch("/api/availability");
      const slotsData = await slotsResponse.json();

      if (!slotsResponse.ok || !slotsData.success) {
        throw new Error(slotsData.error || "Unable to load availability");
      }

      setSlots(slotsData.slots);

      if (slotsData.slots.length > 0) {
        setServiceId(slotsData.slots[0].service_id);
      }
    } catch (dashboardError) {
      console.error(dashboardError);
      setError("Unable to load vendor availability");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadDashboard();
  }, []);

  async function handleAddSlot(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setMessage("");
    setError("");
    setSaving(true);

    try {
      const response = await fetch("/api/availability", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          serviceId,
          slotDate,
          startTime,
          endTime,
        }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error || "Unable to create availability");
      }

      setMessage("Availability slot added successfully.");
      setSlotDate("");
      setStartTime("09:00");
      setEndTime("18:00");

      await loadDashboard();
    } catch (slotError) {
      setError(
        slotError instanceof Error
          ? slotError.message
          : "Unable to create availability"
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

  const services = Array.from(
    new Map(
      slots.map((slot) => [
        slot.service_id,
        {
          serviceId: slot.service_id,
          serviceName: slot.service_name,
          businessName: slot.business_name,
        },
      ])
    ).values()
  );

  if (loading) {
    return (
      <main className="vendor-dashboard-page">
        <div className="dashboard-loading">
          Loading vendor dashboard...
        </div>
      </main>
    );
  }

  return (
    <main className="vendor-dashboard-page">
      <nav className="topbar">
        <a className="brand" href="/">
          <div className="brand-mark">E</div>

          <div>
            <strong>EventForge</strong>
            <span>Vendor workspace</span>
          </div>
        </a>

        <div className="dashboard-nav-actions">
          <a className="outline-button" href="/vendors">
            View marketplace
          </a>

          <button className="logout-button" onClick={handleLogout}>
            Logout
          </button>
        </div>
      </nav>

      <section className="vendor-dashboard-content">
        <div className="dashboard-welcome">
          <div>
            <p className="eyebrow">VENDOR DASHBOARD</p>

            <h1>Welcome, {user?.fullName}.</h1>

            <p>
              Manage your service availability so organizers can request
              bookings without schedule conflicts.
            </p>
          </div>
        </div>

        {error && <p className="form-error">{error}</p>}
        {message && <p className="form-success">{message}</p>}

        <div className="vendor-dashboard-grid">
          <form className="availability-card" onSubmit={handleAddSlot}>
            <p className="eyebrow">ADD AVAILABILITY</p>
            <h2>Open a service slot</h2>

            <label>
              Service
              <select
                required
                value={serviceId}
                onChange={(event) => setServiceId(event.target.value)}
              >
                <option value="">Select a service</option>

                {services.map((service) => (
                  <option
                    value={service.serviceId}
                    key={service.serviceId}
                  >
                    {service.serviceName}
                  </option>
                ))}
              </select>
            </label>

            <label>
              Date
              <input
                required
                type="date"
                value={slotDate}
                onChange={(event) => setSlotDate(event.target.value)}
              />
            </label>

            <div className="form-two-columns">
              <label>
                Start time
                <input
                  required
                  type="time"
                  value={startTime}
                  onChange={(event) => setStartTime(event.target.value)}
                />
              </label>

              <label>
                End time
                <input
                  required
                  type="time"
                  value={endTime}
                  onChange={(event) => setEndTime(event.target.value)}
                />
              </label>
            </div>

            <button
              className="primary-button form-submit"
              type="submit"
              disabled={saving || services.length === 0}
            >
              {saving ? "Adding slot..." : "Add availability"}
            </button>

            {services.length === 0 && (
              <p className="form-error">
                No service was found for this vendor account.
              </p>
            )}
          </form>

          <section className="availability-card">
            <p className="eyebrow">CURRENT SCHEDULE</p>
            <h2>Available slots</h2>

            {slots.length === 0 ? (
              <div className="dashboard-empty">
                <h3>No availability yet</h3>
                <p>Add a slot so organizers can request your service.</p>
              </div>
            ) : (
              <div className="availability-list">
                {slots.map((slot) => (
                  <article className="availability-item" key={slot.slot_id}>
                    <div>
                      <strong>{slot.service_name}</strong>
                      <span>{slot.business_name}</span>
                    </div>

                    <div className="availability-time">
                      <strong>{slot.slot_date}</strong>
                      <span>
                        {slot.start_time} – {slot.end_time}
                      </span>
                    </div>

                    <span className="availability-status">
                      {slot.status}
                    </span>
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
