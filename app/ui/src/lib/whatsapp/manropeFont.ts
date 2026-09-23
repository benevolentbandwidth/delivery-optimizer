import fs from "node:fs/promises";
import path from "node:path";

import fontkit from "@pdf-lib/fontkit";

/**
 * Manrope is vendored as static TTFs because pdf-lib cannot embed the .woff2
 * that next/font/google produces. The files are pulled into the deployed
 * bundle by `outputFileTracingIncludes` in next.config.ts — Next's tracer
 * cannot see a runtime fs read on its own.
 */
const FONT_DIR = path.join(process.cwd(), "src", "assets", "fonts");

const REGULAR_FILE = "Manrope-Regular.ttf";
const BOLD_FILE = "Manrope-Bold.ttf";

export type ManropeFonts = {
  regular: Uint8Array;
  bold: Uint8Array;
  /** True when the font can render the code point; false means .notdef. */
  supportsCodePoint: (codePoint: number) => boolean;
};

let cached: Promise<ManropeFonts> | undefined;

async function readFontFile(fileName: string): Promise<Uint8Array> {
  const fullPath = path.join(FONT_DIR, fileName);

  try {
    return new Uint8Array(await fs.readFile(fullPath));
  } catch (cause) {
    throw new Error(
      `Could not read the Manrope font at ${fullPath}. Route PDFs cannot be ` +
        `generated without it — check that src/assets/fonts is listed in ` +
        `outputFileTracingIncludes in next.config.ts.`,
      { cause },
    );
  }
}

async function loadFonts(): Promise<ManropeFonts> {
  const [regular, bold] = await Promise.all([
    readFontFile(REGULAR_FILE),
    readFontFile(BOLD_FILE),
  ]);

  // Regular and bold ship the same character set, so one coverage table is
  // enough to decide whether a code point will render.
  const coverage = fontkit.create(Buffer.from(regular));

  return {
    regular,
    bold,
    supportsCodePoint: (codePoint) => coverage.hasGlyphForCodePoint(codePoint),
  };
}

/** Reads and caches the vendored Manrope faces for the lifetime of the process. */
export function loadManropeFonts(): Promise<ManropeFonts> {
  cached ??= loadFonts().catch((error: unknown) => {
    // Do not cache the failure; a transient read error should be retryable.
    cached = undefined;
    throw error;
  });

  return cached;
}
