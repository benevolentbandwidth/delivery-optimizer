import type { SendRouteItem } from "@/lib/validation/whatsapp.schema";
import { formatWhatsAppRouteMessage } from "@/lib/whatsapp/formatRouteMessage";

const SEND_ROUTE_PATH = "/api/whatsapp/send-route";
const SEND_CONCURRENCY = 5;

const TIMEOUT_MS = Number(
  process.env.DELIVERYOPTIMIZER_API_TIMEOUT_MS ?? 60000,
);

export type WhatsAppSendResult = {
  vehicleId: string;
  status: "sent" | "failed";
  whatsappMessageId: string;
};

export function toWhatsAppRecipientNumber(phoneNumber: string): string {
  return phoneNumber.replace(/^\+/, "");
}

function requiredEnv(name: string): string {
  const value = process.env[name]?.trim();
  if (!value) {
    throw new Error(`${name} must be configured to send WhatsApp routes.`);
  }

  return value;
}

function apiUrl(baseUrl: string): string {
  return `${baseUrl.replace(/\/+$/, "")}${SEND_ROUTE_PATH}`;
}

function messageIdFromResponse(body: unknown): string {
  if (!body || typeof body !== "object") {
    return "";
  }

  const messages = (body as { messages?: unknown }).messages;
  if (!Array.isArray(messages)) {
    return "";
  }

  const messageId = (messages[0] as { id?: unknown } | undefined)?.id;
  return typeof messageId === "string" && messageId ? messageId : "";
}

function isAbortError(error: unknown): boolean {
  return error instanceof Error && error.name === "AbortError";
}

async function fetchWithTimeout(
  url: string,
  options: RequestInit,
): Promise<Response> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), TIMEOUT_MS);
  try {
    return await fetch(url, { ...options, signal: controller.signal });
  } finally {
    clearTimeout(timeoutId);
  }
}

async function parseResponseBody(response: Response): Promise<unknown> {
  const text = await response.text();
  if (!text) {
    return undefined;
  }

  try {
    return JSON.parse(text);
  } catch {
    return text;
  }
}

function bodySnippet(body: unknown, maxLen = 500): string {
  if (body === undefined) {
    return "";
  }
  const raw = typeof body === "string" ? body : JSON.stringify(body);
  return raw.length > maxLen ? `${raw.slice(0, maxLen)}…` : raw;
}

async function mapPool<T, R>(
  items: T[],
  concurrency: number,
  mapper: (item: T) => Promise<R>,
): Promise<R[]> {
  const results = new Array<R>(items.length);
  let nextIndex = 0;

  async function worker(): Promise<void> {
    while (nextIndex < items.length) {
      const index = nextIndex;
      nextIndex += 1;
      results[index] = await mapper(items[index]);
    }
  }

  const workerCount = Math.min(concurrency, items.length);
  await Promise.all(Array.from({ length: workerCount }, () => worker()));
  return results;
}

async function postSendRoute(
  endpoint: string,
  secret: string,
  item: SendRouteItem,
): Promise<Response> {
  return fetchWithTimeout(endpoint, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-WhatsApp-Send-Secret": secret,
    },
    body: JSON.stringify({
      to: toWhatsAppRecipientNumber(item.driverPhoneNumber),
      message: formatWhatsAppRouteMessage(item.route),
    }),
  });
}

async function sendRoute(
  item: SendRouteItem,
  endpoint: string,
  secret: string,
): Promise<WhatsAppSendResult> {
  // Do not auto-retry: WhatsApp send is a non-idempotent POST, and a 5xx/timeout
  // after upstream acceptance would duplicate driver messages on retry.
  try {
    let response: Response;
    try {
      response = await postSendRoute(endpoint, secret, item);
    } catch (error) {
      console.error(
        `[whatsapp] send failed for ${item.vehicleId}: ${
          isAbortError(error) ? "request timed out" : "network error"
        }`,
        error,
      );
      throw error;
    }

    const body = await parseResponseBody(response);
    if (!response.ok) {
      console.error(
        `[whatsapp] send failed for ${item.vehicleId}: HTTP ${response.status}`,
        bodySnippet(body),
      );
      return {
        vehicleId: item.vehicleId,
        status: "failed",
        whatsappMessageId: "",
      };
    }

    const messageId = messageIdFromResponse(body);
    if (!messageId) {
      console.warn(
        `[whatsapp] send succeeded for ${item.vehicleId} without message id`,
        bodySnippet(body),
      );
    }

    return {
      vehicleId: item.vehicleId,
      status: "sent",
      whatsappMessageId: messageId,
    };
  } catch {
    return {
      vehicleId: item.vehicleId,
      status: "failed",
      whatsappMessageId: "",
    };
  }
}

export async function sendRoutesToWhatsApp(
  items: SendRouteItem[],
): Promise<WhatsAppSendResult[]> {
  if (items.length === 0) {
    return [];
  }

  const endpoint = apiUrl(requiredEnv("DELIVERYOPTIMIZER_API_URL"));
  const secret = requiredEnv("WHATSAPP_SEND_ROUTE_SECRET");

  return mapPool(items, SEND_CONCURRENCY, (item) =>
    sendRoute(item, endpoint, secret),
  );
}
