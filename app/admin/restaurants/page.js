'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useRoleGuard } from '@/lib/useRoleGuard';

export default function AdminRestaurantsPage() {
  const { checkingRole } = useRoleGuard(['admin']);
  const [restaurants, setRestaurants] = useState([]);
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState('');

  useEffect(() => {
    if (checkingRole) return;

    async function loadRestaurants() {
      setLoading(true);
      const { data, error } = await supabase
        .from('restaurants')
        .select('id, name, cuisine, rating, is_open, created_at')
        .order('created_at', { ascending: false });

      if (error) setMessage(error.message);
      else setRestaurants(data || []);
      setLoading(false);
    }

    loadRestaurants();
  }, [checkingRole]);

  async function toggleRestaurant(restaurant) {
    setBusy(restaurant.id);
    setMessage('');

    const nextOpenState = !restaurant.is_open;
    const { error } = await supabase
      .from('restaurants')
      .update({ is_open: nextOpenState })
      .eq('id', restaurant.id);

    if (error) {
      setMessage(error.message);
    } else {
      setRestaurants((current) =>
        current.map((item) =>
          item.id === restaurant.id ? { ...item, is_open: nextOpenState } : item,
        ),
      );
    }

    setBusy('');
  }

  if (checkingRole) {
    return <main className="container"><p>Checking admin access…</p></main>;
  }

  return (
    <main className="container">
      <div className="page-head">
        <div>
          <span className="eyebrow">ADMIN</span>
          <h1>Restaurant Management</h1>
          <p>Review partner restaurants and control their availability.</p>
        </div>
      </div>

      {loading ? (
        <section className="panel"><p>Loading restaurants…</p></section>
      ) : (
        <section className="cards">
          {restaurants.map((restaurant) => (
            <article className="card admin-restaurant-row" key={restaurant.id}>
              <div>
                <h3>{restaurant.name}</h3>
                <p>{restaurant.cuisine || 'Restaurant'} · Rating {restaurant.rating ?? '—'}</p>
              </div>
              <span className={`badge ${restaurant.is_open ? '' : 'badge-muted'}`}>
                {restaurant.is_open ? 'Open' : 'Closed'}
              </span>
              <button
                className="btn"
                disabled={busy === restaurant.id}
                onClick={() => toggleRestaurant(restaurant)}
              >
                {busy === restaurant.id ? 'Saving…' : restaurant.is_open ? 'Close restaurant' : 'Open restaurant'}
              </button>
            </article>
          ))}
          {!restaurants.length && <section className="panel"><p>No restaurants found.</p></section>}
        </section>
      )}

      {message && <p className="notice">{message}</p>}
    </main>
  );
}
