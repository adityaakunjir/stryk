"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";

// Login page is no longer needed — the landing page (/) handles auth.
// Redirect any direct visitors to /.
export default function LoginPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace("/");
  }, [router]);

  return null;
}
