"use client";

import {
  MOBILE_NAVBAR_LEFT_GROUP,
  MOBILE_NAVBAR_MENU_BTN,
  MOBILE_NAVBAR_ROOT,
  MOBILE_NAVBAR_TITLE,
} from "@/app/edit/formStyles.v2";
import {
  RESULTS_MOBILE_NAV_CANCEL_BTN,
  RESULTS_MOBILE_NAV_SAVE_BTN,
} from "@/app/results/formStyles.mobile";

type MobileResultsNavbarProps = {
  onMenuClick: () => void;
  isEditMode?: boolean;
  onSaveEdits?: () => void;
  onCancel?: () => void;
  showCancel?: boolean;
};

export default function MobileResultsNavbar({
  onMenuClick,
  isEditMode = false,
  onSaveEdits,
  onCancel,
  showCancel = false,
}: MobileResultsNavbarProps) {
  return (
    <header className={MOBILE_NAVBAR_ROOT}>
      <div className={`${MOBILE_NAVBAR_LEFT_GROUP} min-w-0 flex-1`}>
        <button
          type="button"
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
        <span className={`${MOBILE_NAVBAR_TITLE} min-w-0 truncate`}>
          Delivery Optimizer
        </span>
      </div>
      <div className="flex shrink-0 items-center gap-2">
        {isEditMode && (
          <>
            {showCancel && onCancel && (
              <button
                type="button"
                className={RESULTS_MOBILE_NAV_CANCEL_BTN}
                onClick={onCancel}
              >
                Cancel
              </button>
            )}
            {onSaveEdits && (
              <button
                type="button"
                className={RESULTS_MOBILE_NAV_SAVE_BTN}
                onClick={onSaveEdits}
              >
                Save edits
              </button>
            )}
          </>
        )}
      </div>
    </header>
  );
}
