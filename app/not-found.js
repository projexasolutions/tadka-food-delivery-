import Link from "next/link";

export default function NotFound() {
  return (
    <main className="mx-auto w-full max-w-3xl px-4 py-16 text-center">
      <div className="mx-auto grid h-20 w-20 place-items-center rounded-full bg-tadka-green text-2xl font-black text-white">404</div>
      <span className="mt-5 block text-[10px] font-black uppercase tracking-[.14em] text-tadka-orange">PAGE NOT FOUND</span>
      <h1 className="mt-3 text-4xl font-black tracking-tight">That Tadka page isn’t here.</h1>
      <p className="mx-auto mt-3 max-w-xl text-sm leading-6 text-tadka-muted">The link may be outdated or the page may have moved.</p>
      <Link className="mt-6 inline-flex items-center justify-center rounded-xl bg-tadka-orange px-4 py-3 text-sm font-bold text-white hover:bg-tadka-orange-dark" href="/">Back to home</Link>
    </main>
  );
}