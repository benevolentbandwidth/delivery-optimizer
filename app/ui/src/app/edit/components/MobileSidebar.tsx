"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  MOBILE_SIDEBAR_CLOSE_BTN,
  MOBILE_SIDEBAR_HEADER,
  MOBILE_SIDEBAR_HEADER_TITLE,
  MOBILE_SIDEBAR_NAV,
  MOBILE_SIDEBAR_NAV_ITEM_ACTIVE,
  MOBILE_SIDEBAR_NAV_ITEM_DISABLED,
  MOBILE_SIDEBAR_NAV_ITEM_INACTIVE,
  MOBILE_SIDEBAR_NAV_LABEL,
  MOBILE_SIDEBAR_NAV_PILL_ACTIVE,
  MOBILE_SIDEBAR_NAV_PILL_INACTIVE,
  MOBILE_SIDEBAR_OVERLAY,
  MOBILE_SIDEBAR_OVERLAY_OPEN,
  MOBILE_SIDEBAR_OVERLAY_CLOSED,
  MOBILE_SIDEBAR_PANEL,
  MOBILE_SIDEBAR_PANEL_OPEN,
  MOBILE_SIDEBAR_PANEL_CLOSED,
} from "../formStyles.v2";

// Reused from SidebarEditButton.tsx
const SVG_EDIT_ICON = (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 18 18" fill="none" aria-hidden="true">
    <path
      d="M8 13H0V16C0 16.55 0.195833 17.0208 0.5875 17.4125C0.979167 17.8042 1.45 18 2 18H8V13ZM10 13V18H16C16.55 18 17.0208 17.8042 17.4125 17.4125C17.8042 17.0208 18 16.55 18 16V13H10ZM8 11V6H0V11H8ZM10 11H18V6H10V11ZM0 4H18V2C18 1.45 17.8042 0.979167 17.4125 0.5875C17.0208 0.195833 16.55 0 16 0H2C1.45 0 0.979167 0.195833 0.5875 0.5875C0.195833 0.979167 0 1.45 0 2V4Z"
      fill="var(--edit-teal-600)"
    />
  </svg>
);

// Reused from SidebarResultsButton.tsx
const SVG_RESULTS_ICON = (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden="true">
    <path
      d="M4.35 20.7C4.01667 20.8333 3.70833 20.7958 3.425 20.5875C3.14167 20.3792 3 20.1 3 19.75V5.75C3 5.53333 3.0625 5.34167 3.1875 5.175C3.3125 5.00833 3.48333 4.88333 3.7 4.8L9 3L15 5.1L19.65 3.3C19.9833 3.16667 20.2917 3.20417 20.575 3.4125C20.8583 3.62083 21 3.9 21 4.25V12.675C20.75 12.2917 20.4542 11.9417 20.1125 11.625C19.7708 11.3083 19.4 11.0333 19 10.8V5.7L16 6.85V10C15.65 10 15.3083 10.0292 14.975 10.0875C14.6417 10.1458 14.3167 10.2333 14 10.35V6.85L10 5.45V18.525L4.35 20.7ZM5 18.3L8 17.15V5.45L5 6.45V18.3ZM17.4125 17.5C17.7875 17.1667 17.9833 16.6667 18 16C18.0167 15.4333 17.8292 14.9583 17.4375 14.575C17.0458 14.1917 16.5667 14 16 14C15.4333 14 14.9583 14.1917 14.575 14.575C14.1917 14.9583 14 15.4333 14 16C14 16.5667 14.1917 17.0417 14.575 17.425C14.9583 17.8083 15.4333 18 16 18C16.5667 18 17.0375 17.8333 17.4125 17.5ZM16 20C14.9 20 13.9583 19.6083 13.175 18.825C12.3917 18.0417 12 17.1 12 16C12 14.9 12.3917 13.9583 13.175 13.175C13.9583 12.3917 14.9 12 16 12C17.1 12 18.0417 12.3917 18.825 13.175C19.6083 13.9583 20 14.9 20 16C20 16.3833 19.9542 16.7458 19.8625 17.0875C19.7708 17.4292 19.6333 17.75 19.45 18.05L22 20.6L20.6 22L18.05 19.45C17.75 19.6333 17.4292 19.7708 17.0875 19.8625C16.7458 19.9542 16.3833 20 16 20Z"
      fill="var(--edit-text-primary)"
    />
  </svg>
);

const SVG_CLOSE_ICON = (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden="true">
    <path d="M6.4 19L5 17.6L10.6 12L5 6.4L6.4 5L12 10.6L17.6 5L19 6.4L13.4 12L19 17.6L17.6 19L12 13.4L6.4 19Z" 
      fill="var(--edit-text-primary)"/>

  </svg>
);

type MobileSidebarProps = {
  isOpen: boolean;
  onClose: () => void;
};

export default function MobileSidebar({ isOpen, onClose }: MobileSidebarProps) {
  const pathname = usePathname();
  const isEditActive = pathname === "/edit";

  return (
    <div
      className={`${MOBILE_SIDEBAR_OVERLAY} ${isOpen ? MOBILE_SIDEBAR_OVERLAY_OPEN : MOBILE_SIDEBAR_OVERLAY_CLOSED}`}
      onClick={onClose}
      aria-hidden={!isOpen}
    >
      <div
        className={`${MOBILE_SIDEBAR_PANEL} ${isOpen ? MOBILE_SIDEBAR_PANEL_OPEN : MOBILE_SIDEBAR_PANEL_CLOSED}`}
        role="dialog"
        aria-modal={isOpen}
        aria-labelledby="mobile-sidebar-title"
        onClick={(e) => e.stopPropagation()}
      >
        <div className={MOBILE_SIDEBAR_HEADER}>
          <button
            className={MOBILE_SIDEBAR_CLOSE_BTN}
            onClick={onClose}
            aria-label="Close navigation menu"
          >
            {SVG_CLOSE_ICON}
          </button>
          <span id="mobile-sidebar-title" className={MOBILE_SIDEBAR_HEADER_TITLE}>
            DELIVERY OPTIMIZER
          </span>
        </div>

        <nav className={MOBILE_SIDEBAR_NAV} aria-label="Main navigation">
          <Link
            href="/edit"
            className={isEditActive ? MOBILE_SIDEBAR_NAV_ITEM_ACTIVE : MOBILE_SIDEBAR_NAV_ITEM_INACTIVE}
            onClick={onClose}
          >
            <span className={isEditActive ? MOBILE_SIDEBAR_NAV_PILL_ACTIVE : MOBILE_SIDEBAR_NAV_PILL_INACTIVE}>
              {SVG_EDIT_ICON}
            </span>
            <span className={MOBILE_SIDEBAR_NAV_LABEL}>Edit</span>
          </Link>

          <Link
            href="#"
            className={MOBILE_SIDEBAR_NAV_ITEM_DISABLED}
            aria-disabled="true"
            tabIndex={-1}
          >
            <span className={MOBILE_SIDEBAR_NAV_PILL_INACTIVE}>
              {SVG_RESULTS_ICON}
            </span>
            <span className={MOBILE_SIDEBAR_NAV_LABEL}>Results</span>
          </Link>
        </nav>
      </div>
    </div>
  );
}
