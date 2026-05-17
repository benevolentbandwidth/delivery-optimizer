/**
 * Hi-fi Tailwind class tokens for the edit page redesign.
 * References CSS variables from edit.module.css — do not use hard-coded hex values here.
 * Mid-fi tokens live in formStyles.ts (do not modify that file).
 */

import { ADDRESS_CARD_ROOT_BASE, ADDRESS_LIST_WRAP } from "./formStyles";

export const SIDEBAR_ROOT =
  "hidden lg:block w-[68px] shrink-0 self-stretch bg-[var(--edit-stone-50)] overflow-hidden";

export const SIDEBAR_NAV = "flex flex-col gap-4 pt-4 px-2";

export const SIDEBAR_NAV_ITEM_ACTIVE =
  "flex flex-col gap-1 items-center w-full";

export const SIDEBAR_NAV_ITEM_INACTIVE =
  "flex flex-col gap-1 items-center w-full cursor-pointer";

export const SIDEBAR_NAV_ITEM_DISABLED =
  "flex flex-col gap-1 items-center w-full opacity-[0.26] cursor-not-allowed";

export const SIDEBAR_NAV_PILL_ACTIVE =
  "w-full flex items-center justify-center rounded-[80px] bg-[var(--edit-container-active)] px-[9px] py-[4px]";

export const SIDEBAR_NAV_PILL_INACTIVE =
  "w-full flex items-center justify-center rounded-[80px] px-[9px] py-[4px]";

export const SIDEBAR_NAV_LABEL_ACTIVE =
  "text-[14px] leading-5 font-bold text-[var(--edit-text-primary)] text-center whitespace-nowrap";

export const SIDEBAR_NAV_LABEL_INACTIVE =
  "text-[14px] leading-5 font-medium text-[var(--edit-text-primary)] text-center whitespace-nowrap";

export const NAVBAR_V2_ROOT =
  "hidden lg:flex bg-[var(--edit-stone-50)] items-center justify-between p-4";

// ── MOBILE Navbar (Figma 8169:2301) ──────────────────────────────────────────

export const MOBILE_NAVBAR_ROOT =
  "lg:hidden bg-[var(--edit-bg-primary)] flex items-center justify-between px-4 py-3";

export const MOBILE_NAVBAR_LEFT_GROUP =
  "flex items-center gap-2";

export const MOBILE_NAVBAR_MENU_BTN =
  "size-6 shrink-0 cursor-pointer flex items-center justify-center focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--edit-teal-300)] rounded-[4px]";

export const MOBILE_NAVBAR_TITLE =
  "font-bold text-[20px] leading-[28px] text-[var(--edit-text-primary)] whitespace-nowrap";

// ── MOBILE Sidebar (Figma 7472:3661) ─────────────────────────────────────────

export const MOBILE_SIDEBAR_OVERLAY =
  "lg:hidden fixed inset-0 z-50 bg-black/50 transition-opacity duration-300 ease-in-out";

export const MOBILE_SIDEBAR_PANEL =
  "absolute left-0 top-0 h-full w-[280px] bg-[var(--edit-stone-50)] rounded-br-[12px] rounded-tr-[12px] shadow-xl flex flex-col transition-transform duration-300 ease-in-out";

export const MOBILE_SIDEBAR_OVERLAY_OPEN =
  "opacity-100 pointer-events-auto";

export const MOBILE_SIDEBAR_OVERLAY_CLOSED =
  "opacity-0 pointer-events-none";

export const MOBILE_SIDEBAR_PANEL_OPEN =
  "translate-x-0";

export const MOBILE_SIDEBAR_PANEL_CLOSED =
  "-translate-x-full";

export const MOBILE_SIDEBAR_HEADER =
  "flex items-center gap-2 pt-6 px-4";

export const MOBILE_SIDEBAR_CLOSE_BTN =
  "size-6 shrink-0 cursor-pointer flex items-center justify-center focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--edit-teal-300)] rounded-[4px]";

export const MOBILE_SIDEBAR_HEADER_TITLE =
  "font-bold text-[20px] leading-[28px] text-[var(--edit-text-primary)] whitespace-nowrap";

export const MOBILE_SIDEBAR_NAV =
  "flex flex-col gap-4 px-4 mt-[23px]";

export const MOBILE_SIDEBAR_NAV_ITEM_ACTIVE =
  "flex items-center gap-2 w-full";

export const MOBILE_SIDEBAR_NAV_ITEM_INACTIVE =
  "flex items-center gap-2 w-full";

export const MOBILE_SIDEBAR_NAV_ITEM_DISABLED =
  "flex items-center gap-2 w-full opacity-[0.26] cursor-not-allowed";

export const MOBILE_SIDEBAR_NAV_PILL_ACTIVE =
  "flex items-center justify-center rounded-[80px] bg-[var(--edit-container-active)] px-[9px] py-[4px] w-[52px] shrink-0";

export const MOBILE_SIDEBAR_NAV_PILL_INACTIVE =
  "flex items-center justify-center rounded-[80px] px-[9px] py-[4px] w-[52px] shrink-0";

export const MOBILE_SIDEBAR_NAV_LABEL =
  "font-bold text-[14px] leading-5 text-[var(--edit-text-primary)] whitespace-nowrap";

// ── MOBILE Empty State Container (Figma 8169:2315 / 8169:2399) ───────────────

export const MOBILE_EMPTY_STATE_CONTAINER =
  "lg:hidden border border-[var(--edit-stone-200)] rounded-[8px] overflow-hidden p-4";

export const ADDRESS_CARD_MOBILE_ROOT = `${ADDRESS_CARD_ROOT_BASE} lg:hidden`;

export const ADDRESS_LIST_MOBILE_WRAP = `lg:hidden ${ADDRESS_LIST_WRAP}`;

