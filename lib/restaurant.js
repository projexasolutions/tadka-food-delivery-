import { supabase } from '@/lib/supabase';

export const ORDER_STATUS_FLOW = {
  pending: 'confirmed',
  confirmed: 'preparing',
  preparing: 'ready',
  ready: 'picked_up',
  picked_up: 'on_the_way',
  on_the_way: 'delivered',
};

export const ORDER_STATUSES = [
  'pending',
  'confirmed',
  'preparing',
  'ready',
  'picked_up',
  'on_the_way',
  'delivered',
];

export function formatOrderStatus(status) {
  return String(status || '').replaceAll('_', ' ');
}

export async function getOwnedRestaurant(fields = 'id,name,cuisine,is_open') {
  const { data: auth, error: authError } = await supabase.auth.getUser();
  if (authError) throw authError;
  if (!auth.user) return null;

  const { data, error } = await supabase
    .from('restaurants')
    .select(fields)
    .eq('owner_id', auth.user.id)
    .maybeSingle();

  if (error) throw error;
  return data;
}

export async function advanceRestaurantOrder(orderId, currentStatus) {
  const nextStatus = ORDER_STATUS_FLOW[currentStatus];
  if (!nextStatus) return { nextStatus: null };

  const { error } = await supabase.rpc('advance_order_status', {
    p_order_id: orderId,
    p_next_status: nextStatus,
  });

  if (error) throw error;
  return { nextStatus };
}
