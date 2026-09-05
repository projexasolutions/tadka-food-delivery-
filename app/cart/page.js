"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { createClient } from "../../lib/supabase";

export default function Cart() {
  const supabase = createClient();
  const [items, setItems] = useState([]);
  const [cartId, setCartId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState(null);
  const [message, setMessage] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setMessage("Login to see your cart."); setLoading(false); return; }

    const { data: cart, error: cartError } = await supabase
      .from("carts")
      .select("id")
      .eq("user_id", user.id)
      .maybeSingle();

    if (cartError) { setMessage(cartError.message); setLoading(false); return; }
    if (!cart) { setCartId(null); setItems([]); setLoading(false); return; }

    setCartId(cart.id);
    const { data, error } = await supabase
      .from("cart_items")
      .select("id,quantity,menu_item_id,menu_items(name,price,image_url)")
      .eq("cart_id", cart.id);

    if (error) setMessage(error.message);
    else setItems(data || []);
    setLoading(false);
  }, [supabase]);

  useEffect(() => { load(); }, [load]);

  async function changeQuantity(item, delta) {
    setBusyId(item.id);
    setMessage("");
    const next = item.quantity + delta;
    const result = next <= 0
      ? await supabase.from("cart_items").delete().eq("id", item.id)
      : await supabase.from("cart_items").update({ quantity: next }).eq("id", item.id);

    if (result.error) setMessage(result.error.message);
    else window.dispatchEvent(new Event("tadka:cart-updated"));
    setBusyId(null);
    await load();
  }

  const subtotal = items.reduce((sum, item) => sum + Number(item.menu_items.price) * item.quantity, 0);
  const delivery = items.length ? 39 : 0;
  const total = subtotal + delivery;

  return (
    <main className="page">
      <div className="page-head">
        <div><span className="eyebrow">YOUR ORDER</span><h1>Cart</h1><p>Review your dishes before you send them to the kitchen.</p></div>
        <Link className="secondary" href="/restaurants">Add more food</Link>
      </div>

      {message && !items.length ? (
        <div className="card empty-state"><span className="material-symbols-outlined empty-icon">shopping_bag</span><h3>{message}</h3><Link className="primary" href="/auth">Login</Link></div>
      ) : loading ? (
        <div className="card">Loading your cart…</div>
      ) : (
        <div className="checkout-grid">
          <section className="card cart-list">
            {!items.length ? (
              <div className="empty-state"><h3>Your cart is empty.</h3><p>Find a kitchen and add something delicious.</p><Link className="primary" href="/restaurants">Explore restaurants</Link></div>
            ) : items.map((item) => (
              <div className="cartRow" key={item.id}>
                <div><b>{item.menu_items.name}</b><p>₹{Number(item.menu_items.price).toFixed(0)} each</p></div>
                <div className="qty"><button type="button" disabled={busyId === item.id} onClick={() => changeQuantity(item, -1)}>−</button><b>{item.quantity}</b><button type="button" disabled={busyId === item.id} onClick={() => changeQuantity(item, 1)}>+</button></div>
              </div>
            ))}
          </section>

          {items.length > 0 && <aside className="card order-summary">
            <span className="eyebrow">ORDER SUMMARY</span><h2>Your total</h2>
            <div className="summaryRow"><span>Subtotal</span><b>₹{subtotal.toFixed(0)}</b></div>
            <div className="summaryRow"><span>Delivery</span><b>₹{delivery}</b></div>
            <div className="summaryRow"><span>Taxes & charges</span><b>Included</b></div>
            <div className="summaryRow total"><span>Total</span><b>₹{total.toFixed(0)}</b></div>
            <Link className="primary full" href="/checkout">Continue to checkout <span className="material-symbols-outlined">arrow_forward</span></Link>
          </aside>}
        </div>
      )}

      {cartId && <div className="muted developer-detail">Cart ID: {cartId}</div>}
    </main>
  );
}
