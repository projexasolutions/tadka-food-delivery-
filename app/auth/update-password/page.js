"use client";

import Link from "next/link";

export default function UpdatePasswordPage() {
  return <main className="min-h-screen bg-tadka-bg px-4 py-12"><section className="mx-auto max-w-xl rounded-2xl border border-tadka-line bg-white p-8 shadow-tadka-sm">
    <h1 className="text-3xl font-black tracking-tight">Set New Password</h1>
    <p className="mb-4 text-sm text-tadka-muted">This password recovery flow is temporarily unavailable while authentication is being migrated to the Tadka API.</p>
    <p className="mt-5"><Link className="text-sm font-bold text-tadka-green hover:text-tadka-orange" href="/auth">Back to login</Link></p>
  </section></main>;
}
