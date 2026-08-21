import {
  PDFArray,
  PDFDict,
  PDFDocument,
  PDFHexString,
  PDFName,
  PDFRawStream,
  PDFString,
  decodePDFRawStream,
} from "pdf-lib";

const ATTACHMENT_NAME = "route.json";

const NOT_A_ROUTE_PDF =
  "This PDF does not contain route data. Upload the file exactly as it " +
  "arrived on WhatsApp, without re-saving or exporting it.";

function decodeName(value: unknown): string | undefined {
  if (value instanceof PDFString || value instanceof PDFHexString) {
    return value.decodeText();
  }
  return undefined;
}

/**
 * pdf-lib has no public API for reading attachments, so walk the catalog:
 * Catalog -> Names -> EmbeddedFiles -> Names -> [name, filespec] pairs.
 */
function findEmbeddedFileSpec(
  doc: PDFDocument,
  fileName: string,
): PDFDict | undefined {
  const names = doc.catalog.lookupMaybe(PDFName.of("Names"), PDFDict);
  const embeddedFiles = names?.lookupMaybe(
    PDFName.of("EmbeddedFiles"),
    PDFDict,
  );
  const entries = embeddedFiles?.lookupMaybe(PDFName.of("Names"), PDFArray);

  if (!entries) return undefined;

  // The array alternates name, filespec, name, filespec, ...
  for (let index = 0; index < entries.size(); index += 2) {
    if (decodeName(entries.lookup(index)) !== fileName) continue;

    const fileSpec = entries.lookupMaybe(index + 1, PDFDict);
    if (fileSpec) return fileSpec;
  }

  return undefined;
}

function readFileStream(fileSpec: PDFDict): PDFRawStream | undefined {
  const embedded = fileSpec.lookupMaybe(PDFName.of("EF"), PDFDict);
  const stream = embedded?.lookup(PDFName.of("F"));

  // lookupMaybe has no PDFRawStream overload, so narrow it by hand.
  return stream instanceof PDFRawStream ? stream : undefined;
}

/**
 * Pull the embedded `route.json` out of a route PDF.
 *
 * The returned string is the same save-file JSON that `loadSessionFromText`
 * already accepts, so the rendered page is never parsed.
 */
export async function extractEmbeddedRouteJson(
  bytes: Uint8Array,
): Promise<string> {
  let doc: PDFDocument;

  try {
    doc = await PDFDocument.load(bytes, { throwOnInvalidObject: false });
  } catch (cause) {
    throw new Error("This file is not a readable PDF.", { cause });
  }

  const fileSpec = findEmbeddedFileSpec(doc, ATTACHMENT_NAME);
  if (!fileSpec) {
    throw new Error(NOT_A_ROUTE_PDF);
  }

  const stream = readFileStream(fileSpec);
  if (!stream) {
    throw new Error(NOT_A_ROUTE_PDF);
  }

  const decoded = decodePDFRawStream(stream).decode();
  const text = new TextDecoder().decode(decoded).trim();

  if (!text) {
    throw new Error(NOT_A_ROUTE_PDF);
  }

  return text;
}
