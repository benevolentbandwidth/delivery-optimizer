import {
  MOBILE_BOTTOM_BAR_ROOT,
  MOBILE_BOTTOM_BAR_INNER,
  MOBILE_BOTTOM_BAR_OPTIMIZE_BTN,
  MOBILE_BOTTOM_BAR_OPTIMIZE_LABEL,
  MOBILE_BOTTOM_BAR_ACTIONS_ROW,
  MOBILE_BOTTOM_BAR_SECONDARY_BTN,
  MOBILE_BOTTOM_BAR_SECONDARY_LABEL,
} from "../formStyles.v2";
import styles from "../edit.module.css";

type Props = {
  onOptimize: () => void;
  onSave: () => void;
  onExport: () => void;
  isOptimizing?: boolean;
};

export default function MobileBottomBar({
  onOptimize,
  onSave,
  onExport,
  isOptimizing,
}: Props) {
  return (
    <div className={MOBILE_BOTTOM_BAR_ROOT}>
      <div className={MOBILE_BOTTOM_BAR_INNER}>
        <button
          type="button"
          className={`${MOBILE_BOTTOM_BAR_OPTIMIZE_BTN} ${styles.primaryBtnOverlay}`}
          onClick={onOptimize}
          disabled={isOptimizing}
        >
          <span className={MOBILE_BOTTOM_BAR_OPTIMIZE_LABEL}>Optimize</span>
        </button>
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
            className={MOBILE_BOTTOM_BAR_SECONDARY_BTN}
            onClick={onExport}
          >
            <span className={MOBILE_BOTTOM_BAR_SECONDARY_LABEL}>Export</span>
          </button>
        </div>
      </div>
    </div>
  );
}
