import Link from "next/link";
import { InstallApp } from "@/components/install-app";

export default function InstallPage() {
  return (
    <main
      className="fixed inset-0 z-10 overflow-y-auto overscroll-contain bg-[#151515] px-6 text-white"
      style={{
        paddingTop: "calc(2.5rem + env(safe-area-inset-top))",
        paddingBottom: "calc(2.5rem + env(safe-area-inset-bottom))",
        WebkitOverflowScrolling: "touch",
      }}
    >
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
