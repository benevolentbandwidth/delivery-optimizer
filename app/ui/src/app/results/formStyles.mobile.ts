/** Mobile layout tokens for /results (responsive web, lg breakpoint). */

export const RESULTS_MOBILE_EDIT_PILL =
  "pointer-events-none absolute left-1/2 top-3 z-10 max-w-[min(100%,20rem)] -translate-x-1/2 rounded-[80px] bg-[var(--edit-btn-primary)] px-4 py-2 text-center text-xs font-medium leading-snug text-[var(--edit-text-primary)] shadow-sm sm:text-sm";

export const RESULTS_MOBILE_EDIT_BANNER_MESSAGE =
  "Drag stop markers to adjust delivery locations";

export const RESULTS_BOTTOM_SHEET_ROOT =
  "lg:hidden fixed bottom-0 left-0 right-0 z-40 flex flex-col bg-[var(--edit-bg-primary,#fff)] border-t border-[var(--edit-stone-200)] rounded-tl-[12px] rounded-tr-[12px] shadow-[0_-4px_24px_rgba(0,0,0,0.08)] transition-[max-height] duration-300 ease-in-out";

export const RESULTS_BOTTOM_SHEET_COLLAPSED = "max-h-[132px]";
export const RESULTS_BOTTOM_SHEET_EXPANDED = "max-h-[min(78vh,680px)]";

export const RESULTS_BOTTOM_SHEET_HANDLE =
  "mx-auto mt-2 mb-1 h-1 w-10 shrink-0 rounded-full bg-[var(--edit-stone-300)]";

export const RESULTS_BOTTOM_SHEET_HEADER = "shrink-0 px-4 pb-3";

export const RESULTS_BOTTOM_SHEET_HEADER_ROW =
  "flex items-start justify-between gap-3";

export const RESULTS_BOTTOM_SHEET_HEADER_TEXT = "min-w-0 flex-1";

export const RESULTS_BOTTOM_SHEET_TITLE =
  "font-semibold text-[16px] leading-[22px] text-[var(--edit-text-primary)]";

export const RESULTS_BOTTOM_SHEET_SUBTITLE =
  "mt-0.5 text-[12px] leading-4 text-[var(--edit-text-secondary,#6b6b6b)]";

export const RESULTS_BOTTOM_SHEET_ACTIONS = "flex shrink-0 items-center gap-2";

/** Pill — collapsed sheet Edit only */
export const RESULTS_BOTTOM_SHEET_BTN_PILL =
  "inline-flex h-9 shrink-0 items-center justify-center rounded-[80px] border border-[var(--edit-stone-700)] px-5 font-semibold text-[14px] leading-5 text-[var(--edit-text-primary)] hover:bg-[var(--edit-secondary-btn-hover)] active:bg-[var(--edit-secondary-btn-pressed)] transition-colors";

/** Rectangular — expanded sheet Edit / Export */
export const RESULTS_BOTTOM_SHEET_BTN_RECT_OUTLINE =
  "inline-flex h-9 shrink-0 items-center justify-center rounded-[6px] border border-[var(--edit-stone-700)] px-4 font-semibold text-[14px] leading-5 text-[var(--edit-text-primary)] hover:bg-[var(--edit-secondary-btn-hover)] active:bg-[var(--edit-secondary-btn-pressed)] transition-colors disabled:opacity-50 disabled:cursor-not-allowed";

export const RESULTS_BOTTOM_SHEET_BTN_RECT_FILLED =
  "inline-flex h-9 shrink-0 items-center justify-center rounded-[6px] bg-[var(--edit-btn-primary)] px-4 font-semibold text-[14px] leading-5 text-[var(--edit-text-primary)] hover:brightness-[0.97] disabled:opacity-50 disabled:cursor-not-allowed";

export const RESULTS_BOTTOM_SHEET_BODY =
  "flex-1 min-h-0 overflow-y-auto px-4 pb-2";

export const RESULTS_MOBILE_NAV_TITLE =
  "min-w-0 truncate font-bold text-[14px] leading-5 uppercase tracking-[0.02em] text-[var(--edit-text-primary)] sm:text-[16px] sm:leading-[22px]";

export const RESULTS_MOBILE_NAV_SAVE_BTN =
  "h-9 px-4 rounded-[6px] border border-[var(--edit-stone-700)] font-semibold text-[14px] leading-5 text-[var(--edit-text-primary)] whitespace-nowrap hover:bg-[var(--edit-secondary-btn-hover)] active:bg-[var(--edit-secondary-btn-pressed)] transition-colors disabled:opacity-50 disabled:cursor-not-allowed";

export const RESULTS_MOBILE_NAV_CANCEL_BTN =
  "h-9 shrink-0 px-3 rounded-[80px] border border-[var(--edit-stone-700)] font-semibold text-[14px] leading-5 text-[var(--edit-text-primary)]";

export const RESULTS_SHEET_FOOTER_WRAP = "pt-4 pb-2";
