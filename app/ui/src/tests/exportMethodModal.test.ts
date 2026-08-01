import { describe, expect, it } from "vitest";
import { EXPORT_METHOD_OPTIONS } from "@/app/results/components/ExportMethodModal";

describe("ExportMethodModal options", () => {
  it("offers WhatsApp and JSON export choices", () => {
    expect(EXPORT_METHOD_OPTIONS.map((option) => option.title)).toEqual([
      "Send via WhatsApp",
      "Export Routes",
    ]);
  });

  it("explains what each export method does", () => {
    expect(EXPORT_METHOD_OPTIONS[0].description).toContain("WhatsApp");
    expect(EXPORT_METHOD_OPTIONS[1].description).toContain(
      "Download a file per route",
    );
  });
});
