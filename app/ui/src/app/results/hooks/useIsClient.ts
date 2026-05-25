"use client";

import { useSyncExternalStore } from "react";

/** True after mount; false during SSR (for createPortal targets). */
export function useIsClient(): boolean {
  return useSyncExternalStore(
    () => () => {},
    () => true,
    () => false,
  );
}
