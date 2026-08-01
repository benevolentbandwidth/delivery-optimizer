import { describe, expect, it } from "vitest";
import {
  capacityWarningMessage,
  nextPartialApproval,
  shouldWarnForOverCapacity,
} from "@/app/edit/lib/partialOptimizationApproval";

describe("shouldWarnForOverCapacity", () => {
  it("warns when demand exceeds capacity and partial is not approved", () => {
    expect(shouldWarnForOverCapacity(10, 5, false)).toBe(true);
  });

  it("does not warn when partial optimization is approved", () => {
    expect(shouldWarnForOverCapacity(10, 5, true)).toBe(false);
  });

  it("does not warn when demand fits within capacity", () => {
    expect(shouldWarnForOverCapacity(5, 10, false)).toBe(false);
  });
});

describe("nextPartialApproval", () => {
  it("sets approval on approve", () => {
    expect(nextPartialApproval(false, "approve")).toBe(true);
  });

  it("clears approval on fresh_start after a prior approve", () => {
    const approved = nextPartialApproval(false, "approve");
    expect(nextPartialApproval(approved, "fresh_start")).toBe(false);
  });

  it("clears approval on dismiss after a prior approve", () => {
    const approved = nextPartialApproval(false, "approve");
    expect(nextPartialApproval(approved, "dismiss")).toBe(false);
  });

  it("clears approval on run_finished after a prior approve", () => {
    const approved = nextPartialApproval(false, "approve");
    expect(nextPartialApproval(approved, "run_finished")).toBe(false);
  });
});

describe("capacityWarningMessage", () => {
  it("includes demand and capacity totals", () => {
    expect(capacityWarningMessage(12, 8)).toContain("12");
    expect(capacityWarningMessage(12, 8)).toContain("8");
  });
});
