/**
 * Hi-fi Tailwind class tokens for the edit page redesign.
 * References CSS variables from edit.module.css — do not use hard-coded hex values here.
 * Mid-fi tokens live in formStyles.ts (do not modify that file).
 */

export const SIDEBAR_ROOT =
  "hidden lg:block w-[68px] shrink-0 self-stretch bg-[var(--edit-sidebar-bg)] overflow-hidden";

export const SIDEBAR_NAV = "flex flex-col gap-4 pt-4 px-2";

export const SIDEBAR_NAV_ITEM =
  "flex flex-col gap-1 items-center w-full";

export const SIDEBAR_NAV_PILL_ACTIVE =
  "w-full flex items-center justify-center rounded-[80px] bg-[var(--edit-teal-300)] px-[9px] py-[4px]";

export const SIDEBAR_NAV_PILL_INACTIVE =
  "w-full flex items-center justify-center rounded-[80px] opacity-20 px-[9px] py-[4px] hover:bg-[var(--edit-teal-alpha)] transition-colors";

export const SIDEBAR_NAV_LABEL_ACTIVE =
  "text-[14px] leading-5 font-bold text-[var(--edit-foreground)] text-center whitespace-nowrap";

export const SIDEBAR_NAV_LABEL_INACTIVE =
  "text-[14px] leading-5 font-medium text-[var(--edit-muted)] text-center whitespace-nowrap";

export const PAGE_V2_BODY = "flex flex-1 min-h-0";

export const PAGE_V2_MAIN =
  "flex-1 min-w-0 px-6 lg:px-8 py-6 lg:py-8 space-y-8 lg:space-y-10";

export const NAVBAR_V2_ROOT =
  "bg-[var(--edit-sidebar-bg)] flex items-center justify-between p-4";

export const NAVBAR_V2_LOGO =
  "font-semibold text-[20px] leading-none text-[var(--edit-foreground)] whitespace-nowrap";

export const NAVBAR_V2_ACTIONS = "flex items-center gap-2";

export const NAVBAR_V2_BTN_OUTLINE =
  "h-9 px-4 rounded-[80px] border border-[var(--edit-foreground)] font-semibold text-[14px] leading-5 text-[var(--edit-foreground)] whitespace-nowrap hover:bg-black/5 transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed";

export const NAVBAR_V2_BTN_FILLED =
  "h-9 px-4 rounded-[80px] bg-[var(--edit-teal-500)] font-semibold text-[14px] leading-5 text-[var(--edit-white)] whitespace-nowrap hover:opacity-90 transition-opacity cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed";
