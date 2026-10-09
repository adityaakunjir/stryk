"use client";

import { useSyncExternalStore } from "react";

const query = "(max-width: 640px), (pointer: coarse), (prefers-reduced-motion: reduce)";
function subscribe(notify: () => void) {
  const media = window.matchMedia(query);
  media.addEventListener("change", notify);
  document.addEventListener("visibilitychange", notify);
  return () => {
    media.removeEventListener("change", notify);
    document.removeEventListener("visibilitychange", notify);
  };
}
function snapshot() {
  return document.hidden || window.matchMedia(query).matches;
}
/** Keep phones and hidden tabs free of perpetual decorative animation. */
export function useLiteEffects() {
  return useSyncExternalStore(subscribe, snapshot, () => true);
}
