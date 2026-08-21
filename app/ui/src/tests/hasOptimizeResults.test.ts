import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { readOptimizedAddressIds } from "@/app/edit/utils/hasOptimizeResults";
import type { Route } from "@/app/results/types";

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

function makeRoute(stopIds: string[]): Route {
  return {
    vehicleId: "1",
    driverName: "Driver 1",
    stops: stopIds.map((id, i) => ({
      id,
      address: `${id} Main St`,
      lat: 0,
      lng: 0,
      sequence: i,
      capacityUsed: 1,
      timeWindow: { kind: "by", time: "" },
      note: "",
    })),
  };
}

describe("readOptimizedAddressIds", () => {
  beforeEach(() => {
    sessionStore.clear();
    vi.clearAllMocks();
    vi.stubGlobal("window", { sessionStorage: sessionStorageMock });
    vi.stubGlobal("sessionStorage", sessionStorageMock);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("returns an empty array when there are no cached results", () => {
    expect(readOptimizedAddressIds()).toEqual([]);
  });

  it("returns an empty array when the stored value is not valid JSON", () => {
    sessionStore.set("optimizeResults", "{not json");

    expect(readOptimizedAddressIds()).toEqual([]);
  });

  it("returns an empty array when the stored value is not an array", () => {
    sessionStore.set("optimizeResults", JSON.stringify({ oops: true }));

    expect(readOptimizedAddressIds()).toEqual([]);
  });

  it("extracts numeric ids from every stop across all routes", () => {
    sessionStore.set(
      "optimizeResults",
      JSON.stringify([makeRoute(["1", "2"]), makeRoute(["3"])]),
    );

    expect(readOptimizedAddressIds().sort()).toEqual([1, 2, 3]);
  });

  it("drops stop ids that aren't numeric", () => {
    sessionStore.set(
      "optimizeResults",
      JSON.stringify([makeRoute(["1", "not-a-number"])]),
    );

    expect(readOptimizedAddressIds()).toEqual([1]);
  });

  it("returns a reference-stable array when sessionStorage hasn't changed", () => {
    sessionStore.set("optimizeResults", JSON.stringify([makeRoute(["1"])]));

    const first = readOptimizedAddressIds();
    const second = readOptimizedAddressIds();

    expect(second).toBe(first);
  });

  it("returns fresh ids once sessionStorage changes", () => {
    sessionStore.set("optimizeResults", JSON.stringify([makeRoute(["1"])]));
    const first = readOptimizedAddressIds();

    sessionStore.set("optimizeResults", JSON.stringify([makeRoute(["2"])]));
    const second = readOptimizedAddressIds();

    expect(first).toEqual([1]);
    expect(second).toEqual([2]);
  });
});
