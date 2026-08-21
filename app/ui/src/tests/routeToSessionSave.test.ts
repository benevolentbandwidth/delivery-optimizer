import { describe, expect, it } from "vitest";

import type { Route, Stop } from "@/app/results/types";
import { loadSessionFromText } from "@/lib/driver-route/importSession";
import { transformSessionToDriverRoute } from "@/lib/driver-route/transformSession";
import {
  routeToSessionSaveData,
  routeToSessionSaveFile,
} from "@/lib/whatsapp/routeToSessionSave";

const SAVED_AT = "2026-08-08T12:00:00.000Z";

function stop(overrides: Partial<Stop> = {}): Stop {
  return {
    id: "stop-1",
    address: "123 Main St",
    lat: 40.7295,
    lng: -74.091,
    sequence: 1,
    capacityUsed: 5,
    timeWindow: { kind: "by", time: "11:00 AM" },
    note: "",
    addresseeName: "Jane Doe",
    phoneNumber: "+1 555-010-0100",
    ...overrides,
  };
}

function route(overrides: Partial<Route> = {}): Route {
  return {
    vehicleId: "vehicle-1",
    driverName: "Alex",
    stops: [stop()],
    vehicleType: "car",
    startLocation: { lat: 40.7128, lng: -74.006, address: "Depot" },
    startTime: "9:00 AM",
    ...overrides,
  };
}

describe("routeToSessionSaveData", () => {
  it("emits stops in optimized order regardless of array order", () => {
    const data = routeToSessionSaveData(
      route({
        stops: [
          stop({ id: "c", sequence: 3, addresseeName: "Third" }),
          stop({ id: "a", sequence: 1, addresseeName: "First" }),
          stop({ id: "b", sequence: 2, addresseeName: "Second" }),
        ],
      }),
    );

    expect(data.deliveries.map((d) => d.recipientName)).toEqual([
      "First",
      "Second",
      "Third",
    ]);
  });

  it("assigns positional numeric ids rather than parsing string stop ids", () => {
    const data = routeToSessionSaveData(
      route({
        stops: [
          stop({ id: "stop-abc" }),
          stop({ id: "stop-xyz", sequence: 2 }),
        ],
      }),
    );

    expect(data.deliveries.map((d) => d.id)).toEqual([1, 2]);
  });

  it("emits exactly one vehicle, since the driver app reads only vehicles[0]", () => {
    const data = routeToSessionSaveData(route());

    expect(data.vehicles).toHaveLength(1);
    expect(data.vehicles[0].id).toBe(1);
    expect(data.vehicles[0].driverName).toBe("Alex");
  });

  it.each([
    ["Van", "truck"],
    ["truck", "truck"],
    ["E-Bike", "bicycle"],
    ["bicycle", "bicycle"],
    ["", "car"],
    [undefined, "car"],
    ["hovercraft", "car"],
  ])("normalizes vehicleType %s to %s", (input, expected) => {
    const data = routeToSessionSaveData(route({ vehicleType: input }));
    expect(data.vehicles[0].vehicleType).toBe(expected);
  });

  it("omits blank recipient names instead of sending an empty string", () => {
    const data = routeToSessionSaveData(
      route({ stops: [stop({ addresseeName: "   " })] }),
    );

    expect(data.deliveries[0]).not.toHaveProperty("recipientName");
  });

  it("omits phone numbers shorter than the schema minimum", () => {
    const data = routeToSessionSaveData(
      route({ stops: [stop({ phoneNumber: "555-0100" })] }),
    );

    expect(data.deliveries[0]).not.toHaveProperty("phoneNumber");
  });

  it("keeps and normalizes a full-length phone number", () => {
    const data = routeToSessionSaveData(
      route({ stops: [stop({ phoneNumber: "+1 (555) 010-0100" })] }),
    );

    expect(data.deliveries[0].phoneNumber).toBe("+15550100100");
  });

  it("clamps a zero quantity up to the schema's positive minimum", () => {
    const data = routeToSessionSaveData(
      route({ stops: [stop({ capacityUsed: 0 })] }),
    );

    expect(data.deliveries[0].demand.value).toBe(1);
  });

  it("derives a time window when both ends are present", () => {
    const data = routeToSessionSaveData(
      route({
        stops: [
          stop({
            deliveryWindowStart: "9:00 AM",
            deliveryWindowEnd: "11:00 AM",
          }),
        ],
      }),
    );

    expect(data.deliveries[0].timeWindows).toEqual([[32400, 39600]]);
  });

  it("omits the time window when the end is not after the start", () => {
    const data = routeToSessionSaveData(
      route({
        stops: [
          stop({
            deliveryWindowStart: "11:00 AM",
            deliveryWindowEnd: "9:00 AM",
          }),
        ],
      }),
    );

    expect(data.deliveries[0]).not.toHaveProperty("timeWindows");
  });

  it("never derives a window from the predicted arrival time", () => {
    const data = routeToSessionSaveData(
      route({
        stops: [stop({ timeWindow: { kind: "by", time: "11:00 AM" } })],
      }),
    );

    expect(data.deliveries[0]).not.toHaveProperty("timeWindows");
  });

  it("sets departureTime and returnTime together", () => {
    const data = routeToSessionSaveData(route({ startTime: "9:00 AM" }));

    expect(data.vehicles[0].departureTime).toBe(32400);
    expect(data.vehicles[0].returnTime).toBe(86400);
  });

  it("omits both time fields when there is no start time", () => {
    const data = routeToSessionSaveData(route({ startTime: undefined }));

    expect(data.vehicles[0]).not.toHaveProperty("departureTime");
    expect(data.vehicles[0]).not.toHaveProperty("returnTime");
  });

  it("throws when a stop has unusable coordinates", () => {
    expect(() =>
      routeToSessionSaveData(route({ stops: [stop({ lat: Number.NaN })] })),
    ).toThrow(/coordinates/i);
  });

  it("throws when the route has no stops", () => {
    expect(() => routeToSessionSaveData(route({ stops: [] }))).toThrow(
      /no stops/i,
    );
  });
});

