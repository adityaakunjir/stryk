"use client";

import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import React from "react";

interface ClientBackButtonProps {
  className?: string;
  iconSize?: number;
  fallbackRoute?: string;
}

export function ClientBackButton({ className = "", iconSize = 18, fallbackRoute = "/" }: ClientBackButtonProps) {
  const router = useRouter();

  return (
    <button
      onClick={() => {
        if (window.history.length > 2) {
          router.back();
        } else {
          router.push(fallbackRoute);
        }
      }}
      className={className}
    >
      <ArrowLeft size={iconSize} />
    </button>
  );
}
