import { PDFDocument } from "pdf-lib";
import { describe, expect, it } from "vitest";

import type { Route, Stop } from "@/app/results/types";
import { extractEmbeddedRouteJson } from "@/lib/driver-route/extractRouteJsonFromPdf";
import { loadSessionFromText } from "@/lib/driver-route/importSession";
import { transformSessionToDriverRoute } from "@/lib/driver-route/transformSession";
import {
  buildRoutePdf,
  sanitizeForPdf,
  wrapText,
} from "@/lib/whatsapp/routePdf";

const GENERATED_AT = new Date("2026-08-08T12:00:00.000Z");

function stop(overrides: Partial<Stop> = {}): Stop {
  return {
    id: "stop-1",
    address: "123 Main St, New York, NY",
    lat: 40.7295,
    lng: -74.091,
    sequence: 1,
    capacityUsed: 5,
    timeWindow: { kind: "by", time: "11:00 AM" },
    note: "Leave at back door",
    addresseeName: "Jane Doe",
    phoneNumber: "+15550100100",
    serviceMinutes: 10,
    ...overrides,
  };
}

function route(overrides: Partial<Route> = {}): Route {
  return {
    vehicleId: "vehicle-1",
    driverName: "Alex",
    stops: [stop()],
    vehicleType: "car",
    distanceMi: 12.4,
    estimatedTimeMinutes: 95,
    startLocation: { lat: 40.7128, lng: -74.006, address: "1 Depot Way" },
    startTime: "9:00 AM",
    ...overrides,
  };
}

function manyStops(count: number): Stop[] {
  return Array.from({ length: count }, (_, index) =>
    stop({
      id: `stop-${index + 1}`,
      sequence: index + 1,
      addresseeName: `Recipient ${index + 1}`,
      address: `${index + 1} Long Example Street, Some Neighborhood, NY 10001`,
    }),
  );
}

describe("sanitizeForPdf", () => {
  const supports = (cp: number) => cp < 0x2000;

  it("drops code points the font cannot render", () => {
    expect(sanitizeForPdf("Leave \u{1F4E6} at door", supports)).toBe(
      "Leave at door",
    );
  });

  it("collapses whitespace and trims", () => {
    expect(sanitizeForPdf("  a\t\tb\n c  ", supports)).toBe("a b c");
  });

  it("keeps supported characters intact", () => {
    expect(sanitizeForPdf("José Müller", supports)).toBe("José Müller");
  });
});

describe("wrapText", () => {
  it("returns no lines for empty input", async () => {
    const doc = await PDFDocument.create();
    const font = await doc.embedFont("Helvetica");

    expect(wrapText("", font, 10, 100)).toEqual([]);
  });

  it("splits text that exceeds the max width", async () => {
    const doc = await PDFDocument.create();
    const font = await doc.embedFont("Helvetica");
    const lines = wrapText("word ".repeat(40).trim(), font, 10, 120);

    expect(lines.length).toBeGreaterThan(1);
    for (const line of lines) {
      expect(font.widthOfTextAtSize(line, 10)).toBeLessThanOrEqual(120);
    }
  });
});

describe("buildRoutePdf", () => {
  it("produces a PDF named after the vehicle", async () => {
    const { bytes, filename } = await buildRoutePdf(route(), {
      generatedAt: GENERATED_AT,
    });

    expect(filename).toBe("route-vehicle-1.pdf");
    expect(Buffer.from(bytes.subarray(0, 5)).toString()).toBe("%PDF-");
  });

  it("keeps the embedded file catalog readable, not inside an object stream", async () => {
    const { bytes } = await buildRoutePdf(route(), {
      generatedAt: GENERATED_AT,
    });
    const raw = Buffer.from(bytes).toString("latin1");

    expect(raw).toContain("/EmbeddedFiles");
    expect(raw).toContain("route.json");
  });

  it("paginates long routes", async () => {
    const { bytes } = await buildRoutePdf(route({ stops: manyStops(30) }), {
      generatedAt: GENERATED_AT,
    });
    const reloaded = await PDFDocument.load(bytes);

    expect(reloaded.getPageCount()).toBeGreaterThan(1);
  });

  it("renders unsupported glyphs without throwing", async () => {
    const hostile = route({
      driverName: "Alex \u{1F600}",
      stops: [
        stop({
          addresseeName: "\u{1F468}‍\u{1F469}‍\u{1F467} Family",
          note: "Ring “twice” — gate code 1234 \u{1F4E6} 東京",
          address: "123 Main St \u{1F3E0}",
        }),
      ],
    });

    const { bytes } = await buildRoutePdf(hostile, {
      generatedAt: GENERATED_AT,
    });

    expect(Buffer.from(bytes.subarray(0, 5)).toString()).toBe("%PDF-");
  });

  it("is byte-deterministic for a fixed generatedAt", async () => {
    const first = await buildRoutePdf(route(), { generatedAt: GENERATED_AT });
    const second = await buildRoutePdf(route(), { generatedAt: GENERATED_AT });

    expect(Buffer.from(first.bytes).equals(Buffer.from(second.bytes))).toBe(
      true,
    );
  });
});

describe("route PDF round trip", () => {
  it("survives generation, extraction, import and transform", async () => {
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

    const { bytes } = await buildRoutePdf(source, {
      generatedAt: GENERATED_AT,
    });
    const json = await extractEmbeddedRouteJson(bytes);
    const driverRoute = transformSessionToDriverRoute(
      loadSessionFromText(json),
    );

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
    expect(driverRoute.stops[0].address).toBe("123 Main St, New York, NY");
  });

  it("rejects a PDF with no embedded route data", async () => {
    const plain = await PDFDocument.create();
    plain.addPage([200, 200]);
    const bytes = await plain.save({ useObjectStreams: false });

    await expect(extractEmbeddedRouteJson(bytes)).rejects.toThrow(
      /does not contain route data/i,
    );
  });

  it("rejects a file that is not a PDF at all", async () => {
    await expect(
      extractEmbeddedRouteJson(new TextEncoder().encode("just some text")),
    ).rejects.toThrow(/not a readable PDF/i);
  });
});
