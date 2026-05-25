"use client";

import { useMemo } from "react";
import MobileEditPageFooter from "../../edit/components/layout/footer/MobileEditPageFooter";
import type { Route } from "../types";
import {
  RESULTS_BOTTOM_SHEET_BODY,
  RESULTS_BOTTOM_SHEET_BTN_PILL,
  RESULTS_BOTTOM_SHEET_BTN_RECT_FILLED,
  RESULTS_BOTTOM_SHEET_BTN_RECT_OUTLINE,
  RESULTS_BOTTOM_SHEET_COLLAPSED,
  RESULTS_BOTTOM_SHEET_EXPANDED,
  RESULTS_BOTTOM_SHEET_HANDLE,
  RESULTS_BOTTOM_SHEET_HEADER,
  RESULTS_BOTTOM_SHEET_HEADER_ROW,
  RESULTS_BOTTOM_SHEET_HEADER_TEXT,
  RESULTS_BOTTOM_SHEET_ROOT,
  RESULTS_BOTTOM_SHEET_SUBTITLE,
  RESULTS_BOTTOM_SHEET_TITLE,
  RESULTS_SHEET_FOOTER_WRAP,
} from "../formStyles.mobile";
import Sidebar from "./Sidebar";

type ResultsBottomSheetProps = {
  routes: Route[];
  isExpanded: boolean;
  onExpandedChange: (expanded: boolean) => void;
  isEditMode: boolean;
  onEditModeChange: (value: boolean) => void;
  onExportClick: () => void;
  onUpdateStopNote: (routeId: string, stopId: string, note: string) => void;
  onExportRoute: (vehicleId: string) => void;
  onDuplicateRoute: (vehicleId: string) => void;
  onDeleteRoute: (vehicleId: string) => void;
};

export default function ResultsBottomSheet({
  routes,
  isExpanded,
  onExpandedChange,
  isEditMode,
  onEditModeChange,
  onExportClick,
  onUpdateStopNote,
  onExportRoute,
  onDuplicateRoute,
  onDeleteRoute,
}: ResultsBottomSheetProps) {
  const totalStops = useMemo(
    () => routes.reduce((sum, r) => sum + r.stops.length, 0),
    [routes],
  );

  function handleEditToggle() {
    if (isEditMode) {
      onEditModeChange(false);
    } else {
      onEditModeChange(true);
      onExpandedChange(true);
    }
  }

  return (
    <section
      className={`${RESULTS_BOTTOM_SHEET_ROOT} ${
        isExpanded
          ? RESULTS_BOTTOM_SHEET_EXPANDED
          : RESULTS_BOTTOM_SHEET_COLLAPSED
      }`}
      aria-label="Optimized routes"
    >
      <button
        type="button"
        className="flex w-full flex-col items-center pt-1 pb-0"
        onClick={() => onExpandedChange(!isExpanded)}
        aria-expanded={isExpanded}
        aria-label={isExpanded ? "Collapse route list" : "Expand route list"}
      >
        <span className={RESULTS_BOTTOM_SHEET_HANDLE} />
      </button>

      <div className={RESULTS_BOTTOM_SHEET_HEADER}>
        <div className={RESULTS_BOTTOM_SHEET_HEADER_ROW}>
          <div className={RESULTS_BOTTOM_SHEET_HEADER_TEXT}>
            <h2 className={RESULTS_BOTTOM_SHEET_TITLE}>Optimized Routes</h2>
            <p className={RESULTS_BOTTOM_SHEET_SUBTITLE}>
              {routes.length} route{routes.length === 1 ? "" : "s"} with{" "}
              {totalStops} total stop
              {totalStops === 1 ? "" : "s"}
            </p>
          </div>
          <div className="flex shrink-0 items-center gap-2">
            {isExpanded ? (
              <>
                <button
                  type="button"
                  className={RESULTS_BOTTOM_SHEET_BTN_RECT_OUTLINE}
                  onClick={handleEditToggle}
                >
                  Edit
                </button>
                <button
                  type="button"
                  className={RESULTS_BOTTOM_SHEET_BTN_RECT_FILLED}
                  onClick={onExportClick}
                  disabled={routes.length === 0}
                >
                  Export
                </button>
              </>
            ) : (
              <button
                type="button"
                className={RESULTS_BOTTOM_SHEET_BTN_PILL}
                onClick={handleEditToggle}
              >
                Edit
              </button>
            )}
          </div>
        </div>
      </div>

      {isExpanded && (
        <div className={RESULTS_BOTTOM_SHEET_BODY}>
          <Sidebar
            variant="sheet"
            routes={routes}
            isEditMode={isEditMode}
            onEditModeChange={onEditModeChange}
            onUpdateStopNote={onUpdateStopNote}
            onExportRoute={onExportRoute}
            onDuplicateRoute={onDuplicateRoute}
            onDeleteRoute={onDeleteRoute}
          />
          <div className={RESULTS_SHEET_FOOTER_WRAP}>
            <MobileEditPageFooter />
          </div>
        </div>
      )}
    </section>
  );
}
