import { styles } from "../styles";

export type ReportReason =
  | "Customer unavailable"
  | "Can't access location"
  | "Other";

type ReportIssueDialogProps = {
  reason: ReportReason;
  details: string;
  onReasonChange: (reason: ReportReason) => void;
  onDetailsChange: (details: string) => void;
  onCancel: () => void;
  onSubmit: () => void;
};

const reasons: ReportReason[] = [
  "Customer unavailable",
  "Can't access location",
  "Other",
];

export default function ReportIssueDialog({
  reason,
  details,
  onReasonChange,
  onDetailsChange,
  onCancel,
  onSubmit,
}: ReportIssueDialogProps) {
  return (
    <div style={styles.modalBackdrop} role="presentation">
      <section
        aria-modal="true"
        role="dialog"
        aria-labelledby="report-issue-title"
        style={styles.reportDialog}
      >
        <div style={styles.reportHeader}>
          <h2 id="report-issue-title" style={styles.reportTitle}>
            Report issue
          </h2>
          <button
            type="button"
            aria-label="Close report issue"
            style={styles.reportCloseButton}
            onClick={onCancel}
          >
            x
          </button>
        </div>

        <p style={styles.reportPrompt}>
          Select a reason for the delivery issue
          <span style={styles.required}>*</span>
        </p>

        <div style={styles.reportOptions}>
          {reasons.map((option) => (
            <label key={option} style={styles.reportOption}>
              <input
                type="radio"
                name="report-reason"
                value={option}
                checked={reason === option}
                onChange={() => onReasonChange(option)}
                style={styles.reportRadio}
              />
              <span>{option}</span>
            </label>
          ))}
        </div>

        {reason === "Other" ? (
          <textarea
            style={styles.reportDetails}
            placeholder="Please provide details"
            value={details}
            onChange={(event) => onDetailsChange(event.target.value)}
          />
        ) : null}

        <div style={styles.reportActions}>
          <button
            type="button"
            style={styles.reportCancelButton}
            onClick={onCancel}
          >
            Cancel
          </button>
          <button
            type="button"
            style={styles.reportSubmitButton}
            onClick={onSubmit}
          >
            Submit
          </button>
        </div>
      </section>
    </div>
  );
}