export const NAVBAR_V2_LOGO =
  "font-bold text-[20px] leading-7 text-[var(--edit-text-primary)] whitespace-nowrap";

export const NAVBAR_V2_ACTIONS = "flex items-center gap-2";

export const NAVBAR_V2_BTN_OUTLINE =
  "h-9 px-4 rounded-[80px] border border-[var(--edit-stone-700)] font-semibold text-[14px] leading-5 text-[var(--edit-text-primary)] whitespace-nowrap hover:bg-[var(--edit-secondary-btn-hover)] active:bg-[var(--edit-secondary-btn-pressed)] transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed";

export const NAVBAR_V2_BTN_FILLED =
  "h-9 px-4 rounded-[80px] bg-[var(--edit-btn-primary)] font-semibold text-[14px] leading-5 text-[var(--edit-text-primary)] whitespace-nowrap cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed";

export const PAGE_V2_ROOT =
  "min-h-screen flex flex-col bg-[var(--edit-stone-50)] font-sans-manrope";
  
export const PAGE_V2_BODY = "flex flex-1 lg:min-h-0";

export const PAGE_V2_MAIN =
  "flex-1 min-w-0 bg-[var(--edit-bg-primary)] border-t-0 lg:border-t border-l-0 lg:border-l border-[var(--edit-stone-200)] rounded-none lg:rounded-tl-[12px] p-6 pb-[136px] lg:pb-6 space-y-16";

export const VEHICLE_INFO_CONTAINER =
  "hidden lg:flex flex-col gap-4 border border-[var(--edit-stone-200)] rounded-[8px] overflow-hidden p-4";

export const VEHICLE_INFO_HEADER_ROW =
  "grid w-full grid-cols-[minmax(7rem,1.2fr)_minmax(5rem,0.8fr)_minmax(6rem,0.9fr)_minmax(7rem,0.9fr)_minmax(7rem,1fr)_5.25rem] gap-4 items-center font-semibold text-[16px] leading-[1.5] text-[var(--edit-text-primary)]";

export const VEHICLE_INFO_HEADER_CELL = "min-w-0 truncate";

export const VEHICLE_INFO_HEADER_ACTIONS =
  "sr-only";

export const VEHICLE_INFO_DIVIDER = 
  "border-t border-[var(--edit-stone-200)]";

export const VEHICLE_INFO_ROWS =
  "flex flex-col gap-3";

const EMPTY_STATE_WRAPPER =
  "flex flex-col gap-4 items-center justify-center py-[28px] shrink-0 w-full";

const EMPTY_STATE_ICON =
  "size-12 shrink-0";

const EMPTY_STATE_TEXT_GROUP =
  "flex w-full max-w-full min-w-0 flex-col gap-2 items-center text-center leading-[1.5] text-[16px] text-[var(--edit-text-primary)]";

const EMPTY_STATE_TITLE =
  "font-[650]";

const EMPTY_STATE_SUBTITLE =
  "font-normal";

export const VEHICLE_EMPTY_STATE_WRAPPER = EMPTY_STATE_WRAPPER;
export const VEHICLE_EMPTY_STATE_ICON = EMPTY_STATE_ICON;
export const VEHICLE_EMPTY_STATE_TEXT_GROUP = EMPTY_STATE_TEXT_GROUP;
export const VEHICLE_EMPTY_STATE_TITLE = EMPTY_STATE_TITLE;
export const VEHICLE_EMPTY_STATE_SUBTITLE = EMPTY_STATE_SUBTITLE;

export const VEHICLE_ROW_DESKTOP =
  "grid w-full grid-cols-[minmax(7rem,1.2fr)_minmax(5rem,0.8fr)_minmax(6rem,0.9fr)_minmax(7rem,0.9fr)_minmax(7rem,1fr)_5.25rem] gap-4 items-center";

export const VEHICLE_ROW_CELL =
  "min-w-0 font-normal text-[16px] leading-[1.5] text-[var(--edit-text-primary)] truncate";

export const VEHICLE_ROW_STATUS_CELL =
  "min-w-0 h-[38px] flex items-center overflow-hidden";

export const VEHICLE_ROW_STATUS_BADGE_AVAILABLE =
  "bg-[var(--edit-container-success)] flex items-center overflow-hidden px-2 py-[7px] rounded-[4px]";

export const VEHICLE_ROW_STATUS_BADGE_IN_USE =
  "bg-[var(--edit-stone-50)] flex items-center overflow-hidden p-[8px] rounded-[4px]";

export const VEHICLE_ROW_STATUS_TEXT_AVAILABLE =
  "font-semibold text-[16px] leading-[22px] text-[var(--edit-text-success)] whitespace-nowrap";

export const VEHICLE_ROW_STATUS_TEXT_IN_USE =
  "font-semibold text-[16px] leading-[22px] text-[var(--edit-text-secondary)] whitespace-nowrap";

export const VEHICLE_ROW_ACTIONS =
  "flex items-center justify-end gap-1";

export const VEHICLE_ROW_ICON_BUTTON =
  "relative size-10 shrink-0 rounded-[4px] cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--edit-teal-300)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--edit-bg-primary)] hover:bg-[var(--edit-tertiary-btn-hover)] active:bg-[var(--edit-tertiary-btn-pressed)] transition-colors";

export const VEHICLE_MOBILE_LIST = "lg:hidden space-y-6";

// Mobile Hi-Fi Locked Vehicle Card (Figma 8325:7475)
export const VEHICLE_MOBILE_LOCKED_CARD_V2 =
  "lg:hidden flex flex-col gap-[12px] border border-[var(--edit-stone-200)] rounded-[8px] p-4 w-full";

export const VEHICLE_MOBILE_LOCKED_HEADER =
  "flex items-center justify-between w-full";

export const VEHICLE_MOBILE_LOCKED_INFO =
  "flex flex-col gap-[4px] leading-[1.5] text-[16px] text-[var(--edit-text-primary)] whitespace-nowrap";

