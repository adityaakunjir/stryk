import Link from "next/link";

export default function NotFound() {
  return (
    <main className="min-h-screen bg-[#05070B] text-white flex items-center justify-center p-6">
      <div className="w-full max-w-sm text-center">
        <p className="text-xs font-bold tracking-[0.25em] text-[#C6FF00] uppercase">404</p>
        <h1 className="mt-4 text-3xl font-black uppercase">Page not found</h1>
        <p className="mt-3 text-sm text-white/60">
          This route may have moved, or the link is no longer valid.
        </p>
        <Link
          href="/sync"
          className="mt-8 flex h-12 w-full items-center justify-center rounded-xl bg-[#C6FF00] text-black font-black uppercase tracking-widest"
        >
          Return to STRYK
        </Link>
      </div>
    </main>
  );
}
