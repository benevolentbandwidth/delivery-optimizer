import { describe, it, expect } from "vitest";
import { formatStopDeliveryWindow } from "@/app/results/utils/formatStopTimeWindow";
import type { Stop } from "@/app/results/types";

function baseStop(overrides: Partial<Stop> = {}): Stop {
  return {
    id: "s1",
    address: "123 Main",
    lat: 0,
    lng: 0,
    sequence: 1,
    capacityUsed: 0,
    timeWindow: { kind: "by", time: "14:00" },
    note: "",
    ...overrides,
  };
}

describe("formatStopDeliveryWindow", () => {
  it("prefers deliveryWindowStart/End when both set", () => {
    expect(
      formatStopDeliveryWindow(
        baseStop({
          deliveryWindowStart: "09:00",
          deliveryWindowEnd: "11:00",
          timeWindow: { kind: "by", time: "14:00" },
        }),
      ),
    ).toBe("9:00 AM – 11:00 AM");
  });

  it("falls back to timeWindow when window strings are missing", () => {
    expect(
      formatStopDeliveryWindow(
        baseStop({ timeWindow: { kind: "by", time: "14:00" } }),
      ),
    ).toBe("By 2:00 PM");
  });
});
