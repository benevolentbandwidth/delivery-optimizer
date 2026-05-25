"use client";

import { useSyncExternalStore } from "react";

/** True after hydration; use before rendering portals that touch document.body. */
export function useIsClient(): boolean {
  return useSyncExternalStore(
    () => () => {},
    () => true,
    () => false,
  );
}
