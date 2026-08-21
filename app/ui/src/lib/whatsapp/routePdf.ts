import fontkit from "@pdf-lib/fontkit";
import {
  AFRelationship,
  PDFDocument,
  rgb,
  type PDFFont,
  type PDFPage,
  type RGB,
} from "pdf-lib";

import type { Route, Stop } from "@/app/results/types";

import { loadManropeFonts, type ManropeFonts } from "./manropeFont";
import { routeToSessionSaveFile } from "./routeToSessionSave";

const PAGE_WIDTH = 612; // US Letter
const PAGE_HEIGHT = 792;
const MARGIN = 48;
const CONTENT_WIDTH = PAGE_WIDTH - MARGIN * 2;

const TITLE_SIZE = 20;
const HEADING_SIZE = 12;
const BODY_SIZE = 10;
const SMALL_SIZE = 8;

const LINE_GAP = 14;
const BLOCK_GAP = 10;

const INK = rgb(0.1, 0.1, 0.1);
const MUTED = rgb(0.45, 0.45, 0.45);
const RULE = rgb(0.85, 0.85, 0.85);

const ATTACHMENT_NAME = "route.json";

export type RoutePdf = {
  bytes: Uint8Array;
  filename: string;
};

type Renderer = {
  doc: PDFDocument;
  regular: PDFFont;
  bold: PDFFont;
  page: PDFPage;
  y: number;
};

type TextOptions = {
  bold?: boolean;
  size?: number;
  color?: RGB;
  indent?: number;
  gap?: number;
};

/**
 * Drop code points Manrope cannot render (emoji, CJK, joiners) so free-text
 * notes never come out as rows of blank .notdef boxes.
 */
export function sanitizeForPdf(
  value: string,
  supportsCodePoint: (codePoint: number) => boolean,
): string {
  const kept: string[] = [];

  for (const character of value.normalize("NFC")) {
    const codePoint = character.codePointAt(0);
    if (codePoint === undefined) continue;

    // Tabs and newlines collapse to a space; other control chars are dropped.
    if (codePoint < 0x20 || codePoint === 0x7f) {
      if (character === "\t" || character === "\n" || character === "\r") {
        kept.push(" ");
      }
      continue;
    }

    if (supportsCodePoint(codePoint)) {
      kept.push(character);
    }
  }

  return kept.join("").replace(/\s+/g, " ").trim();
}

/** Greedy word wrap — pdf-lib draws raw strings and does not wrap on its own. */
export function wrapText(
  value: string,
  font: PDFFont,
  size: number,
  maxWidth: number,
): string[] {
  if (!value) return [];

  const lines: string[] = [];
  let current = "";

  for (const word of value.split(" ")) {
    const candidate = current ? `${current} ${word}` : word;

    if (current && font.widthOfTextAtSize(candidate, size) > maxWidth) {
      lines.push(current);
      current = word;
    } else {
      current = candidate;
    }
  }

  if (current) lines.push(current);
  return lines;
}

function addPage(renderer: Renderer): void {
  renderer.page = renderer.doc.addPage([PAGE_WIDTH, PAGE_HEIGHT]);
  renderer.y = PAGE_HEIGHT - MARGIN;
}

function ensureSpace(renderer: Renderer, needed: number): void {
  if (renderer.y - needed < MARGIN) {
    addPage(renderer);
  }
}

function drawLine(
  renderer: Renderer,
  text: string,
  options: TextOptions = {},
): void {
  const size = options.size ?? BODY_SIZE;
  const gap = options.gap ?? LINE_GAP;

  ensureSpace(renderer, gap);
  renderer.page.drawText(text, {
    x: MARGIN + (options.indent ?? 0),
    y: renderer.y - size,
    size,
    font: options.bold ? renderer.bold : renderer.regular,
    color: options.color ?? INK,
  });
  renderer.y -= gap;
}

function drawWrapped(
  renderer: Renderer,
  text: string,
  options: TextOptions = {},
): void {
  const size = options.size ?? BODY_SIZE;
  const indent = options.indent ?? 0;
  const font = options.bold ? renderer.bold : renderer.regular;

  for (const line of wrapText(text, font, size, CONTENT_WIDTH - indent)) {
    drawLine(renderer, line, options);
  }
}

function drawRule(renderer: Renderer): void {
  ensureSpace(renderer, BLOCK_GAP);
  renderer.page.drawLine({
    start: { x: MARGIN, y: renderer.y },
    end: { x: PAGE_WIDTH - MARGIN, y: renderer.y },
    thickness: 0.75,
    color: RULE,
  });
  renderer.y -= BLOCK_GAP;
}

/** "By 11:00 AM" / "From 9:00 AM" / "At 11:00 AM" */
function formatArrival(stop: Stop): string | undefined {
  const time = stop.timeWindow?.time?.trim();
  if (!time) return undefined;

  switch (stop.timeWindow.kind) {
    case "by":
      return `By ${time}`;
    case "from":
      return `From ${time}`;
    default:
      return time;
  }
}

function formatDeliveryWindow(stop: Stop): string | undefined {
  const start = stop.deliveryWindowStart?.trim();
  const end = stop.deliveryWindowEnd?.trim();

  if (start && end) return `${start} - ${end}`;
  if (end) return `Before ${end}`;
  if (start) return `After ${start}`;
  return undefined;
}

function labelledLines(pairs: [string, string | undefined][]): string[] {
  return pairs
    .filter((pair): pair is [string, string] => Boolean(pair[1]))
    .map(([label, value]) => `${label}: ${value}`);
}

