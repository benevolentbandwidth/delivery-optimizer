import type { ReactNode } from "react";

import { styles } from "../styles";

type InfoLineProps = {
  icon: ReactNode;
  text: string;
};

export default function InfoLine({ icon, text }: InfoLineProps) {
  return (
    <span style={styles.infoLine}>
      <span style={styles.infoIcon}>{icon}</span>
      <span style={styles.infoText}>{text}</span>
    </span>
  );
}
