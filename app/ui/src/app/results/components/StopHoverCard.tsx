"use client";

import type { Stop } from "../types";
import { formatDeliveryWindow } from "./EditableStopItem";

type StopHoverCardProps = {
  routeLabel: string;
  stop: Stop;
};

function formatContact(stop: Stop): string | null {
  const name = stop.addresseeName?.trim();
  const phone = stop.phoneNumber?.trim();
  if (name && phone) return `${name} · ${phone}`;
  if (name) return name;
  if (phone) return phone;
  return null;
}

export default function StopHoverCard({
  routeLabel,
  stop,
}: StopHoverCardProps) {
  const contact = formatContact(stop);
  const timeLabel = formatDeliveryWindow(stop);
  const note = stop.note?.trim();

  return (
    <div
      className="pointer-events-none w-[min(14rem,calc(100vw-2rem))] rounded-lg border border-[#7BCFC2]/80 bg-white p-3 font-sans-manrope shadow-md"
      role="tooltip"
    >
      <span className="inline-block rounded-full bg-[#E8F6F3] px-2 py-0.5 text-[10px] font-medium leading-tight text-[#2B6B5E]">
        {routeLabel}
      </span>

      <p className="mt-1.5 text-sm font-semibold leading-snug text-zinc-900">
        {stop.address}
      </p>

      <div className="mt-2 space-y-1 text-xs leading-relaxed text-zinc-700">
        {contact && (
          <p className="flex items-start gap-2">
            <svg
              className="mt-px h-3.5 w-3.5 shrink-0 text-zinc-500"
              viewBox="0 0 20 20"
              fill="none"
              aria-hidden
            >
              <path
                d="M10 10.25a2.75 2.75 0 1 0 0-5.5 2.75 2.75 0 0 0 0 5.5ZM4.75 16.5v-.75a5.25 5.25 0 0 1 10.5 0v.75"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
              />
            </svg>
            <span>{contact}</span>
          </p>
        )}
        <p className="flex items-start gap-2">
          <svg
            className="mt-px h-3.5 w-3.5 shrink-0 text-zinc-500"
            viewBox="0 0 20 20"
            fill="none"
            aria-hidden
          >
            <path
              d="M10 5.5v4.25l2.5 1.5M17.5 10a7.5 7.5 0 1 1-15 0 7.5 7.5 0 0 1 15 0Z"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
          <span>{timeLabel}</span>
        </p>
      </div>

      {note && (
        <div className="mt-2 flex gap-1.5 rounded-md border border-zinc-200 bg-zinc-50 px-2 py-1.5 text-xs text-zinc-700">
          <svg
            className="mt-px h-3.5 w-3.5 shrink-0 text-zinc-500"
            viewBox="0 0 20 20"
            fill="none"
            aria-hidden
          >
            <path
              d="M6 3.5h8l1.5 1.5V16.5H6V3.5Z"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinejoin="round"
            />
            <path
              d="M8 7.5h4M8 10h4"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
            />
          </svg>
          <p>
            <span className="font-medium text-zinc-800">Note:</span> {note}
          </p>
        </div>
      )}
    </div>
  );
}
