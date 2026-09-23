import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import type { SendRouteItem } from "@/lib/validation/whatsapp.schema";
import {
  sendRoutesToWhatsApp,
  toWhatsAppRecipientNumber,
} from "@/lib/whatsapp/whatsappClient";

function createRoute(
  vehicleId: string,
  driverPhoneNumber: string,
  driverName: string,
): SendRouteItem {
  return {
    vehicleId,
    driverPhoneNumber,
    route: {
      vehicleId,
      driverName,
      startTime: "9:00 AM",
      stops: [
        {
          id: "stop-1",
          sequence: 1,
          addresseeName: "Ava",
          address: "123 Main St",
          phoneNumber: "+14155550001",
          lat: 40.7295,
          lng: -74.091,
          capacityUsed: 2,
          timeWindow: { kind: "by", time: "11:00 AM" },
          note: "",
        },
      ],
    },
  };
}

function mediaResponse(id = "media-1"): Response {
  return new Response(JSON.stringify({ id }), { status: 200 });
}

function messageResponse(id: string): Response {
  return new Response(JSON.stringify({ messages: [{ id }] }), { status: 200 });
}

/** Split a fetch mock's calls into the /media and /messages halves. */
function callsByResource(fetchMock: ReturnType<typeof vi.fn>) {
  const urls = fetchMock.mock.calls.map((call) => String(call[0]));
  return {
    media: urls.filter((url) => url.endsWith("/media")),
    messages: urls.filter((url) => url.endsWith("/messages")),
  };
}

