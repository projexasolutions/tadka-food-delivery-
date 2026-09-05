"use client";

import { useSearchParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { supabase } from "../../lib/supabase";

export default function PaymentPage() {
  const params = useSearchParams();
  const router = useRouter();
  const [status, setStatus] = useState("processing");
  const [transaction, setTransaction] = useState(null);
  const [error, setError] = useState("");
  const orderId = params.get("order");

  useEffect(() => {
    if (!orderId) { setStatus("missing"); return; }

    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { setStatus("auth"); return; }

      const { data: order, error } = await supabase
        .from("orders")
        .select("id,payment_method,payment_status")
        .eq("id", orderId)
        .eq("user_id", user.id)
        .single();

      if (error || !order) { setStatus("invalid"); return; }

      if (order.payment_method !== 'online') { setStatus("not-online"); return; }

      const { data: tx, error: txError } = await supabase.rpc('create_payment_intent', { p_order_id: order.id });
      if (txError) { setError(txError.message); setStatus('error'); return; }

      setTransaction(tx);
      // Gateway adapter placeholder. No browser-side payment mutation is made
      // here. The order remains `pending` until a trusted server-side gateway
      // callback confirms a real payment.
      setStatus("ready");
    })();
  }, [orderId]);

  if (status === "processing") return <main className="container"><h1>Secure payment</h1><p>Preparing your payment session…</p></main>;
  if (status === "auth") return <main className="container"><h1>Sign in required</h1><p>Please sign in before paying.</p></main>;
  if (status === "missing" || status === "invalid") return <main className="container"><h1>Payment unavailable</h1><p>This order could not be loaded.</p></main>;
  if (status === "not-online") return <main className="container"><h1>Payment not required</h1><p>This order uses Cash on Delivery.</p><button className="btn primary" onClick={() => router.push("/orders")}>View orders</button></main>;
  if (status === "error") return <main className="container"><h1>Payment session unavailable</h1><p>{error}</p><button className="btn primary" onClick={() => router.push("/orders")}>Back to orders</button></main>;

  return (
    <main className="container">
      <section className="panel">
        <span className="eyebrow">PAYMENT</span>
        <h1>Payment session ready</h1>
        <p>Order #{orderId.slice(0, 8)}</p>
        {transaction && <p>Amount: <strong>₹{Number(transaction.amount).toFixed(2)}</strong> · Status: <strong>{transaction.status}</strong></p>}
        <p className="notice">No money has been charged yet. Connect Razorpay/Stripe and verify its signed server-side webhook before marking this transaction paid.</p>
        <button className="btn primary" onClick={() => router.push("/orders")}>Continue to orders</button>
      </section>
    </main>
  );
}
