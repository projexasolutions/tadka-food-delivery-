"use client";

import { useEffect } from "react";

export default function Error({ error, reset }) {
  useEffect(() => { console.error(error); }, [error]);
  return <main className="grid min-h-[calc(100dvh-64px)] place-items-center bg-tadka-bg px-4 py-12">
    <div className="w-full max-w-xl rounded-2xl border border-tadka-line bg-white p-8 text-center shadow-tadka-md">
      <div className="mx-auto grid h-12 w-12 place-items-center rounded-full bg-orange-50 text-lg font-black text-tadka-orange">!</div>
      <span className="mt-5 block text-[10px] font-black uppercase tracking-[.15em] text-tadka-orange">Something went wrong</span>
      <h1 className="mt-2 text-3xl font-black tracking-tight text-tadka-ink">We couldn’t load this page.</h1>
      <p className="mt-3 text-sm leading-6 text-tadka-muted">Please try again. Your account and order data have not been changed by this screen.</p>
      <button className="mt-6 rounded-xl bg-tadka-orange px-5 py-3 text-sm font-black text-white hover:bg-tadka-orange-dark" onClick={() => reset()}>Try again</button>
    </div>
  </main>;
}