import { styles } from "../styles";

type StatBlockProps = {
  value: number;
  label: string;
  onClick: () => void;
};

export default function StatBlock({ value, label, onClick }: StatBlockProps) {
  return (
    <button type="button" style={styles.statBlock} onClick={onClick}>
      <strong style={styles.statNumber}>{value}</strong>
      <span style={styles.statLabel}>{label}</span>
    </button>
  );
}
