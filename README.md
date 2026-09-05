# Tadka Food Delivery — Build 32

## Production UI + Functional Interaction Pass

This build keeps the existing Tadka/Supabase architecture and makes the redesigned Stitch-style frontend interactive instead of decorative.

### Functional UI work
- Global search submits to live restaurant discovery.
- Cart badge loads the signed-in user's real cart quantity.
- Cart badge refreshes after adding items.
- Location control requests browser geolocation permission and reports state.
- Home cuisine chips navigate to live filtered restaurant discovery.
- Home filter chips navigate/apply supported filters.
- Curated collection cards navigate to discovery filters.
- Spotlight previous/next controls horizontally scroll the dish strip.
- Restaurant discovery search/filter controls actually filter live Supabase restaurant data.
- Restaurant menu category chips filter live menu items by category.
- Add-to-cart handles unauthenticated users, cart creation, restaurant switching, quantity increments and errors.
- Restaurant cards open the live menu route using the real restaurant id.
- Decorative/non-functional app-download CTA was replaced with a working Start ordering link.

### Existing backend/data behavior retained
- Supabase Auth
- PostgreSQL schema
- RLS/security policies
- Order RPC/status flow
- Cart/order/review/notification operations
- Restaurant/admin/rider operations

### Verification
- `node --check` passes for all JS files in app/components/lib.
- A full `npm install` / production build could not be completed in this environment because dependency installation timed out; run `npm install` and `npm run build` locally before deployment.

## Build 24

Build 24 is the production-fix baseline after Build 23.

Apply `supabase/build-24-production-fixes.sql` after the existing SQL/migrations.
It normalizes legacy notification columns, hardens delivery/order synchronization,
and prevents browser-side payment-status mutation until a real server-side gateway
callback is implemented.

## Build 25 — End-to-End Delivery Flow

Build 25 completes the core customer → restaurant → rider → delivered → review path.
- Rider delivery updates are protected by the delivery-assignment RLS model.
- Admins can assign riders to ready/active delivery orders.
- Delivery assignment validation rejects non-riders and invalid order states.
- Delivery progress remains sequential: assigned → picked_up → on_the_way → delivered.
- Order status and delivery status stay synchronized.
- Customer order history polls for live status and shows delivery progress.
- Reviews remain restricted to delivered orders and duplicate submissions are handled in the UI.

## Build 26 — Rider Experience + Live Tracking
- Added a stricter delivery-assignment state machine: assigned → picked_up → on_the_way → delivered.
- Prevented non-admin users from changing delivery ownership/order relationships.
- Added Supabase Realtime publication setup for orders and delivery assignments.
- Rider delivery page now shows active delivery count, next action, progress steps, and live-update state.
- Customer orders page now listens for order changes and delivery assignment changes, with polling fallback.
- Preserved Build 24 payment architecture and Build 25 end-to-end flow/security fixes.

## Build 27 — Reviews, notifications & edge cases
- Hardened review/order/restaurant consistency at the database boundary.
- Added restaurant-owner notification when a new customer review is submitted.
- Improved delivered-order notifications with review guidance.
- Added user-scoped `mark_all_notifications_read()` RPC.
- Added notification/review indexes and real-time notification-center refresh.


## Build 28 — Payment architecture & failure safety
- Added `payment_transactions` as the auditable payment-attempt ledger.
- Online checkout now creates a server-validated payment intent record and routes to the payment session.
- Browser code never writes `orders.payment_status` directly.
- Added an idempotent, backend-only `record_verified_payment()` helper for a trusted gateway webhook/server.
- Payment states support created → processing → paid/failed/refunded without pretending a gateway charge succeeded.
- Added Realtime publication for payment transaction updates where available.
- Real Razorpay/Stripe charging still requires gateway credentials plus a trusted webhook/Edge Function implementation.
- Supabase security follows the current guidance: RLS on exposed tables and tightly restricted privileged functions.

## Build 29 — Production Security & QA
- Hardened delivery/order status consistency at the database boundary.
- Enforced verified payment transaction requirement before an order can become `paid`.
- Kept verified payment callback RPC inaccessible to browser roles.
- Added operational indexes for order, notification, and delivery queries.
- Prevented multiple simultaneous active delivery assignments for one order.
- Improved admin delivery controls with loading/error states and assignment visibility.
- Preserved Builds 24–28 payment, realtime, review, and delivery work.
- Final production verification remains dependent on the user's Supabase project credentials/configuration and a full `next build` environment.

## Build 30 — Final MVP QA

Build 30 established the final MVP hardening baseline.
- Added a global App Router error boundary with safe retry UX.
- Added a branded 404 page and clear recovery path.
- Prevented duplicate checkout submissions while an order is being created.
- Added clearer loading/error handling to admin operations and disabled duplicate cancellation clicks.
- Corrected the operations revenue-row currency formatting expression.
- Re-ran JavaScript syntax validation across app/components/lib.
- Final production verification still requires `npm install`, `npm run build`, real Supabase environment variables, and an end-to-end test account for each role.
- Real online payments remain intentionally uncharged until a trusted Razorpay/Stripe webhook or server callback is configured.

## Build 30 — Final audit fixes
- Checkout order creation moved to the trusted `create_order_from_cart` RPC.
- Cart prices, availability, restaurant ownership, restaurant open state, and delivery fee are validated server-side.
- Order + order items + address creation and cart clearing are atomic.
- Browser can no longer tamper with order subtotal/delivery fee by inserting the order directly from checkout.
- Checkout now displays the restaurant's configured delivery fee instead of a hard-coded fee.
