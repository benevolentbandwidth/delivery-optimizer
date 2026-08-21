import { ZodError, z } from "zod";

import type { DriverRoute, OptimizeRequestLike } from "./types";
import {
  migrateSessionSaveFile,
  sessionSaveDataSchema,
} from "@/lib/validation/session.schema";

const MAX_SESSION_FILE_BYTES = 1_000_000;

const persistedStopSchema = z.object({
  id: z.string(),
  stopNumber: z.number(),
  address: z.string(),
  customerName: z.string(),
  phoneNumber: z.string().optional(),
  packageCount: z.number(),
  notes: z.string(),
  status: z.enum(["pending", "completed", "failed"]),
  lat: z.number(),
  lng: z.number(),
  completedAt: z.string().optional(),
  failureReason: z.string().optional(),
});

const persistedRouteSchema = z.object({
  driverName: z.string(),
  routeLabel: z.string(),
  stops: z.array(persistedStopSchema),
});

const persistedRouteStateSchema = z.object({
  version: z.literal(1),
  savedAt: z.string().datetime(),
  route: persistedRouteSchema,
});

type PersistedRouteState = z.infer<typeof persistedRouteStateSchema>;

const MAX_ROUTE_PDF_BYTES = 10_000_000;

// Guard the browser import path before we spend time parsing a file.
export async function loadSessionFromFile(
  file: Pick<File, "name" | "size" | "type" | "text" | "arrayBuffer">,
): Promise<OptimizeRequestLike> {
  const name = file.name.toLowerCase();
  const isPdf = file.type === "application/pdf" || name.endsWith(".pdf");
  const isJson = file.type === "application/json" || name.endsWith(".json");

  if (isPdf) {
    if (file.size > MAX_ROUTE_PDF_BYTES) {
      throw new Error("File is too large to import.");
    }

    // Loaded lazily so the pdf-lib bundle is only fetched when a driver
    // actually imports a PDF.
    const { extractEmbeddedRouteJson } =
      await import("./extractRouteJsonFromPdf");
    const bytes = new Uint8Array(await file.arrayBuffer());
    return loadSessionFromText(await extractEmbeddedRouteJson(bytes));
  }

  if (!isJson) {
    throw new Error("Please select the route PDF you were sent.");
  }

  if (file.size > MAX_SESSION_FILE_BYTES) {
    throw new Error("File is too large to import.");
  }

  const text = await file.text();
  return loadSessionFromText(text);
}

export function loadSessionFromText(text: string): OptimizeRequestLike {
  if (text.length === 0) {
    throw new Error("Invalid file contents.");
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(text);
  } catch {
    throw new Error("This file is not valid JSON.");
  }

  try {
    // Preferred route-manager save file shape.
    return migrateSessionSaveFile(parsed).data;
  } catch (error) {
    try {
      // Also accept the same data shape without the version/savedAt envelope.
      return sessionSaveDataSchema.parse(parsed);
    } catch {
      throw new Error(
        formatValidationError(error) ?? "Invalid save file format.",
      );
    }
  }
}

// Local progress uses a small envelope, separate from imported save files.
export function createPersistedRouteState(
  route: DriverRoute,
): PersistedRouteState {
  return {
    version: 1,
    savedAt: new Date().toISOString(),
    route,
  };
}

export function parsePersistedRouteState(input: unknown): PersistedRouteState {
  return persistedRouteStateSchema.parse(input);
}

function formatValidationError(error: unknown): string | null {
  if (!(error instanceof ZodError)) {
    return error instanceof Error ? error.message : null;
  }

  // Return the first useful location instead of dumping the whole Zod payload.
  const issue = error.issues[0];
  if (!issue) return null;

  const path =
    Array.isArray(issue.path) && issue.path.length
      ? issue.path.join(".")
      : "file";

  return `Invalid save file format at "${path}".`;
}
