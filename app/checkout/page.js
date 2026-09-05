"use client";

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { createClient } from "../../lib/supabase";

export default function Checkout() {
  const supabase = createClient();
  const [address, setAddress] = useState('');
  const [phone, setPhone] = useState('');
  const [payment, setPayment] = useState('cod');
  const [cart, setCart] = useState(null);
  const [items, setItems] = useState([]);
  const [message, setMessage] = useState('');
  const [placed, setPlaced] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => { load(); }, []);
  async function load() {
    const { data: auth } = await supabase.auth.getUser();
    if (!auth.user) return setMessage('Please login before checkout.');
    const { data: c, error: cartError } = await supabase.from('carts').select('id,restaurant_id,restaurants(delivery_fee)').eq('user_id', auth.user.id).maybeSingle();
    if (cartError) return setMessage(cartError.message);
    if (!c) return setMessage('Your cart is empty.');
    setCart(c);
    const { data, error } = await supabase.from('cart_items').select('id,quantity,menu_item_id,menu_items(name,price)').eq('cart_id', c.id);
    if (error) setMessage(error.message); else setItems(data || []);
  }
  async function placeOrder(e) {
    e.preventDefault();
    if (submitting) return;
    setSubmitting(true);
    setMessage('');

    const { data: auth } = await supabase.auth.getUser();
    if (!auth.user) {
      setSubmitting(false);
      return setMessage('Please login before checkout.');
    }
    if (!items.length) {
      setSubmitting(false);
      return setMessage('Your cart is empty.');
    }

    const { data: orderId, error } = await supabase.rpc('create_order_from_cart', {
      p_address_line1: address.trim(),
      p_phone: phone.trim(),
      p_payment_method: payment
    });

    if (error) {
      setSubmitting(false);
      return setMessage(error.message);
    }

    if (payment === 'online') {
      window.location.assign(`/payment?order=${orderId}`);
      return;
    }

    setPlaced(orderId);
    setSubmitting(false);
  }

  const subtotal = items.reduce((s,x)=>s + Number(x.menu_items.price)*x.quantity,0); const deliveryFee = Number(cart?.restaurants?.delivery_fee ?? 39); const total = subtotal + (items.length ? deliveryFee : 0);
  if (placed) return <main className="page narrow center"><div className="success">✓</div><span className="eyebrow">ORDER CONFIRMED</span><h1>Food is on its way.</h1><p className="muted">Order ID: {placed}</p><Link className="primary" href="/orders">Track your order</Link></main>;
  return <main className="page"><div className="page-head"><div><span className="eyebrow">SECURE CHECKOUT</span><h1>Checkout</h1><p>One final step before the kitchen gets cooking.</p></div></div>{message && <div className="notice">{message}</div>}<div className="checkout-grid"><form className="card" onSubmit={placeOrder}><span className="eyebrow">01 · Delivery</span><h2 className="section-title">Where should we deliver?</h2><label>Delivery address<input value={address} onChange={e=>setAddress(e.target.value)} placeholder="Flat, street, area" required /></label><label>Phone<input value={phone} onChange={e=>setPhone(e.target.value)} placeholder="+91..." required /></label><span className="eyebrow checkout-step">02 · Payment</span><h2 className="section-title">Choose payment</h2><select value={payment} onChange={e=>setPayment(e.target.value)}><option value="cod">Cash on Delivery</option><option value="online">Online Payment</option></select><p className="muted fine-print">Payment processing remains connected to the existing Tadka order flow.</p><button className="primary full" type="submit" disabled={submitting}>{submitting ? "Placing order…" : "Place order"} <span className="material-symbols-outlined">arrow_forward</span></button></form><aside className="card"><span className="eyebrow">ORDER SUMMARY</span><h2 className="section-title summary-title">Your dishes</h2>{items.map(x=><div className="summaryRow" key={x.id}><span>{x.quantity} × {x.menu_items.name}</span><b>₹{(Number(x.menu_items.price)*x.quantity).toFixed(0)}</b></div>)}<div className="summaryRow"><span>Delivery</span><b>₹{items.length?deliveryFee:0}</b></div><div className="summaryRow total"><span>Total</span><b>₹{total.toFixed(0)}</b></div></aside></div></main>;
}
