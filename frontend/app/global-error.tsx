"use client";

export default function GlobalError({
  unstable_retry,
}: {
  error: Error & { digest?: string };
  unstable_retry: () => void;
}) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-[#05070B] text-white flex items-center justify-center p-6">
        <main className="w-full max-w-sm text-center">
          <p className="text-xs font-bold tracking-[0.25em] text-[#C6FF00] uppercase">
            STRYK
          </p>
          <h1 className="mt-4 text-3xl font-black uppercase">Something went wrong</h1>
          <p className="mt-3 text-sm text-white/60">
            Your data is safe. Retry the page, or return after checking your connection.
          </p>
          <button
            type="button"
            onClick={() => unstable_retry()}
            className="mt-8 h-12 w-full rounded-xl bg-[#C6FF00] text-black font-black uppercase tracking-widest"
          >
            Try again
          </button>
        </main>
      </body>
    </html>
  );
}
