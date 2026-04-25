import { beforeEach, describe, expect, it, vi } from "vitest";

import {
  mapEditStateToOptimizeRequest,
  mapOptimizeRequestToEditState,
} from "@/app/edit/utils/sessionMapper";
import { geocodeAddress } from "@/app/components/AddressGeocoder/utils/nominatim";
import { loadSessionFromFile } from "@/lib/session/importSession";
import type { OptimizeRequest } from "@/lib/types/optimize.types";

vi.mock("@/app/components/AddressGeocoder/utils/nominatim", () => ({
  geocodeAddress: vi.fn(),
}));

const mockGeocodeAddress = vi.mocked(geocodeAddress);

describe("mapOptimizeRequestToEditState", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("restores time windows into delivery start/end fields and hydrates cached locations", () => {
    const request: OptimizeRequest = {
      vehicles: [
        {
          id: 1,
          vehicleType: "car",
          driverName: "Driver 1",
          startLocation: { lat: 34.052235, lng: -118.243683 },
          capacity: { type: "units", value: 10 },
          departureTime: 32400,
          returnTime: 86400,
        },
      ],
      deliveries: [
        {
          id: 1,
          address: "123 Main St",
          notes: "Leave at side door",
          location: { lat: 36.169941, lng: -115.139832 },
          bufferTime: 300,
          demand: { type: "units", value: 3 },
          timeWindows: [[32400, 61200]],
        },
      ],
    };

    const state = mapOptimizeRequestToEditState(request);

    expect(state.vehicles[0]).toMatchObject({
      name: "Driver 1",
      cachedLocation: { lat: 34.052235, lng: -118.243683, state: null },
      departureTime: "9:00 AM",
    });

    expect(state.addresses[0]).toMatchObject({
      recipientAddress: "123 Main St",
      cachedLocation: { lat: 36.169941, lng: -115.139832, state: null },
      deliveryTimeStart: "9:00 AM",
      deliveryTimeEnd: "5:00 PM",
      notes: "Leave at side door",
    });
  });

  it("geocodes missing cached locations when exporting edit state", async () => {
    mockGeocodeAddress
      .mockResolvedValueOnce({ lat: 34.1, lng: -118.2, state: "California" })
      .mockResolvedValueOnce({ lat: 36.1, lng: -115.1, state: "Nevada" });

    const request = await mapEditStateToOptimizeRequest(
      [
        {
          id: 1,
          locked: true,
          editingExisting: false,
          name: "Driver 1",
          startLocation: "123 Depot St",
          type: "car",
          capacityUnit: "units",
          capacity: 10,
          available: true,
          departureTime: "",
        },
      ],
      [
        {
          id: 2,
          locked: true,
          editingExisting: false,
          recipientAddress: "456 Delivery Ave",
          timeBuffer: "No buffer",
          deliveryTimeStart: "",
          deliveryTimeEnd: "",
          deliveryQuantity: 3,
          notes: "",
        },
      ]
    );

    expect(mockGeocodeAddress).toHaveBeenNthCalledWith(1, "123 Depot St");
    expect(mockGeocodeAddress).toHaveBeenNthCalledWith(2, "456 Delivery Ave");
    expect(request.vehicles[0].startLocation).toEqual({
      lat: 34.1,
      lng: -118.2,
      state: "California",
    });
    expect(request.deliveries[0].location).toEqual({
      lat: 36.1,
      lng: -115.1,
      state: "Nevada",
    });
  });

  it("surfaces import validation errors with the failing path", async () => {
    const file = new File(
      [
        JSON.stringify({
          version: 1,
          savedAt: "2026-04-25T18:00:00.000Z",
          data: {
            vehicles: [],
            deliveries: [
              {
                id: 1,
                location: { lat: 36.169941, lng: -115.139832 },
                demand: { type: "units", value: 1 },
              },
            ],
          },
        }),
      ],
      "session.json",
      { type: "application/json" }
    );

    await expect(loadSessionFromFile(file)).rejects.toThrow(
      'Invalid save file format at "data.vehicles".'
    );
  });
});
