"use client";

/**
 * Top bar: branding placeholder and primary delivery actions (save, export, optimize).
 */

import {
  NAVBAR_ACTIONS_WRAP,
  NAVBAR_HEADER,
  NAVBAR_LOGO_PLACEHOLDER,
  NAVBAR_OUTLINE_PILL,
  NAVBAR_SOLID_PILL,
} from "../formStyles";
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
      <header className={NAVBAR_HEADER}>
        <div className={NAVBAR_LOGO_PLACEHOLDER}>logo</div>
        <div className={NAVBAR_ACTIONS_WRAP}>
          <button
            className={NAVBAR_OUTLINE_PILL}
            onClick={() => void onImportSession()}
          >
            Import Session
          </button>
          <button className={NAVBAR_OUTLINE_PILL} onClick={() => void onExportSession()}>
            Export Session State
          </button>
          <button
            className={NAVBAR_SOLID_PILL}
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