function drawHeader(
  renderer: Renderer,
  route: Route,
  clean: (value: string | undefined) => string | undefined,
  generatedAt: Date,
): void {
  drawLine(renderer, "Delivery Route", {
    bold: true,
    size: TITLE_SIZE,
    gap: TITLE_SIZE + 12,
  });

  const stopCount = route.stops.length;
  const summary = labelledLines([
    ["Driver", clean(route.driverName)],
    ["Vehicle", clean(route.vehicleId)],
    ["Date", generatedAt.toLocaleDateString("en-US", { dateStyle: "long" })],
    ["Start time", clean(route.startTime)],
    ["Depot", clean(route.startLocation?.address)],
    ["Stops", String(stopCount)],
    [
      "Total distance",
      route.distanceMi != null ? `${route.distanceMi} mi` : undefined,
    ],
    [
      "Estimated time",
      route.estimatedTimeMinutes != null
        ? `${route.estimatedTimeMinutes} min`
        : undefined,
    ],
  ]);

  for (const line of summary) {
    drawWrapped(renderer, line, { size: HEADING_SIZE });
  }

  drawRule(renderer);
}

function drawStop(
  renderer: Renderer,
  stop: Stop,
  position: number,
  total: number,
  clean: (value: string | undefined) => string | undefined,
): void {
  const address = clean(stop.address) ?? "No address provided";
  const details = labelledLines([
    ["Name", clean(stop.addresseeName)],
    ["Phone", clean(stop.phoneNumber)],
    ["Quantity", stop.capacityUsed > 0 ? String(stop.capacityUsed) : undefined],
    ["Arrival", clean(formatArrival(stop))],
    ["Delivery window", clean(formatDeliveryWindow(stop))],
    [
      "Est. duration",
      stop.serviceMinutes != null ? `${stop.serviceMinutes} min` : undefined,
    ],
    ["Notes", clean(stop.note)],
  ]);

  // Keep the stop heading with at least its first detail line.
  ensureSpace(renderer, LINE_GAP * 3);

  drawLine(renderer, `Stop ${position} of ${total}`, {
    bold: true,
    size: HEADING_SIZE,
  });
  drawWrapped(renderer, address, { bold: true, indent: 12 });

  for (const line of details) {
    drawWrapped(renderer, line, { indent: 12 });
  }

  drawLine(renderer, `${stop.lat.toFixed(5)}, ${stop.lng.toFixed(5)}`, {
    size: SMALL_SIZE,
    color: MUTED,
    indent: 12,
  });

  renderer.y -= BLOCK_GAP;
}

function drawPageFooters(doc: PDFDocument, font: PDFFont): void {
  const pages = doc.getPages();

  pages.forEach((page, index) => {
    const label = `Page ${index + 1} of ${pages.length}`;
    const width = font.widthOfTextAtSize(label, SMALL_SIZE);

    page.drawText(label, {
      x: PAGE_WIDTH - MARGIN - width,
      y: MARGIN - 22,
      size: SMALL_SIZE,
      font,
      color: MUTED,
    });
  });
}

function pdfFilename(route: Route): string {
  const slug =
    route.vehicleId
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "") || "route";

  return `route-${slug}.pdf`;
}

function orderedStops(route: Route): Stop[] {
  return [...route.stops].sort((a, b) => a.sequence - b.sequence);
}

async function embedFonts(
  doc: PDFDocument,
  fonts: ManropeFonts,
): Promise<{ regular: PDFFont; bold: PDFFont }> {
  doc.registerFontkit(fontkit);

  const [regular, bold] = await Promise.all([
    doc.embedFont(fonts.regular, { subset: true }),
    doc.embedFont(fonts.bold, { subset: true }),
  ]);

  return { regular, bold };
}

/**
 * Render a driver-facing route sheet, with the same route data embedded as a
 * `route.json` attachment so /upload-route can read it back without parsing
 * the rendered page.
 */
export async function buildRoutePdf(
  route: Route,
  options: { generatedAt?: Date } = {},
): Promise<RoutePdf> {
  const generatedAt = options.generatedAt ?? new Date();
  const fonts = await loadManropeFonts();
  const clean = (value: string | undefined): string | undefined => {
    const sanitized = value
      ? sanitizeForPdf(value, fonts.supportsCodePoint)
      : "";
    return sanitized || undefined;
  };

  const doc = await PDFDocument.create();
  const { regular, bold } = await embedFonts(doc, fonts);

  const renderer: Renderer = {
    doc,
    regular,
    bold,
    page: doc.addPage([PAGE_WIDTH, PAGE_HEIGHT]),
    y: PAGE_HEIGHT - MARGIN,
  };

  drawHeader(renderer, route, clean, generatedAt);

  const stops = orderedStops(route);
  stops.forEach((stop, index) => {
    drawStop(renderer, stop, index + 1, stops.length, clean);
  });

  drawPageFooters(doc, regular);

  doc.setTitle(
    `Delivery route - ${clean(route.driverName) ?? route.vehicleId}`,
  );
  doc.setAuthor("Benevolent Bandwidth");
  doc.setCreator("Benevolent Bandwidth Delivery Optimizer");
  doc.setCreationDate(generatedAt);
  doc.setModificationDate(generatedAt);

  // The attachment is the machine-readable half of the handoff; it is what
  // /upload-route reads back, so the printed layout can change freely.
  const saveFile = routeToSessionSaveFile(route, generatedAt.toISOString());
  await doc.attach(
    new TextEncoder().encode(JSON.stringify(saveFile)),
    ATTACHMENT_NAME,
    {
      mimeType: "application/json",
      description: "Machine-readable route data for the driver app",
      creationDate: generatedAt,
      modificationDate: generatedAt,
      afRelationship: AFRelationship.Data,
    },
  );

  // Object streams would hide /EmbeddedFiles inside a compressed stream, which
  // the extractor cannot walk.
  const bytes = await doc.save({ useObjectStreams: false });

  return { bytes, filename: pdfFilename(route) };
}
