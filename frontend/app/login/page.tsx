"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { Loader2 } from "lucide-react";

// Login page is no longer needed — the landing page (/) handles auth.
// Redirect any direct visitors to /.
export default function LoginPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace("/");
  }, [router]);

  return (
    <main className="relative min-h-screen overflow-hidden bg-[#05070B] text-white flex items-center justify-center">
      <Loader2 className="size-8 text-[#C6FF00] animate-spin" />
    </main>
  );
}
