import Link from "next/link";
import { InstallApp } from "@/components/install-app";

export default function InstallPage() {
  return (
    <main className="min-h-dvh bg-[#151515] px-6 py-10 text-white">
      <div className="mx-auto max-w-md">
        <Link href="/" className="text-sm text-white/60 hover:text-white">← Back to STRYK</Link>
        <img src="/pwa/icon-192.png" alt="STRYK" width={80} height={80} className="mt-8 rounded-2xl" />
        <h1 className="mb-3 mt-5 text-3xl font-black">STRYK. On your home screen.</h1>
        <p className="mb-8 text-white/65">Your football identity, one tap away. No app store download needed.</p>
        <InstallApp />
      </div>
    </main>
  );
}