export const VEHICLE_MOBILE_LOCKED_NAME =
  "font-bold";

export const VEHICLE_MOBILE_LOCKED_SUBTITLE =
  "flex items-center gap-[4px] font-normal";

export const VEHICLE_MOBILE_LOCKED_ICON_ROW =
  "flex items-center gap-[8px]";

export const VEHICLE_MOBILE_LOCKED_STATUS_ROW =
  "flex items-center gap-[16px] w-full";

export const VEHICLE_MOBILE_LOCKED_DEPARTURE =
  "font-normal text-[16px] leading-[1.5] text-[var(--edit-text-primary)] whitespace-nowrap";

export const VEHICLE_SECTION_BTN_GHOST =
  "h-9 px-4 rounded-[80px] font-semibold text-[14px] leading-5 text-[var(--edit-text-primary)] whitespace-nowrap hover:bg-[var(--edit-tertiary-btn-hover)] active:bg-[var(--edit-tertiary-btn-pressed)] transition-colors cursor-pointer";

export const VEHICLE_SECTION_ACTIONS =
  "flex items-center justify-end gap-2 mb-4";

export const VEHICLE_SECTION_HEADER =
  "flex flex-col gap-2 mb-4";

export const VEHICLE_SECTION_HEADING =
  "font-bold text-[20px] leading-[28px] text-[var(--edit-text-primary)]";

export const VEHICLE_SECTION_SUBHEADING =
  "text-[16px] leading-normal text-[var(--edit-text-secondary)]";

export const ADDRESS_SECTION_WITH_PAGINATION =
  "flex flex-col gap-4";

export const ADDRESS_SECTION_HEADER =
  "flex flex-col gap-2 mb-4";

export const ADDRESS_SECTION_HEADING =
  "font-bold text-[20px] leading-[28px] text-[var(--edit-text-primary)]";

export const ADDRESS_SECTION_SUBHEADING =
  "text-[16px] leading-normal text-[var(--edit-text-secondary)]";

export const ADDRESS_BTN_V2_DESKTOP_ENABLED =
  "h-10 px-4 shrink-0 rounded-[80px] border border-[var(--edit-stone-700)] font-semibold text-[14px] leading-5 text-[var(--edit-text-primary)] whitespace-nowrap hover:bg-[var(--edit-secondary-btn-hover)] active:bg-[var(--edit-secondary-btn-pressed)] transition-colors cursor-pointer";

export const ADDRESS_BTN_V2_DESKTOP_DISABLED =
  "h-10 px-4 shrink-0 rounded-[80px] border border-[var(--edit-stone-200)] font-semibold text-[14px] leading-5 text-[var(--edit-stone-500)] whitespace-nowrap cursor-not-allowed opacity-50";

export const ADDRESS_BTN_V2_MOBILE_ENABLED =
  "w-full h-10 px-4 rounded-[80px] border border-[var(--edit-stone-700)] font-semibold text-[14px] leading-5 text-[var(--edit-text-primary)] whitespace-nowrap hover:bg-[var(--edit-secondary-btn-hover)] active:bg-[var(--edit-secondary-btn-pressed)] transition-colors cursor-pointer";

export const ADDRESS_BTN_V2_MOBILE_DISABLED =
  "w-full h-10 px-4 rounded-[80px] border border-[var(--edit-stone-200)] font-semibold text-[14px] leading-5 text-[var(--edit-stone-500)] whitespace-nowrap cursor-not-allowed opacity-50";

export const ADDRESS_SEARCH_BAR =
  "flex items-center gap-2 px-4 py-[11px] rounded-[80px] border border-[var(--edit-stone-200)] bg-[var(--edit-stone-50)] focus-within:border-[var(--edit-teal-300)] transition-colors";

export const ADDRESS_SEARCH_BAR_DESKTOP =
  "flex items-center gap-2 h-9 px-4 rounded-[80px] border border-[var(--edit-stone-200)] bg-transparent focus-within:border-[var(--edit-teal-300)] transition-colors";

export const ADDRESS_SEARCH_INPUT =
  "flex-1 font-normal text-[16px] leading-[1.5] text-[var(--edit-text-primary)] placeholder:text-[var(--edit-stone-500)] outline-none bg-transparent min-w-0 [&::-webkit-search-cancel-button]:hidden";

export const ADDRESS_AUTOCOMPLETE_INPUT_WRAPPER =
  "relative";

export const ADDRESS_SEARCH_ICON =
  "shrink-0 size-6";

export const ADDRESS_SEARCH_DESKTOP_SIZE =
  "shrink-0 w-[440px]";

export const ADDRESS_TOOLBAR_SPACER =
  "flex-1 min-w-0";

// ── Mobile Address Toolbar (Figma 8325:7503) ──────────────────────────────────

export const MOBILE_ADDR_TOOLBAR_ROOT =
  "lg:hidden flex flex-col gap-3 items-end mb-4";

export const MOBILE_ADDR_TOOLBAR_BTN_ROW =
  "flex gap-2 items-center";

export const MOBILE_ADDR_TOOLBAR_BTN_ENABLED =
  "h-9 px-4 shrink-0 rounded-[80px] border border-[var(--edit-text-primary)] font-semibold text-[14px] leading-5 text-[var(--edit-text-primary)] whitespace-nowrap hover:bg-[var(--edit-secondary-btn-hover)] active:bg-[var(--edit-secondary-btn-pressed)] transition-colors cursor-pointer";

export const MOBILE_ADDR_TOOLBAR_BTN_DISABLED =
  "h-9 px-4 shrink-0 rounded-[80px] border border-[var(--edit-stone-200)] font-semibold text-[14px] leading-5 text-[var(--edit-stone-500)] whitespace-nowrap cursor-not-allowed opacity-50";

