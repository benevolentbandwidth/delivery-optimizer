"use client";

import {
  MOBILE_NAVBAR_LEFT_GROUP,
  MOBILE_NAVBAR_MENU_BTN,
  MOBILE_NAVBAR_ROOT,
  MOBILE_NAVBAR_TITLE,
} from "@/app/edit/formStyles.v2";

type MobileNavbarProps = {
  onMenuClick: () => void;
};

export default function MobileNavbar({ onMenuClick }: MobileNavbarProps) {
  return (
    <header className={MOBILE_NAVBAR_ROOT}>
      <div className={MOBILE_NAVBAR_LEFT_GROUP}>
        <button
          className={MOBILE_NAVBAR_MENU_BTN}
          onClick={onMenuClick}
          aria-label="Open navigation menu"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            aria-hidden="true"
          >
            <path
              d="M3 7V5H21V7H3ZM3 19V17H21V19H3ZM3 13V11H21V13H3Z"
              fill="var(--edit-text-primary)"
            />
          </svg>
        </button>
        <span className={MOBILE_NAVBAR_TITLE}>Delivery Optimizer</span>
      </div>
    </header>
  );
}
