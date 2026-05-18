import { describe, expect, it } from "vitest";

import { loadSessionFromText } from "@/lib/driver-route/importSession";
import { transformSessionToDriverRoute } from "@/lib/driver-route/transformSession";

describe("driver route import", () => {
  it("loads a saved route-manager session into the driver_assist route shape", () => {
    const session = loadSessionFromText(
      JSON.stringify({
        version: 1,
        savedAt: "2026-05-16T12:00:00.000Z",
        data: {
          deliveries: [
            {
              id: 42,
              recipientName: "Ada Lovelace",
              phoneNumber: "555-0100",
              address: "12 Compiler Way",
              notes: "Leave near side door",
              location: { lat: 37.1, lng: -122.2 },
              demand: { value: 3 },
            },
          ],
          vehicles: [{ id: 7, driverName: "Grace Hopper" }],
        },
      }),
    );

    expect(transformSessionToDriverRoute(session)).toEqual({
      driverName: "Grace Hopper",
      routeLabel: "Route 7 - 1 stops",
      stops: [
        {
          id: "42",
          stopNumber: 1,
          address: "12 Compiler Way",
          customerName: "Ada Lovelace",
          phoneNumber: "555-0100",
          packageCount: 3,
          notes: "Leave near side door",
          status: "pending",
          lat: 37.1,
          lng: -122.2,
          completedAt: undefined,
          failureReason: undefined,
        },
      ],
    });
  });

  it("rejects files that do not match the saved session contract", () => {
    expect(() => loadSessionFromText(JSON.stringify({ version: 1 }))).toThrow(
      'Invalid save file format at "savedAt".',
    );
  });
});
