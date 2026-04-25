/**
 * CSV upload hook: parses a CSV file into AddressCard[],
 * then bulk-imports them into the edit page state.
 */

import { useCallback, useState } from "react";
import Papa from "papaparse";
import type { AddressCard } from "../types/delivery";
import { resolveColumns, normalizeTimeOption, bufferSecondsToLabel } from "@/app/edit/utils/csvParserUtils";
import { hasAtLeastOneLetter } from "@/app/components/AddressGeocoder/utils";
import { migrateSessionSaveFile } from "@/lib/validation/session.schema";
import { mapOptimizeRequestToEditState } from "../utils/sessionMapper";

type UseCSVUploadArgs = {
  importAddresses: (addresses: AddressCard[]) => void;
};

export function useCSVUpload({ importAddresses }: UseCSVUploadArgs) {
  const [csvError, setCsvError] = useState<string | null>(null);

  const handleCSVUpload = useCallback(
    async (event: React.ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0];
      if (!file) return;

      setCsvError(null);

      try {
        const addresses = await parseAddressUpload(file.name, await file.text());
        importAddresses(addresses);
      } catch (err) {
        setCsvError(
          err instanceof Error
            ? err.message
            : "An unexpected error occurred while processing the upload."
        );
      } finally {
        event.target.value = "";
      }
    },
    [importAddresses],
  );

  const clearCsvError = useCallback(() => setCsvError(null), []);

  return { handleCSVUpload, csvError, clearCsvError };
}

export function parseAddressUpload(
  fileName: string,
  content: string,
): Promise<AddressCard[]> {
  const normalizedName = fileName.toLowerCase();

  if (normalizedName.endsWith(".csv")) {
    return parseCsvAddressUpload(content);
  }

  if (normalizedName.endsWith(".json")) {
    return parseJsonAddressUpload(content);
  }

  throw new Error("Please upload a .csv file or an exported session .json file.");
}

function parseCsvAddressUpload(content: string): Promise<AddressCard[]> {
  return new Promise((resolve, reject) => {
    Papa.parse<Record<string, string>>(content, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        try {
          const addresses = mapCsvRowsToAddresses(
            results.data,
            results.meta.fields ?? [],
          );
          resolve(addresses);
        } catch (error) {
          reject(error);
        }
      },
      error: (error) => {
        reject(new Error(`CSV parsing error: ${error.message}`));
      },
    });
  });
}

function parseJsonAddressUpload(content: string): Promise<AddressCard[]> {
  let parsed: unknown;

  try {
    parsed = JSON.parse(content);
  } catch {
    throw new Error("This file is not valid JSON.");
  }

  try {
    const session = migrateSessionSaveFile(parsed).data;
    return Promise.resolve(mapOptimizeRequestToEditState(session).addresses);
  } catch (error) {
    throw error instanceof Error
      ? error
      : new Error("JSON uploads must use the exported session save format.");
  }
}

function mapCsvRowsToAddresses(
  rows: Record<string, string>[],
  fields: string[],
): AddressCard[] {
  const cols = resolveColumns(fields);
  if (!cols.address) {
    throw new Error(
      'CSV must contain an "address" column (or similar: "delivery address", "street", "location", "destination").',
    );
  }

  const get = (row: Record<string, string>, key: string) =>
    (cols[key] ? row[cols[key]!]?.trim() : undefined) ?? "";

  const addresses: AddressCard[] = [];
  let addrId = 1;

  for (const row of rows) {
    const address = get(row, "address");
    if (!address || !hasAtLeastOneLetter(address)) continue;

    const timeStart = normalizeTimeOption(get(row, "time_window_start"));
    const timeEnd = normalizeTimeOption(get(row, "time_window_end"));

    addresses.push({
      id: addrId++,
      locked: true,
      editingExisting: false,
      recipientAddress: address,
      timeBuffer: bufferSecondsToLabel(get(row, "time_buffer")),
      deliveryTimeStart: timeStart,
      deliveryTimeEnd: timeEnd,
      deliveryQuantity: parseInt(get(row, "demand_value") || "1", 10) || 1,
      notes: get(row, "notes"),
    });
  }

  if (addresses.length === 0) {
    throw new Error("No valid deliveries found in the uploaded file.");
  }

  return addresses;
}
