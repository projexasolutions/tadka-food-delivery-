"use client";

import { useSearchParams } from "next/navigation";
import { useState } from "react";
import { supabase } from "../../lib/supabase";

export default function ReviewPage() {
  const params = useSearchParams();
  const orderId = params.get("order");
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function submit(e) {
    e.preventDefault();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user || !orderId) { setMessage("Please sign in and select an order."); return; }

    const { data: order, error: orderError } = await supabase.from("orders")
      .select("restaurant_id,status")
      .eq("id", orderId)
      .eq("user_id", user.id)
      .single();
    if (orderError || !order || order.status !== "delivered") {
      setMessage("Only your delivered orders can be reviewed.");
      return;
    }

    const { data: existing } = await supabase.from("reviews").select("id").eq("order_id", orderId).eq("user_id", user.id).maybeSingle();
    if (existing) { setMessage("You have already reviewed this order."); return; }

    setSubmitting(true);
    const { error } = await supabase.from("reviews").insert({
      order_id: orderId,
      user_id: user.id,
      restaurant_id: order.restaurant_id,
      rating: Number(rating),
      comment: comment.trim() || null
    });
    setMessage(error ? error.message : "Thanks! Your review was submitted.");
    setSubmitting(false);
  }

  return <main className="container"><section className="panel"><span className="eyebrow">FEEDBACK</span><h1>Rate your order</h1><form onSubmit={submit} className="form-grid"><select value={rating} onChange={e => setRating(e.target.value)}><option value="5">★★★★★ — Excellent</option><option value="4">★★★★☆ — Good</option><option value="3">★★★☆☆ — Okay</option><option value="2">★★☆☆☆ — Poor</option><option value="1">★☆☆☆☆ — Bad</option></select><textarea placeholder="Tell us about your experience" value={comment} onChange={e => setComment(e.target.value)} /><button className="btn primary" disabled={submitting}>{submitting ? "Submitting…" : "Submit review"}</button></form>{message && <p className="notice">{message}</p>}</section></main>;
}
