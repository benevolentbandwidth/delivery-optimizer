/**
 * Thin client for Meta's WhatsApp Cloud API.
 *
 * Drivers are contacted cold, with no open 24-hour session, so every send is an
 * approved template message carrying the route PDF as a document header. That
 * takes two calls: upload the PDF to /media for an id, then reference the id in
 * the template send.
 */

const DEFAULT_BASE_URL = "https://graph.facebook.com";
const DEFAULT_API_VERSION = "v23.0";
const DEFAULT_TEMPLATE_NAME = "driver_route_document";
const DEFAULT_TEMPLATE_LANGUAGE = "en_US";
const DEFAULT_TIMEOUT_MS = 60_000;

const PDF_MIME_TYPE = "application/pdf";

export type SendTemplateResult = {
  messageId: string;
};

type MetaConfig = {
  baseUrl: string;
  apiVersion: string;
  phoneNumberId: string;
  accessToken: string;
  templateName: string;
  templateLanguage: string;
};

function requiredEnv(name: string): string {
  const value = process.env[name]?.trim();

  if (!value) {
    throw new Error(`${name} must be configured to send WhatsApp routes.`);
  }

  return value;
}

function envOrDefault(name: string, fallback: string): string {
  return process.env[name]?.trim() || fallback;
}

function timeoutMs(): number {
  const configured = Number(process.env.WHATSAPP_API_TIMEOUT_MS);
  return Number.isFinite(configured) && configured > 0
    ? configured
    : DEFAULT_TIMEOUT_MS;
}

/**
 * Read lazily, never at module scope: CI jobs that only build the app do not
 * set these, and a module-scope read would fail at import time.
 */
function readConfig(): MetaConfig {
  return {
    baseUrl: envOrDefault("WHATSAPP_API_BASE_URL", DEFAULT_BASE_URL).replace(
      /\/+$/,
      "",
    ),
    apiVersion: envOrDefault("WHATSAPP_API_VERSION", DEFAULT_API_VERSION),
    phoneNumberId: requiredEnv("WHATSAPP_PHONE_NUMBER_ID"),
    accessToken: requiredEnv("WHATSAPP_ACCESS_TOKEN"),
    templateName: envOrDefault(
      "WHATSAPP_ROUTE_TEMPLATE_NAME",
      DEFAULT_TEMPLATE_NAME,
    ),
    templateLanguage: envOrDefault(
      "WHATSAPP_ROUTE_TEMPLATE_LANGUAGE",
      DEFAULT_TEMPLATE_LANGUAGE,
    ),
  };
}

function endpoint(config: MetaConfig, resource: string): string {
  return `${config.baseUrl}/${config.apiVersion}/${config.phoneNumberId}/${resource}`;
}

async function fetchWithTimeout(
  url: string,
  options: RequestInit,
): Promise<Response> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs());

  try {
    return await fetch(url, { ...options, signal: controller.signal });
  } finally {
    clearTimeout(timeoutId);
  }
}

async function readBody(response: Response): Promise<unknown> {
  const text = await response.text();
  if (!text) return undefined;

  try {
    return JSON.parse(text);
  } catch {
    return text;
  }
}

function bodySnippet(body: unknown, maxLength = 500): string {
  if (body === undefined) return "";

  const raw = typeof body === "string" ? body : JSON.stringify(body);
  return raw.length > maxLength ? `${raw.slice(0, maxLength)}…` : raw;
}

/**
 * Errors are deliberately generic. Meta echoes request detail in failures, and
 * the access token is in scope here — neither should reach a caller or a log
 * line that might be surfaced to the UI.
 */
function failed(stage: string, response: Response, body: unknown): Error {
  console.error(
    `[whatsapp] ${stage} failed: HTTP ${response.status}`,
    bodySnippet(body),
  );

  return new Error(`WhatsApp ${stage} failed.`);
}

/** Strip anything that could break out of the Content-Disposition header. */
function safeFilename(filename: string): string {
  const cleaned = filename.replace(/[^\w.\-]+/g, "-").replace(/^-+|-+$/g, "");
  return (cleaned || "route").slice(0, 128);
}

/**
 * Upload the route PDF and return its media id. Ids are single-use per send and
 * expire on Meta's side after 30 days.
 */
export async function uploadRouteDocument(
  pdf: Uint8Array,
  filename: string,
): Promise<string> {
  const config = readConfig();

  const form = new FormData();
  form.append("messaging_product", "whatsapp");
  form.append("type", PDF_MIME_TYPE);
  form.append(
    "file",
    new Blob([pdf as BlobPart], { type: PDF_MIME_TYPE }),
    safeFilename(filename),
  );

  const response = await fetchWithTimeout(endpoint(config, "media"), {
    method: "POST",
    // Content-Type is intentionally unset so fetch adds the multipart boundary.
    headers: { Authorization: `Bearer ${config.accessToken}` },
    body: form,
  });

  const body = await readBody(response);
  if (!response.ok) {
    throw failed("media upload", response, body);
  }

  const mediaId = (body as { id?: unknown } | undefined)?.id;
  if (typeof mediaId !== "string" || !mediaId) {
    throw failed("media upload", response, body);
  }

  return mediaId;
}

/**
 * Send the approved route template with the uploaded PDF as its document header.
 */
export async function sendRouteTemplateMessage(params: {
  to: string;
  mediaId: string;
  filename: string;
  templateParameters: string[];
}): Promise<SendTemplateResult> {
  const config = readConfig();

  const components: Record<string, unknown>[] = [
    {
      type: "header",
      parameters: [
        {
          type: "document",
          document: {
            id: params.mediaId,
            filename: safeFilename(params.filename),
          },
        },
      ],
    },
  ];

  // Meta rejects a body component with an empty parameters array.
  if (params.templateParameters.length > 0) {
    components.push({
      type: "body",
      parameters: params.templateParameters.map((text) => ({
        type: "text",
        text,
      })),
    });
  }

  const response = await fetchWithTimeout(endpoint(config, "messages"), {
    method: "POST",
    headers: {
      Authorization: `Bearer ${config.accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      messaging_product: "whatsapp",
      recipient_type: "individual",
      to: params.to,
      type: "template",
      template: {
        name: config.templateName,
        language: { code: config.templateLanguage },
        components,
      },
    }),
  });

  const body = await readBody(response);
  if (!response.ok) {
    throw failed("template send", response, body);
  }

  const messages = (body as { messages?: unknown } | undefined)?.messages;
  const messageId = Array.isArray(messages)
    ? (messages[0] as { id?: unknown } | undefined)?.id
    : undefined;

  if (typeof messageId !== "string" || !messageId) {
    console.warn(
      "[whatsapp] template send succeeded without a message id",
      bodySnippet(body),
    );
  }

  return { messageId: typeof messageId === "string" ? messageId : "" };
}
