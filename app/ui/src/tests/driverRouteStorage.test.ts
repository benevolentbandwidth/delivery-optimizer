import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import {
  readUploadedRoute,
  storeUploadedRoute,
  UPLOADED_ROUTE_KEY,
} from "@/app/driver_assist/storage";

const sessionStore = new Map<string, string>();
const sessionStorageMock = {
  getItem: vi.fn((key: string) => sessionStore.get(key) ?? null),
  setItem: vi.fn((key: string, value: string) => {
    sessionStore.set(key, value);
  }),
  removeItem: vi.fn((key: string) => {
    sessionStore.delete(key);
  }),
};

describe("driver route upload handoff", () => {
  beforeEach(() => {
    sessionStore.clear();
    vi.clearAllMocks();
    vi.stubGlobal("window", { sessionStorage: sessionStorageMock });
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("stores and restores the validated route instead of its source text", () => {
    const route = {
      driverName: "Driver 1",
      routeLabel: "Route 1",
      stops: [],
    };

    storeUploadedRoute(route);

    expect(readUploadedRoute()).toEqual(route);
    expect(sessionStore.get(UPLOADED_ROUTE_KEY)).not.toContain("content");
  });

  it("discards an invalid handoff", () => {
    sessionStore.set(UPLOADED_ROUTE_KEY, "not-json");

    expect(readUploadedRoute()).toBeNull();
    expect(sessionStore.has(UPLOADED_ROUTE_KEY)).toBe(false);
  });
});
