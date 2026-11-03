"use client";

import { FormEvent, useState } from "react";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setError("");
    setMessage("");
    setLoading(true);

    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email,
          password,
        }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error || "Unable to log in");
      }

      setMessage(`Welcome back, ${data.user.fullName}.`);

      setTimeout(() => {
        window.location.href = "/";
      }, 800);
    } catch (loginError) {
      setError(
        loginError instanceof Error
          ? loginError.message
          : "Unable to log in"
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="auth-page">
      <nav className="topbar">
        <a className="brand" href="/">
          <div className="brand-mark">E</div>

          <div>
            <strong>EventForge</strong>
            <span>Vendor scheduling platform</span>
          </div>
        </a>

        <a className="outline-button" href="/vendors">
          Explore vendors
        </a>
      </nav>

      <section className="auth-layout">
        <div className="auth-intro">
          <p className="eyebrow">WELCOME BACK</p>
          <h1>Plan better events with every vendor in view.</h1>
          <p>
            Sign in to manage your event workspace, discover vendors, and
            coordinate event services.
          </p>
        </div>

        <form className="auth-card" onSubmit={handleSubmit}>
          <h2>Sign in to EventForge</h2>

          <label>
            Email address
            <input
              required
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="you@example.com"
            />
          </label>

          <label>
            Password
            <input
              required
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              placeholder="Enter your password"
            />
          </label>

          {message && <p className="form-success">{message}</p>}

          {error && <p className="form-error">{error}</p>}

          <button className="primary-button auth-submit" disabled={loading}>
            {loading ? "Signing in..." : "Sign in"}
          </button>

          <p className="auth-helper">
            Demo account: demo.organizer@example.com
          </p>
        </form>
      </section>
    </main>
  );
}