export const ADDRESS_SEARCH_BAR_COMPACT =
  "h-9 w-full flex items-center gap-2 px-4 rounded-[80px] border border-[var(--edit-stone-200)] focus-within:border-[var(--edit-teal-300)] transition-colors";

// ── Address Row Header (Figma 8012:2303) ──────────────────────────────────────

export const ADDRESS_ROW_HEADER_ROOT =
  "hidden lg:flex gap-4 items-start w-full";

export const ADDRESS_ROW_HEADER_COLS =
  "flex gap-10 items-center font-semibold text-[16px] leading-[1.5] text-[var(--edit-text-primary)] shrink-0";

export const ADDRESS_ROW_HEADER_CELL_RECIPIENT =
  "w-[328px] shrink-0";

export const ADDRESS_ROW_HEADER_CELL_QUANTITY =
  "w-[72px] shrink-0";

export const ADDRESS_ROW_HEADER_CELL_DELIVERY_EST =
  "w-[150px] shrink-0";

export const ADDRESS_ROW_HEADER_CELL_DELIVERY_TIME =
  "w-[247px] shrink-0";

export const ADDRESS_ROW_HEADER_CELL_NOTES =
  "w-[246px] shrink-0";

// ── Address List Container (Figma 7758:2602) ──────────────────────────────────

export const ADDRESS_LIST_CONTAINER =
  "hidden lg:block border border-[var(--edit-stone-200)] rounded-[8px] overflow-x-auto p-4";

export const ADDRESS_LIST_CONTAINER_INNER =
  "flex flex-col gap-4 min-w-max";

export const ADDRESS_LIST_DIVIDER =
  "border-t border-[var(--edit-stone-200)] w-full";

export const ADDRESS_EMPTY_STATE_WRAPPER = EMPTY_STATE_WRAPPER;
export const ADDRESS_EMPTY_STATE_ICON = EMPTY_STATE_ICON;
export const ADDRESS_EMPTY_STATE_TEXT_GROUP = EMPTY_STATE_TEXT_GROUP;
export const ADDRESS_EMPTY_STATE_TITLE = EMPTY_STATE_TITLE;
export const ADDRESS_EMPTY_STATE_SUBTITLE = EMPTY_STATE_SUBTITLE;

// ── Address Row Edit State (Figma 7758:2610) ──────────────────────────────────

export const ADDRESS_ROW_EDIT_ROOT =
  "flex items-start justify-between w-full";

export const ADDRESS_ROW_DESKTOP_WRAPPER =
  "hidden lg:block";

export const ADDRESS_ROW_EDIT_LEFT =
  "flex gap-4 items-start py-2";

export const ADDRESS_ROW_EDIT_COLS =
  "flex gap-10 items-start";

export const ADDRESS_ROW_RECIPIENT_COL =
  "flex flex-col gap-2 w-[328px] shrink-0";

export const ADDRESS_ROW_NAME_ROW =
  "flex items-center gap-[11px] w-full";

export const ADDRESS_ROW_FIELD_INPUT =
  "border border-[var(--edit-stone-200)] h-11 px-2 py-[10px] rounded-[6px] font-normal text-[16px] leading-[1.5] text-[var(--edit-text-primary)] placeholder:text-[var(--edit-stone-500)] outline-none focus:border-[var(--edit-teal-300)] bg-[var(--edit-bg-primary)] transition-colors min-w-0";

export const ADDRESS_ROW_FIELD_INPUT_FILL =
  `${ADDRESS_ROW_FIELD_INPUT} flex-1`;

export const ADDRESS_ROW_ADDR_WRAP =
  "relative border border-[var(--edit-stone-200)] flex h-11 items-center rounded-[6px] overflow-hidden w-full cursor-pointer";

export const ADDRESS_ROW_ADDR_WRAP_ERROR =
  `${ADDRESS_ROW_ADDR_WRAP} border-[var(--edit-error-border)]`;

export const ADDRESS_ROW_ADDR_GRADIENT =
  "pointer-events-none absolute right-0 top-0 h-full w-[72px] bg-gradient-to-l from-[var(--edit-bg-primary)] from-[60%] to-transparent flex items-center justify-end pr-2";

export const ADDRESS_ROW_ADDR_TRIGGER_TEXT =
  "flex-1 h-full px-2 text-[16px] leading-[1.5] font-normal text-left text-[var(--edit-text-primary)] truncate flex items-center";

export const ADDRESS_ROW_ADDR_TRIGGER_PLACEHOLDER =
  "text-[var(--edit-stone-500)]";

export const ADDRESS_ROW_STEPPER_CONTAINER =
  "border border-[var(--edit-stone-200)] flex h-11 items-center justify-between px-2 py-[10px] rounded-[6px] shrink-0";

export const ADDRESS_ROW_STEPPER_CONTAINER_NARROW =
  `${ADDRESS_ROW_STEPPER_CONTAINER} w-[72px]`;

export const ADDRESS_ROW_STEPPER_INPUT =
  "flex-1 min-w-0 bg-transparent outline-none text-[16px] leading-[1.5] text-[var(--edit-text-primary)] [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none";

export const ADDRESS_ROW_STEPPER_CONTROLS =
  "flex flex-col shrink-0";

export const ADDRESS_ROW_STEPPER_BUTTON =
  "cursor-pointer focus:outline-none";

export const ADDRESS_ROW_STEPPER_BUTTON_BORDER =
  "stroke-[var(--edit-stone-200)]";

export const ADDRESS_ROW_ICON_FILL =
  "fill-[var(--edit-primary-icon)]";

export const ADDRESS_ROW_EST_GROUP =
  "flex gap-2 items-center shrink-0 w-[150px]";

export const ADDRESS_ROW_TIME_GROUP =
  "flex gap-2 items-center shrink-0";