describe("routeToSessionSaveFile", () => {
  it("wraps the data in the versioned envelope", () => {
    const file = routeToSessionSaveFile(route(), SAVED_AT);

    expect(file.version).toBe(1);
    expect(file.savedAt).toBe(SAVED_AT);
    expect(file.data.deliveries).toHaveLength(1);
  });

  it("round-trips through the driver app's real import path", () => {
    const source = route({
      driverName: "Alex",
      stops: [
        stop({
          id: "c",
          sequence: 3,
          addresseeName: "Third",
          phoneNumber: "+15550100103",
          capacityUsed: 3,
        }),
        stop({
          id: "a",
          sequence: 1,
          addresseeName: "First",
          phoneNumber: "+15550100101",
          capacityUsed: 1,
        }),
        stop({
          id: "b",
          sequence: 2,
          addresseeName: "Second",
          phoneNumber: "+15550100102",
          capacityUsed: 2,
        }),
      ],
    });

    const file = routeToSessionSaveFile(source, SAVED_AT);
    const session = loadSessionFromText(JSON.stringify(file));
    const driverRoute = transformSessionToDriverRoute(session);

    expect(driverRoute.driverName).toBe("Alex");
    expect(driverRoute.stops.map((s) => s.stopNumber)).toEqual([1, 2, 3]);
    expect(driverRoute.stops.map((s) => s.customerName)).toEqual([
      "First",
      "Second",
      "Third",
    ]);
    expect(driverRoute.stops.map((s) => s.packageCount)).toEqual([1, 2, 3]);
    expect(driverRoute.stops.map((s) => s.phoneNumber)).toEqual([
      "+15550100101",
      "+15550100102",
      "+15550100103",
    ]);
  });
});
