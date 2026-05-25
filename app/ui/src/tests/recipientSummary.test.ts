import { describe, it, expect } from "vitest";
import {
  hasRecipientContact,
  recipientSummary,
} from "@/app/edit/utils/recipientSummary";

describe("recipientSummary", () => {
  it("returns name and phone joined with middle dot when both set", () => {
    expect(
      recipientSummary({
        recipientName: "Jane Doe",
        phoneNumber: "555-123-4567",
      }),
    ).toBe("Jane Doe · 555-123-4567");
  });

  it("returns name only when phone is blank", () => {
    expect(
      recipientSummary({ recipientName: "Jane Doe", phoneNumber: "" }),
    ).toBe("Jane Doe");
  });

  it("returns phone only when name is blank", () => {
    expect(
      recipientSummary({ recipientName: "", phoneNumber: "555-123-4567" }),
    ).toBe("555-123-4567");
  });

  it("returns em dash when both are blank", () => {
    expect(recipientSummary({ recipientName: "", phoneNumber: "" })).toBe("—");
  });
});

describe("hasRecipientContact", () => {
  it("is false when both fields are whitespace only", () => {
    expect(hasRecipientContact({ recipientName: "  ", phoneNumber: " " })).toBe(
      false,
    );
  });

  it("is true when either field has content", () => {
    expect(
      hasRecipientContact({ recipientName: "Jane", phoneNumber: "" }),
    ).toBe(true);
    expect(hasRecipientContact({ recipientName: "", phoneNumber: "555" })).toBe(
      true,
    );
  });
});
