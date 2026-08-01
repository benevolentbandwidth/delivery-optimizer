import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  sendRoutesToWhatsApp,
  toWhatsAppRecipientNumber,
} from "@/lib/whatsapp/whatsappClient";
import { formatWhatsAppRouteMessage } from "@/lib/whatsapp/formatRouteMessage";
import type { SendRouteItem } from "@/lib/validation/whatsapp.schema";

function createRoute(
  vehicleId: string,
  driverPhoneNumber: string,
  driverName: string,
): SendRouteItem {
  return {
    vehicleId,
    driverPhoneNumber,
    route: {
      driverName,
      stops: [
        {
          sequence: 1,
          addresseeName: "Ava",
          address: "123 Main St",
          phoneNumber: "+14155550001",
        },
      ],
    },
  };
}

describe("sendRoutesToWhatsApp", () => {
  beforeEach(() => {
    vi.stubEnv("DELIVERYOPTIMIZER_API_URL", "https://api.example.com/");
    vi.stubEnv("WHATSAPP_SEND_ROUTE_SECRET", "test-secret");
  });

  afterEach(() => {
    vi.unstubAllEnvs();
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it("sends each route to the backend and maps WhatsApp message IDs", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(
        new Response(JSON.stringify({ messages: [{ id: "wamid.vehicle-1" }] })),
      )
      .mockResolvedValueOnce(
        new Response(JSON.stringify({ messages: [{ id: "wamid.vehicle-2" }] })),
      );
    vi.stubGlobal("fetch", fetchMock);
    const items: SendRouteItem[] = [
      createRoute("vehicle-1", "+14155551234", "Jim"),
      createRoute("vehicle-2", "+14155551235", "Sam"),
    ];

    const results = await sendRoutesToWhatsApp(items);

    expect(results).toEqual([
      {
        vehicleId: "vehicle-1",
        status: "sent",
        whatsappMessageId: "wamid.vehicle-1",
      },
      {
        vehicleId: "vehicle-2",
        status: "sent",
        whatsappMessageId: "wamid.vehicle-2",
      },
    ]);
    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(fetchMock).toHaveBeenNthCalledWith(
      1,
      "https://api.example.com/api/whatsapp/send-route",
      expect.objectContaining({
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-WhatsApp-Send-Secret": "test-secret",
        },
        body: JSON.stringify({
          to: "14155551234",
          message: formatWhatsAppRouteMessage(items[0].route),
        }),
      }),
    );
    expect(fetchMock).toHaveBeenNthCalledWith(
      2,
      "https://api.example.com/api/whatsapp/send-route",
      expect.objectContaining({
        body: JSON.stringify({
          to: "14155551235",
          message: formatWhatsAppRouteMessage(items[1].route),
        }),
      }),
    );
  });

  it("maps backend and network failures, and treats malformed 2xx as sent", async () => {
    const errorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});

    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify({ error: "WhatsApp upstream request failed." }),
          { status: 502 },
        ),
      )
      .mockRejectedValueOnce(new TypeError("Network request failed"))
      .mockResolvedValueOnce(new Response("{"));
    vi.stubGlobal("fetch", fetchMock);

    const results = await sendRoutesToWhatsApp([
      createRoute("backend-failure", "+14155551234", "Jim"),
      createRoute("network-failure", "+14155551235", "Sam"),
      createRoute("malformed-response", "+14155551236", "Ava"),
    ]);

    expect(results).toEqual([
      {
        vehicleId: "backend-failure",
        status: "failed",
        whatsappMessageId: "",
      },
      {
        vehicleId: "network-failure",
        status: "failed",
        whatsappMessageId: "",
      },
      {
        vehicleId: "malformed-response",
        status: "sent",
        whatsappMessageId: "",
      },
    ]);
    expect(fetchMock).toHaveBeenCalledTimes(3);
    expect(errorSpy).toHaveBeenCalled();
    expect(warnSpy).toHaveBeenCalled();
  });

  it("does not retry transient 502 responses for non-idempotent sends", async () => {
    const errorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(
        new Response(JSON.stringify({ error: "temporary" }), { status: 502 }),
      )
      .mockResolvedValueOnce(
        new Response(JSON.stringify({ messages: [{ id: "wamid.retry" }] })),
      );
    vi.stubGlobal("fetch", fetchMock);

    const results = await sendRoutesToWhatsApp([
      createRoute("vehicle-1", "+14155551234", "Jim"),
    ]);

    expect(results).toEqual([
      {
        vehicleId: "vehicle-1",
        status: "failed",
        whatsappMessageId: "",
      },
    ]);
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(errorSpy).toHaveBeenCalled();
  });

  it.each(["DELIVERYOPTIMIZER_API_URL", "WHATSAPP_SEND_ROUTE_SECRET"])(
    "requires %s for non-empty sends",
    async (variableName) => {
      vi.stubEnv(variableName, " ");
      const fetchMock = vi.fn();
      vi.stubGlobal("fetch", fetchMock);

      await expect(
        sendRoutesToWhatsApp([createRoute("vehicle-1", "+14155551234", "Jim")]),
      ).rejects.toThrow(
        `${variableName} must be configured to send WhatsApp routes.`,
      );
      expect(fetchMock).not.toHaveBeenCalled();
    },
  );

  it("resolves an empty array for an empty input list", async () => {
    expect(await sendRoutesToWhatsApp([])).toEqual([]);
  });

  it("formats E.164 numbers for the WhatsApp recipient field", () => {
    expect(toWhatsAppRecipientNumber("+14155551234")).toBe("14155551234");
    expect(toWhatsAppRecipientNumber("14155551234")).toBe("14155551234");
  });

  it("caps concurrent in-flight sends", async () => {
    let inFlight = 0;
    let maxInFlight = 0;
    const fetchMock = vi.fn().mockImplementation(async () => {
      inFlight += 1;
      maxInFlight = Math.max(maxInFlight, inFlight);
      await new Promise((resolve) => setTimeout(resolve, 20));
      inFlight -= 1;
      return new Response(JSON.stringify({ messages: [{ id: "wamid.x" }] }));
    });
    vi.stubGlobal("fetch", fetchMock);

    const items = Array.from({ length: 8 }, (_, i) =>
      createRoute(`vehicle-${i}`, `+1415555123${i}`, `Driver ${i}`),
    );
    const results = await sendRoutesToWhatsApp(items);

    expect(results).toHaveLength(8);
    expect(results.every((r) => r.status === "sent")).toBe(true);
    expect(maxInFlight).toBeLessThanOrEqual(5);
    expect(fetchMock).toHaveBeenCalledTimes(8);
  });
});
