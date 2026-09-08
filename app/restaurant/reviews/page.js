'use client';
import { useEffect, useState } from 'react';
import RestaurantShell from '@/components/RestaurantShell';

const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

export default function Reviews() {
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');

  useEffect(() => {
    async function load() {
      try {
        const profileResponse = await fetch(`${apiUrl}/v1/restaurant`, { credentials: 'include', cache: 'no-store' });
        const profile = await profileResponse.json();
        if (!profileResponse.ok) throw new Error(profile?.error?.message || 'Unable to load restaurant.');
        const restaurantId = profile.data?.id;
        if (!restaurantId) throw new Error('Restaurant profile is incomplete.');
        const response = await fetch(`${apiUrl}/v1/restaurants/${restaurantId}/reviews`, { credentials: 'include', cache: 'no-store' });
        const body = await response.json();
        if (!response.ok) throw new Error(body?.error?.message || 'Unable to load reviews.');
        setReviews(body.data || []);
      } catch (error) { setMessage(error.message); } finally { setLoading(false); }
    }
    load();
  }, []);

  return <RestaurantShell title="CUSTOMER REVIEWS" subtitle="What customers are saying"><section className="partner-panel"><div className="panel-head"><div><h2>Customer feedback</h2><p>{reviews.length ? `${reviews.length} verified order review${reviews.length === 1 ? '' : 's'}` : 'Feedback from completed orders'}</p></div></div>
    {loading ? <div className="partner-empty compact"><b>Loading reviews…</b></div> : message ? <div className="partner-empty compact"><b>{message}</b></div> : reviews.length === 0 ? <div className="partner-empty compact"><span className="material-symbols-outlined">star</span><b>No reviews yet</b><p>Reviews appear after customers rate delivered orders.</p></div> : <div className="stack-list">{reviews.map((review) => <article key={review.id} className="list-row"><div><strong>{review.customerName || 'Customer'}</strong><p>{review.comment || 'No written feedback.'}</p></div><span aria-label={`${review.rating} out of 5 stars`}>{'★'.repeat(review.rating)}{'☆'.repeat(5 - review.rating)}</span></article>)}</div>}
  </section></RestaurantShell>;
}
