"use client";

import Link from "next/link";

export default function UpdatePasswordPage() {
  return <main className="page-shell"><section className="card auth-card">
    <h1>Set New Password</h1>
    <p className="muted">This password recovery flow is temporarily unavailable while authentication is being migrated to the Tadka API.</p>
    <p><Link href="/auth">Back to login</Link></p>
  </section></main>;
}
