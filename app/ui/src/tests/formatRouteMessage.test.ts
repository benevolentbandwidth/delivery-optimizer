import { describe, expect, it } from "vitest";
import { formatWhatsAppRouteMessage } from "@/lib/whatsapp/formatRouteMessage";

describe("formatWhatsAppRouteMessage", () => {
  it("formats the driver template with ordered stops", () => {
    const message = formatWhatsAppRouteMessage({
      driverName: "Jim",
      stops: [
        {
          sequence: 2,
          addresseeName: "Sam",
          address: "45 Oak Ave",
          phoneNumber: "+14155550002",
        },
        {
          sequence: 1,
          addresseeName: "Ava",
          address: "123 Main St",
          phoneNumber: "+14155550001",
        },
      ],
    });

    expect(message).toBe(
      [
        "Hello Jim,",
        "",
        "Here are today's delivery stops:",
        "",
        "📍 Name: Ava",
        "🏠 Address: 123 Main St",
        "📞 Phone: +14155550001",
        "",
        "🛑 Stop 1 of 2",
        "",
        "📍 Name: Sam",
        "🏠 Address: 45 Oak Ave",
        "📞 Phone: +14155550002",
        "",
        "🛑 Stop 2 of 2",
        "",
        "Thank you!",
      ].join("\n"),
    );
  });

  it("falls back for missing name and phone", () => {
    const message = formatWhatsAppRouteMessage({
      driverName: "Jim",
      stops: [{ sequence: 1, address: "123 Main St" }],
    });

    expect(message).toContain("📍 Name: —");
    expect(message).toContain("🏠 Address: 123 Main St");
    expect(message).toContain("📞 Phone: —");
    expect(message).toContain("🛑 Stop 1 of 1");
  });

  it("handles routes with no stops", () => {
    expect(formatWhatsAppRouteMessage({ driverName: "Jim" })).toContain(
      "(No stops on this route)",
    );
  });

  it("truncates with a more-stops suffix when over the WhatsApp limit", () => {
    const longAddress = "A".repeat(800);
    const stops = Array.from({ length: 20 }, (_, i) => ({
      sequence: i + 1,
      addresseeName: `Person ${i + 1}`,
      address: longAddress,
      phoneNumber: `+1415555${String(i).padStart(4, "0")}`,
    }));

    const message = formatWhatsAppRouteMessage({
      driverName: "Jim",
      stops,
    });

    expect(message.length).toBeLessThanOrEqual(4096 + 50);
    expect(message).toMatch(/…and \d+ more stops/);
    expect(message).toContain("Thank you!");
    expect(message).toContain("🛑 Stop 1 of 20");
  });
});
