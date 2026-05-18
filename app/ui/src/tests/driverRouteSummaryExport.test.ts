import { describe, expect, it } from "vitest";

import { buildRouteSummary } from "@/lib/driver-route/exportSummary";
import type { DriverRoute } from "@/lib/driver-route/types";

describe("driver route summary export", () => {
  it("builds a downloadable route summary from current stop state", () => {
    const route: DriverRoute = {
      driverName: "Avery Johnson",
      routeLabel: "Route 12 - 3 stops",
      stops: [
        {
          id: "301",
          stopNumber: 1,
          customerName: "Lena Brooks",
          address: "620 G St, Davis, CA 95616",
          packageCount: 1,
          notes: "Call when outside.",
          status: "completed",
          lat: 38.54642,
          lng: -121.74458,
          completedAt: "2026-05-18T18:47:00.000Z",
        },
        {
          id: "302",
          stopNumber: 2,
          customerName: "Marcus Lee",
          address: "726 2nd St, Davis, CA 95616",
          packageCount: 2,
          notes: "",
          status: "pending",
          lat: 38.54328,
          lng: -121.74092,
        },
        {
          id: "303",
          stopNumber: 3,
          customerName: "Iris Thompson",
          address: "1414 E Covell Blvd, Davis, CA 95616",
          packageCount: 1,
          notes: "Ring doorbell twice.",
          status: "failed",
          lat: 38.56171,
          lng: -121.72874,
          failureReason: "Customer unavailable",
        },
      ],
    };

    expect(
      buildRouteSummary(route, new Date("2026-05-18T19:00:00.000Z")),
    ).toMatchObject({
      version: 1,
      exportedAt: "2026-05-18T19:00:00.000Z",
      driverName: "Avery Johnson",
      summary: {
        total: 3,
        complete: 1,
        remaining: 2,
      },
      stops: [
        {
          customerName: "Lena Brooks",
          status: "completed",
          location: { lat: 38.54642, lng: -121.74458 },
        },
        {
          customerName: "Marcus Lee",
          status: "pending",
        },
        {
          customerName: "Iris Thompson",
          status: "failed",
          failureReason: "Customer unavailable",
        },
      ],
    });
  });
});
