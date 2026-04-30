"use client";

import {
  NAVBAR_V2_ACTIONS,
  NAVBAR_V2_BTN_FILLED,
  NAVBAR_V2_BTN_OUTLINE,
  NAVBAR_V2_LOGO,
  NAVBAR_V2_ROOT,
} from "../formStyles.v2";
import ErrorPopup from "./ErrorPopup";

type NavbarProps = {
  onImportSession: () => void;
  onExportSession: () => void;
  onOptimize: () => void;
  isOptimizing: boolean;
  error: string | null;
  onClearError: () => void;
};

export default function Navbar({
  onImportSession,
  onExportSession,
  onOptimize,
  isOptimizing,
  error,
  onClearError,
}: NavbarProps) {
  return (
    <>
      <ErrorPopup message={error} onClose={onClearError} />
      <header className={NAVBAR_V2_ROOT}>
        <span className={NAVBAR_V2_LOGO}>DELIVERY OPTIMIZER</span>
        <div className={NAVBAR_V2_ACTIONS}>
          <button className={NAVBAR_V2_BTN_OUTLINE} onClick={() => void onImportSession()}>
            Import Session
          </button>
          <button className={NAVBAR_V2_BTN_OUTLINE} onClick={() => void onExportSession()}>
            Export Session
          </button>
          <button
            className={NAVBAR_V2_BTN_FILLED}
            onClick={onOptimize}
            disabled={isOptimizing}
          >
            {isOptimizing ? "Optimizing…" : "Optimize"}
          </button>
        </div>
      </header>
    </>
  );
}
