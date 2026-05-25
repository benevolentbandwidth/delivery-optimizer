// One stop row in an expanded route card (read-only or note edit)

"use client";

import { useState } from "react";
import type { Stop, TimeWindow } from "../types";

type EditableStopItemProps = {
  stop: Stop;
  accentColor: string;
  isEditMode: boolean;
  onSaveNote: (note: string) => void;
};

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

function formatDeliveryWindow(stop: Stop): string {
  const a = stop.deliveryWindowStart?.trim();
  const b = stop.deliveryWindowEnd?.trim();
  if (a && b) return `${formatTime12h(a)} – ${formatTime12h(b)}`;
  return formatTimeWindowLine(stop.timeWindow);
}

function formatContactLine(stop: Stop): string {
  const name = stop.addresseeName?.trim();
  const phone = stop.phoneNumber?.trim();
  if (name && phone) return `${name} · ${phone}`;
  if (name) return name;
  if (phone) return phone;
  return "—";
}

export default function EditableStopItem({
  stop,
  accentColor,
  isEditMode,
  onSaveNote,
}: EditableStopItemProps) {
  const [draft, setDraft] = useState(stop.note ?? "");
  const contactText = formatContactLine(stop);
  const timeText = formatDeliveryWindow(stop);

  return (
    <div
      className="rounded-lg border border-zinc-200 bg-white p-3 shadow-sm"
      style={{
        borderLeftWidth: "4px",
        borderLeftColor: accentColor,
        boxShadow: `inset 0 0 0 1px ${accentColor}22`,
        background: `linear-gradient(to right, ${accentColor}22 0%, #ffffff 34px)`,
      }}
    >
      <div className="flex items-start justify-between gap-2">
        <span className="min-w-0 text-xs font-semibold text-zinc-800 truncate">
          {stop.address}
        </span>
        <span
          className="flex shrink-0 items-center gap-1 rounded-md px-1.5 py-0.5 text-[10px] font-medium text-white"
          style={{ backgroundColor: accentColor }}
        >
          <span className="sr-only">Packages:</span>
          <span aria-hidden>📦</span> {stop.capacityUsed ?? "—"}
        </span>
      </div>
      <div className="mt-1.5 space-y-0.5 text-xs text-zinc-600">
        <div>
          <span className="font-medium text-zinc-700">Recipient:</span>{" "}
          {contactText}
        </div>
        <div>
          <span className="font-medium text-zinc-700">Delivery:</span>{" "}
          {timeText}
        </div>
      </div>

      {!isEditMode ? (
        <div className="mt-2 rounded-md border border-zinc-200 bg-white px-2 py-1.5 text-xs text-zinc-600 shadow-sm">
          <span className="font-medium text-zinc-700">Notes:</span>{" "}
          {stop.note?.trim() ? (
            stop.note
          ) : (
            <span className="text-zinc-400">No notes</span>
          )}
        </div>
      ) : (
        <div className="mt-2">
          <label className="block text-xs font-medium text-zinc-700">
            Notes
          </label>
          <textarea
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            rows={3}
            className="mt-1 w-full resize-none rounded-md border border-zinc-200 bg-white px-2 py-1 text-xs text-zinc-800 shadow-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-500"
            placeholder="Driver notes (e.g., Gate code is 1234)"
          />
          <div className="mt-2 flex justify-end">
            <button
              type="button"
              onClick={() => onSaveNote(draft)}
              className="inline-flex items-center rounded-md bg-amber-500 px-3 py-1.5 text-xs font-medium text-white hover:bg-amber-600 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-amber-500"
            >
              Save
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
