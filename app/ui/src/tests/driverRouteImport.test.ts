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
              recipientName: "Recipient 1",
              phoneNumber: "555-0100",
              address: "12 Compiler Way",
              notes: "Leave near side door",
              location: { lat: 37.1, lng: -122.2 },
              demand: { value: 3 },
            },
          ],
          vehicles: [{ id: 7, driverName: "driver1" }],
        },
      }),
    );

    expect(transformSessionToDriverRoute(session)).toEqual({
      driverName: "driver1",
      routeLabel: "Route 7 - 1 stops",
      stops: [
        {
          id: "42",
          stopNumber: 1,
          address: "12 Compiler Way",
          customerName: "Recipient 1",
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

  it("also accepts a direct optimize request JSON file", () => {
    const session = loadSessionFromText(
      JSON.stringify({
        deliveries: [
          {
            id: 9,
            recipientName: "Recipient 2",
            address: "620 G St, Davis, CA 95616",
            location: { lat: 38.5464, lng: -121.7446 },
          },
        ],
        vehicles: [{ id: 2, driverName: "driver2" }],
      }),
    );

    expect(transformSessionToDriverRoute(session)).toMatchObject({
      driverName: "driver2",
      stops: [
        {
          customerName: "Recipient 2",
          address: "620 G St, Davis, CA 95616",
        },
      ],
    });
  });
});
