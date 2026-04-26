/**
 * Hi-fi Tailwind class tokens for the edit page redesign.
 * References CSS variables from edit.module.css — do not use hard-coded hex values here.
 * Mid-fi tokens live in formStyles.ts (do not modify that file).
 */

export const SIDEBAR_ROOT =
  "w-[68px] shrink-0 self-stretch bg-[var(--edit-sidebar-bg)] overflow-hidden";

export const SIDEBAR_NAV = "flex flex-col gap-4 pt-4 px-2";

export const SIDEBAR_NAV_ITEM =
  "flex flex-col gap-1 items-center w-full";

export const SIDEBAR_NAV_PILL_ACTIVE =
  "w-full flex items-center justify-center rounded-[80px] bg-[var(--edit-teal-300)] px-[9px] py-[4px]";

export const SIDEBAR_NAV_PILL_INACTIVE =
  "w-full flex items-center justify-center rounded-[80px] px-[9px] py-[4px] hover:bg-[var(--edit-teal-alpha)] transition-colors";

export const SIDEBAR_NAV_LABEL_ACTIVE =
  "text-[14px] leading-5 font-bold text-[var(--edit-foreground)] text-center whitespace-nowrap";

export const SIDEBAR_NAV_LABEL_INACTIVE =
  "text-[14px] leading-5 font-medium text-[var(--edit-foreground)] text-center whitespace-nowrap";
