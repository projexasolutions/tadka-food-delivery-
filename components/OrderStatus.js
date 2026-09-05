export const ORDER_STEPS = [
  "pending", "confirmed", "preparing", "ready", "picked_up", "on_the_way", "delivered"
];

export function OrderStatus({ status }) {
  const current = ORDER_STEPS.indexOf(status);
  const label = (value) => value.replaceAll("_", " ").replace(/\b\w/g, c => c.toUpperCase());

  return (
    <div className="status-track">
      {ORDER_STEPS.map((step, i) => (
        <div className={`status-step ${i <= current ? "done" : ""}`} key={step}>
          <span>{i <= current ? "✓" : i + 1}</span>
          <small>{label(step)}</small>
        </div>
      ))}
    </div>
  );
}
