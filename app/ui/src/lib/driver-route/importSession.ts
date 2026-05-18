import { ZodError, z } from "zod";

import type { DriverRoute, OptimizeRequestLike } from "./types";

const MAX_SESSION_FILE_BYTES = 1_000_000;

const locationSchema = z.object({
  lat: z.number(),
  lng: z.number(),
});

const demandSchema = z.object({
  value: z.number().optional(),
});

const deliverySchema = z.object({
  id: z.number(),
  recipientName: z.string().optional(),
  phoneNumber: z.string().optional(),
  address: z.string().optional(),
  notes: z.string().optional(),
  location: locationSchema.optional(),
  demand: demandSchema.optional(),
});

const vehicleSchema = z.object({
  id: z.number(),
  driverName: z.string().optional(),
  vehicleType: z.string().optional(),
});

const optimizeRequestSchema = z.object({
  deliveries: z.array(deliverySchema),
  vehicles: z.array(vehicleSchema),
});

const sessionSaveV1Schema = z.object({
  version: z.literal(1),
  savedAt: z.string().datetime(),
  data: optimizeRequestSchema,
});

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

type SessionSaveFile = z.infer<typeof sessionSaveV1Schema>;
type PersistedRouteState = z.infer<typeof persistedRouteStateSchema>;

// Guard the browser import path before we spend time parsing a file.
export async function loadSessionFromFile(
  file: Pick<File, "name" | "size" | "type" | "text">,
): Promise<OptimizeRequestLike> {
  const isJson =
    file.type === "application/json" ||
    file.name.toLowerCase().endsWith(".json");

  if (!isJson) {
    throw new Error("Please select a valid .json save file.");
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
    return parseSessionSaveFile(parsed).data;
  } catch (error) {
    try {
      // Also accept the raw optimize request shape for test fixtures and
      // simple hand-authored JSON files.
      return optimizeRequestSchema.parse(parsed);
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

function parseSessionSaveFile(input: unknown): SessionSaveFile {
  return sessionSaveV1Schema.parse(input);
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