export const ADDRESS_ROW_TIME_SELECT_WRAP =
  "border border-[var(--edit-stone-200)] flex h-11 items-center justify-between px-2 py-[10px] rounded-[6px] w-[111px] shrink-0 relative overflow-hidden cursor-pointer";

export const ADDRESS_ROW_TIME_SELECT =
  "absolute inset-0 w-full h-full opacity-0 cursor-pointer text-[var(--edit-text-primary)]";

export const ADDRESS_ROW_INLINE_TEXT =
  "font-normal text-[16px] leading-[1.5] text-[var(--edit-text-primary)]";

export const ADDRESS_ROW_TIME_SELECT_TEXT =
  `${ADDRESS_ROW_INLINE_TEXT} pointer-events-none truncate flex-1`;

export const ADDRESS_ROW_TIME_SELECT_CHEVRON =
  "rotate-90 shrink-0 pointer-events-none";

export const ADDRESS_ROW_NOTES_WRAP =
  "border border-[var(--edit-stone-200)] flex items-start overflow-hidden px-2 py-[10px] rounded-[6px] w-[240px] shrink-0";

export const ADDRESS_ROW_NOTES_TEXTAREA =
  "w-full bg-transparent outline-none text-[16px] leading-[1.5] text-[var(--edit-text-primary)] placeholder:text-[var(--edit-stone-500)] resize-none font-normal overflow-hidden";

export const ADDRESS_ROW_ACTIONS =
  "flex gap-2 items-center shrink-0 self-start pt-2";

export const ADDRESS_ROW_ACTION_BTN =
  "relative size-10 shrink-0 overflow-hidden rounded-[4px] cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--edit-teal-300)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--edit-bg-primary)]";

export const ADDRESS_ROW_LOCKED_CELL =
  "bg-[var(--edit-stone-50)] flex h-11 items-center px-2 py-[10px] rounded-[6px] shrink-0 overflow-hidden";

export const ADDRESS_ROW_LOCKED_RECIPIENT_COL =
  "flex flex-col gap-[4px] w-[328px] shrink-0";

export const ADDRESS_ROW_LOCKED_PLAIN_TEXT =
  "font-normal text-[16px] leading-[1.5] text-[var(--edit-text-primary)]";

export const ADDRESS_ROW_LOCKED_FIELD_BTN =
  "text-left bg-transparent border-0 p-0 m-0 cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--edit-teal-300)] rounded-sm";

export const ADDRESS_ROW_LOCKED_CELL_DELIVERY_EST =
  `${ADDRESS_ROW_LOCKED_PLAIN_TEXT} ${ADDRESS_ROW_LOCKED_FIELD_BTN} w-[150px] shrink-0`;

export const ADDRESS_ROW_LOCKED_CELL_QUANTITY =
  `${ADDRESS_ROW_LOCKED_PLAIN_TEXT} ${ADDRESS_ROW_LOCKED_FIELD_BTN} w-[72px] shrink-0`;

export const ADDRESS_ROW_LOCKED_CELL_DELIVERY_TIME =
  `${ADDRESS_ROW_LOCKED_PLAIN_TEXT} ${ADDRESS_ROW_LOCKED_FIELD_BTN} w-[247px] shrink-0`;

export const ADDRESS_ROW_GEOCODE_ERROR_LOCKED =
  "border border-[var(--edit-error-border)]";

export const ADDRESS_ROW_LOCKED_NOTES_BTN =
  `${ADDRESS_ROW_LOCKED_PLAIN_TEXT} ${ADDRESS_ROW_LOCKED_FIELD_BTN} w-[240px] shrink-0`;

export const ADDRESS_ROW_LOCKED_NOTES_TEXT =
  "overflow-hidden [display:-webkit-box] [-webkit-box-orient:vertical] [-webkit-line-clamp:3]";

export const MOBILE_LOCKED_CLICKABLE =
  "cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--edit-teal-300)]";

// ── VehicleDetailsOverlay ─────────────────────────────────────────────────────

export const OVERLAY_BACKDROP =
  "fixed inset-0 z-50 flex items-center justify-center bg-black/40";

export const OVERLAY_PANEL =
  "bg-[var(--edit-bg-primary)] flex flex-col gap-[14px] items-end overflow-hidden p-4 lg:p-6 rounded-[6px] w-full max-w-[480px] mx-2 lg:mx-4 shadow-lg max-h-[90dvh]";

export const OVERLAY_BODY =
  "flex flex-col gap-6 items-start w-full flex-1 min-h-0";

export const OVERLAY_SCROLL_BODY =
  "flex flex-col gap-6 items-start w-full overflow-y-auto min-h-0 flex-1";

export const OVERLAY_HEADER =
  "flex items-center justify-between w-full";

export const OVERLAY_TITLE =
  "font-bold text-[20px] leading-7 text-[var(--edit-text-primary)]";

export const OVERLAY_CLOSE_BTN =
  "flex items-center justify-center size-6 text-[var(--edit-text-primary)] hover:opacity-70 transition-opacity cursor-pointer";

export const OVERLAY_ROW =
  "flex gap-4 items-start w-full";

export const OVERLAY_FIELD =
  "flex flex-1 flex-col gap-[6px] items-start min-w-0";

export const OVERLAY_FULL_FIELD =
  "flex flex-col gap-[6px] items-start w-full";

export const OVERLAY_LABEL =
  "font-normal text-[16px] leading-normal text-[var(--edit-text-primary)] w-full";

export const OVERLAY_REQUIRED_STAR =
  "text-[var(--edit-required-asterisk)]";

export const OVERLAY_INPUT =
  "border border-[var(--edit-stone-200)] flex h-11 items-center px-3 rounded-[6px] w-full font-normal text-[16px] leading-6 text-[var(--edit-text-primary)] placeholder:text-[var(--edit-stone-500)] outline-none focus:border-[var(--edit-teal-300)] bg-[var(--edit-bg-primary)] transition-colors";

