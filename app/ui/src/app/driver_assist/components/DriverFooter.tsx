import Image from "next/image";

import { styles } from "../styles";

export default function DriverFooter() {
  return (
    <footer style={styles.footer}>
      <Image
        src="/logo.png"
        alt="b2 logo"
        width={25}
        height={28}
        style={styles.footerLogo}
      />
      <p style={styles.footerText}>
        Built with{" "}
        <span role="img" aria-label="love">
          {"\u2764\uFE0F"}
        </span>{" "}
        for Humanity.
      </p>
      <p style={styles.footerText}>The Benevolent Bandwidth Foundation</p>
    </footer>
  );
}
