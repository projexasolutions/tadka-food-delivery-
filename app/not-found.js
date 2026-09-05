import Link from "next/link";

export default function NotFound() {
  return (
    <main className="page narrow center">
      <div className="success">404</div>
      <span className="eyebrow">PAGE NOT FOUND</span>
      <h1>That Tadka page isn’t here.</h1>
      <p className="muted">The link may be outdated or the page may have moved.</p>
      <Link className="btn primary" href="/">Back to home</Link>
    </main>
  );
}