export const OVERLAY_SELECT_WRAPPER =
  "border border-[var(--edit-stone-200)] flex h-11 items-center justify-between px-3 rounded-[6px] w-full relative overflow-hidden cursor-pointer";

export const OVERLAY_SELECT =
  "appearance-none absolute inset-0 w-full h-full opacity-0 cursor-pointer text-[var(--edit-text-primary)] pl-3 py-3";

export const OVERLAY_SELECT_VALUE =
  "font-normal text-[16px] leading-6 text-[var(--edit-text-primary)] pointer-events-none flex-1 truncate";

export const OVERLAY_SELECT_PLACEHOLDER =
  "font-normal text-[16px] leading-6 text-[var(--edit-stone-500)] pointer-events-none flex-1 truncate";

export const OVERLAY_SELECT_ICON =
  "pointer-events-none shrink-0 text-[var(--edit-text-primary)]";

export const OVERLAY_STATUS_BADGE_AVAILABLE =
  "bg-[var(--edit-container-success)] flex items-center overflow-hidden px-2 py-[7px] rounded-[4px] cursor-pointer select-none shrink-0";

export const OVERLAY_STATUS_BADGE_IN_USE =
  "bg-[var(--edit-stone-50)] flex items-center overflow-hidden p-[8px] rounded-[4px] cursor-pointer select-none shrink-0";

export const OVERLAY_STATUS_BADGE_TEXT_AVAILABLE =
  "font-semibold text-[16px] leading-[22px] text-[var(--edit-text-success)] whitespace-nowrap";

export const OVERLAY_STATUS_BADGE_TEXT_IN_USE =
  "font-semibold text-[16px] leading-[22px] text-[var(--edit-text-secondary)] whitespace-nowrap";

export const OVERLAY_STATUS_HINT =
  "text-[12px] leading-normal text-[var(--edit-text-secondary)]";

export const OVERLAY_STATUS_ROW =
  "flex gap-2 items-center";

export const OVERLAY_DEPARTURE_WRAPPER =
  "border border-[var(--edit-stone-200)] flex h-11 items-center justify-between px-3 rounded-[6px] w-full gap-2 focus-within:border-[var(--edit-teal-300)] transition-colors";

export const OVERLAY_DEPARTURE_INPUT =
  "flex-1 font-normal text-[16px] leading-6 text-[var(--edit-text-primary)] placeholder:text-[var(--edit-stone-500)] outline-none bg-transparent min-w-0";

export const OVERLAY_TIME_SEGMENT_INPUT =
  "w-8 font-normal text-[16px] leading-6 text-[var(--edit-text-primary)] placeholder:text-[var(--edit-stone-500)] outline-none bg-transparent text-center";

export const OVERLAY_TIME_SEGMENTS =
  "flex items-center";

export const OVERLAY_TIME_COLON =
  "font-normal text-[16px] leading-6 text-[var(--edit-text-primary)] select-none";

export const OVERLAY_MERIDIEM_WRAPPER =
  "flex gap-1 items-center shrink-0";

export const OVERLAY_MERIDIEM_BTN_ACTIVE =
  "bg-[var(--edit-container-active)] flex items-center justify-center rounded-[2px] size-8 font-normal text-[16px] leading-6 text-[var(--edit-text-primary)] cursor-pointer transition-colors";

export const OVERLAY_MERIDIEM_BTN_INACTIVE =
  "flex items-center justify-center rounded-[2px] size-8 font-normal text-[16px] leading-6 text-[var(--edit-text-primary)] cursor-pointer hover:bg-[var(--edit-stone-50)] transition-colors";

export const OVERLAY_FOOTER =
  "flex gap-[6px] items-center";

export const OVERLAY_CANCEL_BTN =
  "h-9 px-4 rounded-[80px] font-semibold text-[14px] leading-5 text-[var(--edit-text-primary)] whitespace-nowrap hover:bg-[var(--edit-tertiary-btn-hover)] active:bg-[var(--edit-tertiary-btn-pressed)] transition-colors cursor-pointer";

export const OVERLAY_PRIMARY_BTN =
  "h-9 px-4 rounded-[80px] bg-[var(--edit-btn-primary)] font-semibold text-[14px] leading-5 text-[var(--edit-text-primary)] whitespace-nowrap cursor-pointer";

export const OVERLAY_DELETE_BTN =
  "h-9 px-4 rounded-[80px] bg-[var(--edit-btn-delete)] font-semibold text-[14px] leading-5 text-[var(--edit-text-invert)] whitespace-nowrap cursor-pointer";

export const OVERLAY_INPUT_ERROR =
  "border border-[var(--edit-error-border)] flex h-11 items-center px-3 rounded-[6px] w-full font-normal text-[16px] leading-6 text-[var(--edit-text-primary)] placeholder:text-[var(--edit-stone-500)] outline-none bg-[var(--edit-bg-primary)] transition-colors";

export const OVERLAY_SELECT_WRAPPER_ERROR =
  "border border-[var(--edit-error-border)] flex h-11 items-center justify-between px-3 rounded-[6px] w-full relative overflow-hidden cursor-pointer";

export const OVERLAY_DEPARTURE_WRAPPER_ERROR =
  "border border-[var(--edit-error-border)] flex h-11 items-center justify-between px-3 rounded-[6px] w-full gap-2 transition-colors";

export const OVERLAY_FIELD_ERROR_CONTAINER =
  "bg-[var(--edit-error-bg)] flex gap-2 items-center p-2 rounded-[4px] w-full";

export const OVERLAY_FIELD_ERROR_TEXT =
  "font-normal text-[16px] leading-[1.5] text-[var(--edit-error-border)]";

export const OVERLAY_FIELD_ERROR_ICON =
  "shrink-0";

export const OVERLAY_AUTOCOMPLETE_DROPDOWN =
  "fixed z-[100] rounded-[6px] border border-[var(--edit-stone-200)] bg-[var(--edit-bg-primary)] shadow-lg max-h-48 overflow-y-auto";

