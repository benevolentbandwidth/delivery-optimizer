// One stop row in an expanded route card (read-only or note edit)

"use client";

import { useState } from "react";
import { recipientSummary } from "@/app/edit/utils/recipientSummary";
import type { Stop, TimeWindow } from "../types";
import { routeColorTint } from "../utils/routeColors";

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

export function formatTimeWindowLine(tw: TimeWindow | undefined): string {
  if (!tw?.time) return "—";
  const label = formatTime12h(tw.time);
  if (tw.kind === "by") return `By ${label}`;
  if (tw.kind === "at") return label;
  if (tw.kind === "from") return `From ${label}`;
  return label;
}

export function formatDeliveryWindow(stop: Stop): string {
  const raw = stop.timeWindow?.time?.trim();
  if (raw && /-|–/.test(raw)) return raw;
  return formatTimeWindowLine(stop.timeWindow);
}

function PersonIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 20 20" fill="none" aria-hidden>
      <path
        d="M10 10a3.25 3.25 0 1 0 0-6.5 3.25 3.25 0 0 0 0 6.5ZM4.5 16.5v-.75A4.25 4.25 0 0 1 8.75 11.5h2.5A4.25 4.25 0 0 1 15.5 15.75v.75"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function ClockIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 20 20" fill="none" aria-hidden>
      <circle
        cx="10"
        cy="10"
        r="7.25"
        stroke="currentColor"
        strokeWidth="1.5"
      />
      <path
        d="M10 6.25V10l2.5 1.25"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function PackageIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 20 20" fill="none" aria-hidden>
      <path
        d="M3.5 7.5 10 4l6.5 3.5v6L10 17l-6.5-3.5v-6Z"
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinejoin="round"
      />
      <path
        d="M3.5 7.5 10 11l6.5-3.5M10 11v5.5"
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function NoteDocIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 20 20" fill="none" aria-hidden>
      <path
        d="M6.5 3.5h5.5L15.5 7v8.25A1.25 1.25 0 0 1 14.25 16.5h-7.5A1.25 1.25 0 0 1 5.5 15.25v-10.5A1.25 1.25 0 0 1 6.75 3.5h-.25Z"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
      <path
        d="M11.5 3.5V7h4"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export default function EditableStopItem({
  stop,
  accentColor,
  isEditMode,
  onSaveNote,
}: EditableStopItemProps) {
  const [draft, setDraft] = useState(stop.note ?? "");
  const contactText = recipientSummary(stop);
  const timeText = formatDeliveryWindow(stop);

  return (
    <div className="min-w-0 flex-1 rounded-2xl border border-zinc-200 bg-white p-3.5 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <p className="min-w-0 flex-1 text-[14px] font-semibold leading-snug text-zinc-900">
          {stop.address}
        </p>
        <span
          className="flex shrink-0 items-center gap-1 rounded-full border px-2.5 py-1 text-[12px] font-semibold tabular-nums"
          style={{
            color: accentColor,
            borderColor: accentColor,
            backgroundColor: routeColorTint(accentColor, "1A"),
          }}
        >
          <span className="sr-only">Boxes:</span>
          <PackageIcon className="h-4 w-4 shrink-0" />
          {typeof stop.capacityUsed === "number" ? stop.capacityUsed : "—"}
        </span>
      </div>

      <div className="mt-3 space-y-2 text-[13px] leading-snug">
        <div className="flex items-start gap-2">
          <PersonIcon className="mt-2 h-4 w-4 shrink-0 text-zinc-400" />
          <div className="min-w-0 flex-1 rounded-lg border border-zinc-200 bg-white px-2.5 py-2 text-zinc-800">
            {contactText}
          </div>
        </div>
        <div className="flex items-start gap-2">
          <ClockIcon className="mt-2 h-4 w-4 shrink-0 text-zinc-400" />
          <div className="min-w-0 flex-1 rounded-lg border border-zinc-200 bg-white px-2.5 py-2 text-zinc-700">
            {timeText}
          </div>
        </div>
      </div>

      {!isEditMode ? (
        <div className="mt-3 flex gap-2 rounded-xl border border-zinc-200 bg-zinc-50/80 px-3 py-2.5 text-[13px] text-zinc-700">
          <NoteDocIcon className="mt-0.5 h-4 w-4 shrink-0 text-zinc-400" />
          <div>
            <span className="font-semibold text-zinc-800">Note:</span>{" "}
            {stop.note?.trim() ? (
              <span className="text-zinc-700">{stop.note}</span>
            ) : (
              <span className="text-zinc-400">No notes</span>
            )}
          </div>
        </div>
      ) : (
        <div className="mt-3 flex gap-2 rounded-xl border border-zinc-200 bg-white px-3 py-2.5">
          <NoteDocIcon className="mt-1 h-4 w-4 shrink-0 text-zinc-400" />
          <div className="min-w-0 flex-1">
            <label className="text-[12px] font-semibold text-zinc-800">
              Note
            </label>
            <textarea
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              rows={3}
              className="mt-1.5 w-full resize-none rounded-lg border border-zinc-200 bg-zinc-50/50 px-2.5 py-2 text-[13px] text-zinc-800 focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--edit-teal-300)]"
              placeholder="Driver notes (e.g., Gate code is 1234)"
            />
            <div className="mt-2 flex justify-end">
              <button
                type="button"
                onClick={() => onSaveNote(draft)}
                className="inline-flex items-center rounded-full bg-[var(--edit-teal-300)] px-3 py-1.5 text-[12px] font-semibold text-[var(--edit-text-primary)] hover:opacity-90 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-1 focus-visible:ring-[var(--edit-teal-300)]"
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
