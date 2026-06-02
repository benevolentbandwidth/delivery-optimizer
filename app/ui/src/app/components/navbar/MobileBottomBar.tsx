import styles from "@/app/edit/edit.module.css";
import {
  MOBILE_BOTTOM_BAR_ROOT,
  MOBILE_BOTTOM_BAR_INNER,
  MOBILE_BOTTOM_BAR_ACTIONS_ROW,
  MOBILE_BOTTOM_BAR_OPTIMIZE_BTN,
  MOBILE_BOTTOM_BAR_OPTIMIZE_LABEL,
  MOBILE_BOTTOM_BAR_SECONDARY_BTN,
  MOBILE_BOTTOM_BAR_SECONDARY_LABEL,
} from "@/app/edit/formStyles.v2";

type Props = {
  onSave: () => void;
  onOptimize: () => void;
  isOptimizing: boolean;
};

export default function MobileBottomBar({
  onSave,
  onOptimize,
  isOptimizing,
}: Props) {
  return (
    <div className={MOBILE_BOTTOM_BAR_ROOT}>
      <div className={MOBILE_BOTTOM_BAR_INNER}>
        <div className={MOBILE_BOTTOM_BAR_ACTIONS_ROW}>
          <button
            type="button"
            className={MOBILE_BOTTOM_BAR_SECONDARY_BTN}
            onClick={onSave}
          >
            <span className={MOBILE_BOTTOM_BAR_SECONDARY_LABEL}>Save</span>
          </button>
          <button
            type="button"
            className={`${MOBILE_BOTTOM_BAR_OPTIMIZE_BTN} ${styles.primaryBtnOverlay}`}
            onClick={onOptimize}
            disabled={isOptimizing}
            aria-busy={isOptimizing === true}
          >
            <span className={MOBILE_BOTTOM_BAR_OPTIMIZE_LABEL}>
              {isOptimizing ? "Optimizing…" : "Optimize"}
            </span>
          </button>
        </div>
      </div>
    </div>
  );
}
