import type { Stop, TimeWindow } from "../types";

function formatTime12h(raw: string): string {
  const t = raw.trim();
  if (/am|pm/i.test(t)) return t;
  const m = t.match(/^(\d{1,2}):(\d{2})$/);
  if (!m) return t;
  let h = parseInt(m[1]!, 10);
  const min = m[2];
  const ap = h >= 12 ? "PM" : "AM";
  h = h % 12;
  if (h === 0) h = 12;
  return `${h}:${min} ${ap}`;
}

function formatTimeWindowLine(tw: TimeWindow | undefined): string {
  if (!tw?.time) return "—";
  const label = formatTime12h(tw.time);
  if (tw.kind === "by") return `By ${label}`;
  if (tw.kind === "at") return label;
  return `From ${label}`;
}

/** Prefer deliveryWindowStart/End when both set; otherwise fall back to timeWindow. */
export function formatStopDeliveryWindow(stop: Stop): string {
  const start = stop.deliveryWindowStart?.trim();
  const end = stop.deliveryWindowEnd?.trim();
  if (start && end) return `${formatTime12h(start)} – ${formatTime12h(end)}`;
  return formatTimeWindowLine(stop.timeWindow);
}
