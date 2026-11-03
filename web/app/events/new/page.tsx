"use client";

import { FormEvent, useState } from "react";

type EventForm = {
  eventName: string;
  eventType: string;
  eventDate: string;
  startTime: string;
  endTime: string;
  venueCity: string;
  expectedGuests: string;
};

export default function NewEventPage() {
  const [form, setForm] = useState<EventForm>({
    eventName: "",
    eventType: "Conference",
    eventDate: "",
    startTime: "",
    endTime: "",
    venueCity: "Bengaluru",
    expectedGuests: "",
  });

  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  function updateField(field: keyof EventForm, value: string) {
    setForm((current) => ({
      ...current,
      [field]: value,
    }));
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setMessage("");
    setError("");
    setSaving(true);

    try {
      const response = await fetch("/api/events", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          eventName: form.eventName,
          eventType: form.eventType,
          eventDate: form.eventDate,
          startTime: form.startTime,
          endTime: form.endTime,
          venueCity: form.venueCity,
          expectedGuests: Number(form.expectedGuests),
        }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error || "Unable to create event");
      }

      setMessage(
        "Event \"" + data.event.event_name + "\" was created successfully."
      );

      setForm({
        eventName: "",
        eventType: "Conference",
        eventDate: "",
        startTime: "",
        endTime: "",
        venueCity: "Bengaluru",
        expectedGuests: "",
      });
    } catch (submitError) {
      setError(
        submitError instanceof Error
          ? submitError.message
          : "Unable to create event"
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <main className="event-form-page">
      <nav className="topbar">
        <a className="brand" href="/">
          <div className="brand-mark">E</div>
          <div>
            <strong>EventForge</strong>
            <span>Vendor scheduling platform</span>
          </div>
        </a>

        <a className="outline-button" href="/">
          Back to dashboard
        </a>
      </nav>

      <section className="event-form-wrapper">
        <div className="event-form-intro">
          <p className="eyebrow">EVENT SETUP</p>
          <h1>Create your next event.</h1>
          <p>
            Add the event details first. You can coordinate vendors and
            services after the event is created.
          </p>
        </div>

        <form className="event-form-card" onSubmit={handleSubmit}>
          <label>
            Event name
            <input
              required
              type="text"
              value={form.eventName}
              onChange={(event) =>
                updateField("eventName", event.target.value)
              }
              placeholder="Example: Bengaluru Innovation Meetup"
            />
          </label>

          <label>
            Event type
            <select
              value={form.eventType}
              onChange={(event) =>
                updateField("eventType", event.target.value)
              }
            >
              <option value="Conference">Conference</option>
              <option value="Wedding">Wedding</option>
              <option value="Birthday">Birthday</option>
              <option value="Corporate Event">Corporate Event</option>
              <option value="Festival">Festival</option>
              <option value="Other">Other</option>
            </select>
          </label>

          <div className="form-two-columns">
            <label>
              Event date
              <input
                required
                type="date"
                value={form.eventDate}
                onChange={(event) =>
                  updateField("eventDate", event.target.value)
                }
              />
            </label>

            <label>
              Expected guests
              <input
                required
                min="1"
                type="number"
                value={form.expectedGuests}
                onChange={(event) =>
                  updateField("expectedGuests", event.target.value)
                }
                placeholder="120"
              />
            </label>
          </div>

          <div className="form-two-columns">
            <label>
              Start time
              <input
                required
                type="time"
                value={form.startTime}
                onChange={(event) =>
                  updateField("startTime", event.target.value)
                }
              />
            </label>

            <label>
              End time
              <input
                required
                type="time"
                value={form.endTime}
                onChange={(event) =>
                  updateField("endTime", event.target.value)
                }
              />
            </label>
          </div>

          <label>
            Venue city
            <input
              required
              type="text"
              value={form.venueCity}
              onChange={(event) =>
                updateField("venueCity", event.target.value)
              }
              placeholder="Bengaluru"
            />
          </label>

          {message && <p className="form-success">{message}</p>}
          {error && <p className="form-error">{error}</p>}

          <button
            className="primary-button form-submit"
            type="submit"
            disabled={saving}
          >
            {saving ? "Creating event..." : "Create event"}
          </button>
        </form>
      </section>
    </main>
  );
}
