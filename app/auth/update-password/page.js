"use client";

import { useState } from "react";
import Link from "next/link";
import { supabase } from "../../../lib/supabase";

export default function UpdatePasswordPage() {
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  async function updatePassword(e) {
    e.preventDefault();
    setError("");
    setMessage("");

    if (password.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }
    if (password !== confirm) {
      setError("Passwords do not match.");
      return;
    }

    const { error } = await supabase.auth.updateUser({ password });
    if (error) {
      setError(error.message);
      return;
    }

    setMessage("Password updated successfully. You can now log in.");
    setPassword("");
    setConfirm("");
  }

  return (
    <main className="page-shell">
      <section className="card auth-card">
        <h1>Set New Password</h1>
        <p className="muted">Choose a new password for your account.</p>

        <form onSubmit={updatePassword} className="stack">
          <label>
            New password
            <input
              type="password"
              minLength={6}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </label>

          <label>
            Confirm password
            <input
              type="password"
              minLength={6}
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              required
            />
          </label>

          {error && <p className="alert error">{error}</p>}
          {message && <p className="alert success">{message}</p>}

          <button className="button primary" type="submit">
            Update Password
          </button>
        </form>

        <p><Link href="/auth">Back to login</Link></p>
      </section>
    </main>
  );
}