export const OVERLAY_AUTOCOMPLETE_HEADER =
  "px-3 py-1 border-b border-[var(--edit-stone-200)] font-semibold text-[12px] leading-5 text-[var(--edit-stone-500)]";

export const OVERLAY_AUTOCOMPLETE_ITEM =
  "px-3 py-2 cursor-pointer flex items-start gap-2 text-[16px] text-[var(--edit-text-primary)] border-b border-[var(--edit-stone-200)] last:border-b-0 hover:bg-[var(--edit-stone-50)]";

export const OVERLAY_AUTOCOMPLETE_ITEM_ACTIVE =
  "px-3 py-2 cursor-pointer flex items-start gap-2 text-[16px] text-[var(--edit-text-primary)] border-b border-[var(--edit-stone-200)] last:border-b-0 bg-[var(--edit-container-active)]";

export const OVERLAY_AUTOCOMPLETE_INPUT_WRAPPER =
  "relative w-full";

export const OVERLAY_AUTOCOMPLETE_PIN_ICON =
  "shrink-0 mt-0.5 text-[var(--edit-stone-500)]";

export const OVERLAY_AUTOCOMPLETE_ITEM_TEXT =
  "flex-1 leading-snug";

// ── Pagination V2 (Figma 8083:3520) ──────────────────────────────────────────

export const PAGINATION_V2_ROW =
  "hidden lg:flex items-center justify-between w-full";

export const PAGINATION_V2_SHOW_CONTAINER =
  "border border-[var(--edit-stone-200)] bg-[var(--edit-bg-primary)] flex items-center justify-between p-[8px] rounded-[6px] w-[112px] relative cursor-pointer overflow-hidden";

export const PAGINATION_V2_SHOW_TEXT =
  "font-normal text-[16px] leading-[1.5] text-[var(--edit-text-primary)] whitespace-nowrap pointer-events-none select-none";

export const PAGINATION_V2_SHOW_CHEVRON =
  "flex items-center justify-center size-[24px] shrink-0 pointer-events-none";

export const PAGINATION_V2_SHOW_CHEVRON_ICON =
  "rotate-90";

export const PAGINATION_V2_SHOW_SELECT =
  "absolute inset-0 w-full h-full opacity-0 cursor-pointer text-[var(--edit-text-primary)]";

export const PAGINATION_V2_NAV_CONTAINER =
  "flex gap-[8px] items-center";

export const PAGINATION_V2_NAV_BTN =
  "border border-[var(--edit-stone-200)] bg-[var(--edit-bg-primary)] flex items-center justify-center p-[8px] rounded-[6px] cursor-pointer hover:bg-[var(--edit-stone-50)] transition-colors";

export const PAGINATION_V2_NAV_BTN_DISABLED =
  "border border-[var(--edit-stone-200)] bg-[var(--edit-bg-primary)] flex items-center justify-center p-[8px] rounded-[6px] opacity-[0.48] cursor-not-allowed";

export const PAGINATION_V2_PAGE_ACTIVE =
  "bg-[var(--edit-pagination-active-bg)] flex items-center justify-center rounded-[100px] size-[40px] font-['Manrope',sans-serif] font-semibold text-[14px] leading-[20px] text-[var(--edit-text-primary)] shrink-0 select-none";

export const PAGINATION_V2_PAGE_INACTIVE =
  "flex items-center justify-center size-[40px] font-['Manrope',sans-serif] font-semibold text-[14px] leading-[20px] text-[var(--edit-text-primary)] shrink-0 cursor-pointer hover:bg-[var(--edit-stone-50)] rounded-[6px] transition-colors";

// ── Mobile Pagination (Figma 8325:4916) ──────────────────────────────────────

export const MOBILE_PAGINATION_ROOT =
  "lg:hidden flex flex-col gap-[16px] items-center w-full";

export const MOBILE_PAGINATION_PILLS_ROW =
  "flex gap-[8px] items-center shrink-0";

export const MOBILE_PAGINATION_PAGE_ACTIVE =
  "bg-[var(--edit-pagination-mobile-active-bg)] flex items-center justify-center rounded-[100px] size-[36px] font-['Manrope',sans-serif] font-semibold text-[14px] leading-[20px] text-[var(--edit-text-primary)] shrink-0 select-none";

export const MOBILE_PAGINATION_PAGE_INACTIVE =
  "flex items-center justify-center size-[36px] font-['Manrope',sans-serif] font-semibold text-[14px] leading-[20px] text-[var(--edit-text-primary)] shrink-0 cursor-pointer hover:bg-[var(--edit-stone-50)] rounded-[100px] transition-colors";

export const MOBILE_PAGINATION_NAV_ROW =
  "flex items-center justify-between shrink-0 w-full";

// ── Page Footer ───────────────────────────────────────────────────────────────

export const FOOTER_ROOT =
  "hidden lg:flex items-center justify-between px-4 py-3";

export const FOOTER_LOGO =
  "shrink-0 w-[25.326px] h-[28px] [aspect-ratio:25.33/28] [background:var(--edit-footer-logo-bg)]";

export const FOOTER_TEXT =
  "font-normal text-[16px] leading-[1.5] text-[var(--edit-text-primary)] whitespace-nowrap";

// Mobile footer (lg:hidden)
export const MOBILE_FOOTER_ROOT =
  "lg:hidden flex flex-col gap-[8px] items-start py-3";

export const MOBILE_FOOTER_LOGO =
  "shrink-0 w-[25.179px] h-[27.838px] [aspect-ratio:25.179/27.838] [background:var(--edit-footer-logo-bg)]";

export const MOBILE_FOOTER_TEXT_WRAPPER =
  "flex flex-col font-['Manrope',sans-serif] font-normal text-[16px] leading-[1.5] text-[var(--edit-text-primary)] whitespace-nowrap";

