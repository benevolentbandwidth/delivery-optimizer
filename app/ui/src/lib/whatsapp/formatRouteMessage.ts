const WHATSAPP_TEXT_LIMIT = 4096;
const MISSING_FIELD = "—";

type RouteStopLike = {
  sequence?: unknown;
  address?: unknown;
  addresseeName?: unknown;
  phoneNumber?: unknown;
};

type RouteLike = {
  driverName?: unknown;
  stops?: unknown;
};

function asString(value: unknown, fallback = MISSING_FIELD): string {
  if (typeof value !== "string") {
    return fallback;
  }
  const trimmed = value.trim();
  return trimmed || fallback;
}

function moreStopsSuffix(count: number): string {
  return `\n\n…and ${count} more stops`;
}

function sequenceOrInfinity(stop: RouteStopLike): number {
  return typeof stop.sequence === "number"
    ? stop.sequence
    : Number.POSITIVE_INFINITY;
}

function orderedStops(route: RouteLike): RouteStopLike[] {
  if (!Array.isArray(route.stops)) {
    return [];
  }

  return [...route.stops]
    .filter((stop): stop is RouteStopLike =>
      Boolean(stop && typeof stop === "object"),
    )
    .sort((a, b) => sequenceOrInfinity(a) - sequenceOrInfinity(b));
}

function formatStopBlock(
  stop: RouteStopLike,
  index: number,
  totalStops: number,
): string {
  return [
    `📍 Name: ${asString(stop.addresseeName)}`,
    `🏠 Address: ${asString(stop.address)}`,
    `📞 Phone: ${asString(stop.phoneNumber)}`,
    "",
    `🛑 Stop ${index} of ${totalStops}`,
  ].join("\n");
}

function composedLength(
  header: string,
  stopsBlock: string,
  footer: string,
  remainingStops: number,
): number {
  const suffix = remainingStops > 0 ? moreStopsSuffix(remainingStops) : "";
  return header.length + stopsBlock.length + suffix.length + footer.length;
}

/**
 * Compose the free-form WhatsApp body for a route using the driver-facing template.
 */
export function formatWhatsAppRouteMessage(route: RouteLike): string {
  const driverName = asString(route.driverName, "driver");
  const stops = orderedStops(route);
  const totalStops = stops.length;
  const header = `Hello ${driverName},\n\nHere are today's delivery stops:\n\n`;
  const footer = `\n\nThank you!`;

  if (totalStops === 0) {
    return `${header}(No stops on this route)${footer}`;
  }

  let stopsBlock = "";
  let included = 0;

  for (let i = 0; i < stops.length; i += 1) {
    const nextBlock = formatStopBlock(stops[i], i + 1, totalStops);
    const candidate =
      included === 0 ? nextBlock : `${stopsBlock}\n\n${nextBlock}`;
    const remainingAfter = totalStops - (i + 1);
    const length = composedLength(header, candidate, footer, remainingAfter);

    // Keep at least one stop even if it alone exceeds the soft cap.
    if (length > WHATSAPP_TEXT_LIMIT && included > 0) {
      break;
    }

    stopsBlock = candidate;
    included = i + 1;

    if (length > WHATSAPP_TEXT_LIMIT) {
      break;
    }
  }

  const remaining = totalStops - included;
  if (remaining > 0) {
    stopsBlock += moreStopsSuffix(remaining);
  }

  return `${header}${stopsBlock}${footer}`;
}