describe("sendRoutesToWhatsApp", () => {
  beforeEach(() => {
    vi.stubEnv("WHATSAPP_ACCESS_TOKEN", "test-token");
    vi.stubEnv("WHATSAPP_PHONE_NUMBER_ID", "phone-123");
    vi.stubEnv("WHATSAPP_API_BASE_URL", "https://graph.example.com");
    vi.stubEnv("WHATSAPP_API_VERSION", "v23.0");
    vi.stubEnv("WHATSAPP_ROUTE_TEMPLATE_NAME", "driver_route_document");
    vi.stubEnv("WHATSAPP_ROUTE_TEMPLATE_LANGUAGE", "en_US");
    vi.spyOn(console, "error").mockImplementation(() => {});
    vi.spyOn(console, "warn").mockImplementation(() => {});
  });

  afterEach(() => {
    vi.unstubAllEnvs();
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it("uploads a PDF then sends a template for each route", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(mediaResponse("media-1"))
      .mockResolvedValueOnce(messageResponse("wamid.vehicle-1"));
    vi.stubGlobal("fetch", fetchMock);

    const results = await sendRoutesToWhatsApp([
      createRoute("vehicle-1", "+14155551234", "Jim"),
    ]);

    expect(results).toEqual([
      {
        vehicleId: "vehicle-1",
        status: "sent",
        whatsappMessageId: "wamid.vehicle-1",
      },
    ]);

    const { media, messages } = callsByResource(fetchMock);
    expect(media).toEqual(["https://graph.example.com/v23.0/phone-123/media"]);
    expect(messages).toEqual([
      "https://graph.example.com/v23.0/phone-123/messages",
    ]);
  });

  it("uploads the generated PDF as multipart form data", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(mediaResponse())
      .mockResolvedValueOnce(messageResponse("wamid.1"));
    vi.stubGlobal("fetch", fetchMock);

    await sendRoutesToWhatsApp([
      createRoute("vehicle-1", "+14155551234", "Jim"),
    ]);

    const [, init] = fetchMock.mock.calls[0];
    const form = init.body as FormData;

    expect(form).toBeInstanceOf(FormData);
    expect(form.get("messaging_product")).toBe("whatsapp");
    expect(form.get("type")).toBe("application/pdf");
    expect(init.headers).toEqual({ Authorization: "Bearer test-token" });

    const file = form.get("file") as Blob;
    const head = Buffer.from(await file.arrayBuffer())
      .subarray(0, 5)
      .toString();
    expect(head).toBe("%PDF-");
  });

  it("references the uploaded media id in the template header", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(mediaResponse("media-xyz"))
      .mockResolvedValueOnce(messageResponse("wamid.1"));
    vi.stubGlobal("fetch", fetchMock);

    await sendRoutesToWhatsApp([
      createRoute("vehicle-1", "+14155551234", "Jim"),
    ]);

    const [, init] = fetchMock.mock.calls[1];
    const payload = JSON.parse(init.body as string);

    expect(payload.type).toBe("template");
    expect(payload.to).toBe("14155551234");
    expect(payload.template.name).toBe("driver_route_document");
    expect(payload.template.language).toEqual({ code: "en_US" });

    const header = payload.template.components[0];
    expect(header.type).toBe("header");
    expect(header.parameters[0].document.id).toBe("media-xyz");
    expect(header.parameters[0].document.filename).toBe("route-vehicle-1.pdf");

    const body = payload.template.components[1];
    expect(body.parameters).toEqual([{ type: "text", text: "9:00 AM" }]);
  });

  it("does not send a template when the media upload fails", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(new Response("nope", { status: 502 }));
    vi.stubGlobal("fetch", fetchMock);

    const results = await sendRoutesToWhatsApp([
      createRoute("vehicle-1", "+14155551234", "Jim"),
    ]);

    expect(results).toEqual([
      { vehicleId: "vehicle-1", status: "failed", whatsappMessageId: "" },
    ]);
    expect(callsByResource(fetchMock).messages).toHaveLength(0);
  });

  it("reports a failure when the template send is rejected", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(mediaResponse())
      .mockResolvedValueOnce(new Response("bad template", { status: 400 }));
    vi.stubGlobal("fetch", fetchMock);

    const results = await sendRoutesToWhatsApp([
      createRoute("vehicle-1", "+14155551234", "Jim"),
    ]);

    expect(results).toEqual([
      { vehicleId: "vehicle-1", status: "failed", whatsappMessageId: "" },
    ]);
  });

  it("never retries a rejected template send", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(mediaResponse())
      .mockResolvedValueOnce(new Response("boom", { status: 500 }));
    vi.stubGlobal("fetch", fetchMock);

    await sendRoutesToWhatsApp([
      createRoute("vehicle-1", "+14155551234", "Jim"),
    ]);

    expect(callsByResource(fetchMock).messages).toHaveLength(1);
  });

  it("isolates failures so one bad route does not sink the others", async () => {
    const fetchMock = vi.fn().mockImplementation((url: string) => {
      if (String(url).endsWith("/media"))
        return Promise.resolve(mediaResponse());
      return Promise.resolve(messageResponse("wamid.ok"));
    });
    // First route's upload fails; the second should still go out.
    fetchMock.mockResolvedValueOnce(new Response("nope", { status: 502 }));
    vi.stubGlobal("fetch", fetchMock);

    const results = await sendRoutesToWhatsApp([
      createRoute("vehicle-1", "+14155551234", "Jim"),
      createRoute("vehicle-2", "+14155551235", "Sam"),
    ]);

    expect(results.map((r) => r.status)).toEqual(["failed", "sent"]);
  });

  it("treats a 2xx template send without a message id as sent", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(mediaResponse())
      .mockResolvedValueOnce(new Response("{}", { status: 200 }));
    vi.stubGlobal("fetch", fetchMock);

    const results = await sendRoutesToWhatsApp([
      createRoute("vehicle-1", "+14155551234", "Jim"),
    ]);

    expect(results).toEqual([
      { vehicleId: "vehicle-1", status: "sent", whatsappMessageId: "" },
    ]);
  });

  it.each(["WHATSAPP_ACCESS_TOKEN", "WHATSAPP_PHONE_NUMBER_ID"])(
    "fails the route when %s is missing",
    async (name) => {
      vi.stubEnv(name, "");
      vi.stubGlobal("fetch", vi.fn());

      const results = await sendRoutesToWhatsApp([
        createRoute("vehicle-1", "+14155551234", "Jim"),
      ]);

      expect(results[0].status).toBe("failed");
    },
  );

  it("returns an empty array without touching the network", async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);

    await expect(sendRoutesToWhatsApp([])).resolves.toEqual([]);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("caps concurrency at five in-flight routes", async () => {
    let inFlight = 0;
    let maxInFlight = 0;

    const fetchMock = vi.fn().mockImplementation(async (url: string) => {
      inFlight += 1;
      maxInFlight = Math.max(maxInFlight, inFlight);
      await new Promise((resolve) => setTimeout(resolve, 5));
      inFlight -= 1;

      return String(url).endsWith("/media")
        ? mediaResponse()
        : messageResponse("wamid.x");
    });
    vi.stubGlobal("fetch", fetchMock);

    const items = Array.from({ length: 8 }, (_, index) =>
      createRoute(`vehicle-${index}`, "+14155551234", "Jim"),
    );

    await sendRoutesToWhatsApp(items);

    expect(maxInFlight).toBeLessThanOrEqual(5);
  });
});

describe("toWhatsAppRecipientNumber", () => {
  it("strips the leading plus", () => {
    expect(toWhatsAppRecipientNumber("+14155551234")).toBe("14155551234");
  });

  it("leaves an already-bare number alone", () => {
    expect(toWhatsAppRecipientNumber("14155551234")).toBe("14155551234");
  });
});
