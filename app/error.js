"use client";

import { useEffect } from "react";

export default function Error({ error, reset }) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <main className="page narrow center">
      <div className="success">!</div>
      <span className="eyebrow">SOMETHING WENT WRONG</span>
      <h1>We couldn’t load this page.</h1>
      <p className="muted">Please try again. Your account and order data have not been changed by this screen.</p>
      <button className="btn primary" onClick={() => reset()}>Try again</button>
    </main>
  );
}
