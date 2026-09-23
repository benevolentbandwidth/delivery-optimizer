import type { Route } from "@/app/results/types";
import type { SendRouteItem } from "@/lib/validation/whatsapp.schema";
import {
  sendRouteTemplateMessage,
  uploadRouteDocument,
} from "@/lib/whatsapp/metaWhatsAppApi";
import { buildRoutePdf } from "@/lib/whatsapp/routePdf";

const SEND_CONCURRENCY = 5;

export type WhatsAppSendResult = {
  vehicleId: string;
  status: "sent" | "failed";
  whatsappMessageId: string;
};

export function toWhatsAppRecipientNumber(phoneNumber: string): string {
  return phoneNumber.replace(/^\+/, "");
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

/**
 * Values substituted into the approved template body, in the order Meta expects.
 * The count must match the approved template exactly or the send is rejected.
 */
function templateParameters(route: Route): string[] {
  return [route.startTime?.trim() || "the scheduled start time"];
}

async function sendRoute(item: SendRouteItem): Promise<WhatsAppSendResult> {
  const failure: WhatsAppSendResult = {
    vehicleId: item.vehicleId,
    status: "failed",
    whatsappMessageId: "",
  };

  // Do not auto-retry: the template send is a non-idempotent POST, and a
  // timeout after Meta accepted it would deliver the route twice. A failure
  // between the two calls only orphans a media id, which expires by itself.
  try {
    const route = item.route as unknown as Route;
    const { bytes, filename } = await buildRoutePdf(route);
    const mediaId = await uploadRouteDocument(bytes, filename);

    const { messageId } = await sendRouteTemplateMessage({
      to: toWhatsAppRecipientNumber(item.driverPhoneNumber),
      mediaId,
      filename,
      templateParameters: templateParameters(route),
    });

    return {
      vehicleId: item.vehicleId,
      status: "sent",
      whatsappMessageId: messageId,
    };
  } catch (error) {
    console.error(`[whatsapp] send failed for ${item.vehicleId}`, error);
    return failure;
  }
}

export async function sendRoutesToWhatsApp(
  items: SendRouteItem[],
): Promise<WhatsAppSendResult[]> {
  if (items.length === 0) {
    return [];
  }

  return mapPool(items, SEND_CONCURRENCY, sendRoute);
}
