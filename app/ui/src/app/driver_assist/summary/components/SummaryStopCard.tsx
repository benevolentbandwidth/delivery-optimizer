import type { DeliveryStop } from "@/lib/driver-route/types";

import { summaryStyles as styles } from "../styles";
import { statusLabel, stopTimestamp } from "../summaryUtils";

type SummaryStopCardProps = {
  stop: DeliveryStop;
};

export default function SummaryStopCard({ stop }: SummaryStopCardProps) {
  return (
    <article style={styles.card}>
      <div style={styles.stopText}>
        <strong style={styles.customerName}>{stop.customerName}</strong>
        <p style={styles.address}>{stop.address}</p>
        <p style={styles.timestamp}>{stopTimestamp(stop)}</p>
      </div>
      <span
        style={{
          ...styles.statusBadge,
          ...(stop.status === "completed" ? styles.completeBadge : {}),
          ...(stop.status === "failed" ? styles.remainingBadge : {}),
        }}
      >
        {statusLabel(stop.status)}
      </span>
    </article>
  );
}