export const MOBILE_FOOTER_TEXT_LINE = "relative shrink-0";

export const OPTIMIZING_SPINNER_WRAP =
  "flex justify-center mt-2";

// ── Mobile Address Card Edit State (Figma 8325:4843) ──────────────────────────

export const MOBILE_ADDR_CARD_EDIT_CONTENT =
  "flex flex-col gap-6";

export const MOBILE_ADDR_EDIT_SECTION =
  "flex flex-col gap-2";

export const MOBILE_ADDR_EDIT_SECTION_LABEL =
  "font-semibold text-[16px] leading-[1.5] text-[var(--edit-text-primary)]";

export const MOBILE_ADDR_EDIT_NAME_ROW =
  "flex items-center gap-2";

export const MOBILE_ADDR_EDIT_DELIVERY_INFO_ROW =
  "flex items-start gap-4";

export const MOBILE_ADDR_EDIT_DELIVERY_GROUP =
  "flex flex-col gap-2";

export const MOBILE_ADDR_EDIT_EST_CONTROL =
  "flex items-center gap-2";

export const MOBILE_ADDR_EDIT_SCHEDULE_ROW =
  "flex items-center gap-2";

export const MOBILE_ADDR_EDIT_TIME_SELECT_WRAP =
  "border border-[var(--edit-stone-200)] flex h-11 items-center justify-between px-2 py-[10px] rounded-[6px] flex-1 relative overflow-hidden cursor-pointer";

export const MOBILE_ADDR_EDIT_NOTES_WRAP =
  "border border-[var(--edit-stone-200)] flex items-start overflow-hidden px-2 py-[10px] rounded-[6px] w-full";

export const MOBILE_ADDR_EDIT_ACTION_BAR =
  "flex items-center justify-between pt-2";

export const MOBILE_ADDR_EDIT_ACTION_BAR_END =
  "flex items-center justify-end pt-2";

export const MOBILE_ADDR_EDIT_COLLAPSE_BTN =
  "flex items-center gap-1 h-9 px-3 rounded-[80px] font-semibold text-[14px] leading-5 text-[var(--edit-text-primary)] hover:bg-[var(--edit-tertiary-btn-hover)] active:bg-[var(--edit-tertiary-btn-pressed)] transition-colors cursor-pointer";

export const MOBILE_ADDR_EDIT_ICON_BTNS_GROUP =
  "flex items-center gap-1";

// ── Mobile Address Card Locked State (Figma 8325:4687) ──────────────────────

export const MOBILE_ADDR_LOCKED_VALUE =
  "font-normal text-[16px] leading-[1.5] text-[var(--edit-text-primary)]";

export const MOBILE_ADDR_LOCKED_NOTES_CLAMP =
  `${MOBILE_ADDR_LOCKED_VALUE} line-clamp-6`;

export const MOBILE_ADDR_EXPANDED_PANEL = "p-4";

export const MOBILE_ADDR_LOCKED_FIELD_BTN =
  "text-left bg-transparent border-0 p-0 m-0 w-full cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--edit-teal-300)] rounded-sm";

export const MOBILE_ADDR_LOCKED_RECIPIENT_LINES =
  "flex flex-col gap-1";

export const MOBILE_ADDR_LOCKED_GEOCODE_ERROR =
  "text-[var(--edit-error-border)]";

// ── Mobile Address Card Summarized State (Figma 8325:7892) ──────────────────

export const MOBILE_ADDR_SUMMARY_CONTENT =
  "flex flex-col gap-[24px] p-4 w-full";

export const MOBILE_ADDR_SUMMARY_SECTION =
  "flex flex-col gap-[6px] items-start w-full";

export const MOBILE_ADDR_SUMMARY_ACTION_BAR =
  "flex items-center justify-between w-full";

export const MOBILE_ADDR_SUMMARY_EXPAND_BTN =
  "flex gap-[8px] h-[36px] items-center justify-center overflow-clip px-[16px] rounded-[80px] font-['Manrope',sans-serif] font-semibold text-[14px] leading-[20px] text-[var(--edit-text-primary)] cursor-pointer hover:bg-[var(--edit-stone-50)] active:bg-[var(--edit-tertiary-btn-pressed)] transition-colors";

// ── Mobile Bottom Bar (Figma 8490:12411) ──────────────────────────────────────

export const MOBILE_BOTTOM_BAR_ROOT =
  "lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-[var(--edit-stone-50)] border-t border-l border-r border-[var(--edit-stone-200)] rounded-tl-[12px] rounded-tr-[12px] p-[16px]";

export const MOBILE_BOTTOM_BAR_INNER =
  "flex flex-col gap-[8px] w-full";

export const MOBILE_BOTTOM_BAR_OPTIMIZE_BTN =
  "flex items-center justify-center h-[44px] px-[16px] py-[10px] rounded-[80px] w-full overflow-clip bg-[var(--edit-btn-primary)] cursor-pointer";

export const MOBILE_BOTTOM_BAR_OPTIMIZE_LABEL =
  "font-['Manrope',sans-serif] font-semibold text-[16px] leading-[22px] text-[var(--edit-text-primary)] whitespace-nowrap";

export const MOBILE_BOTTOM_BAR_ACTIONS_ROW =
  "flex gap-[8px] items-center w-full";

export const MOBILE_BOTTOM_BAR_SECONDARY_BTN =
  "border border-[var(--edit-stone-700)] flex flex-1 items-center justify-center h-[44px] px-[16px] py-[10px] rounded-[80px] min-w-0 overflow-clip cursor-pointer";

export const MOBILE_BOTTOM_BAR_SECONDARY_LABEL =
  "font-['Manrope',sans-serif] font-semibold text-[16px] leading-[22px] text-[var(--edit-text-primary)] whitespace-nowrap";
