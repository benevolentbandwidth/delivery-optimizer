import { summaryStyles as styles } from "../styles";

type SummaryStatBlockProps = {
  value: number;
  label: string;
};

export default function SummaryStatBlock({
  value,
  label,
}: SummaryStatBlockProps) {
  return (
    <div style={styles.statBlock}>
      <strong style={styles.statNumber}>{value}</strong>
      <span style={styles.statLabel}>{label}</span>
    </div>
  );
}
