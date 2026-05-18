// app/utils/routeUtils.tsx
// Shared utilities extracted to avoid duplication across upload pages and gradient layouts.
import Image from "next/image";

/** Human-readable file size string. */
export function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

/** Footer shared by landing and welcome pages. */
export function PageFooter() {
  return (
    <footer
      style={{
        position: "relative",
        zIndex: 1,
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        padding: "20px 32px",
        borderTop: "1px solid rgba(0,0,0,0.06)",
        fontFamily: "'DM Sans', sans-serif",
      }}
    >
      {/* b² logo — served from /public/b2-logo.png */}
      <Image
        src="/logo.png"
        alt="b² logo"
        width={44}
        height={36}
        style={{ objectFit: "contain" }}
      />

      <span
        style={{
          fontSize: "clamp(10px, 1.1vw, 13px)",
          color: "#555",
          textAlign: "right",
          maxWidth: "66%",
        }}
      >
        Built with ❤️ for Humanity. The Benevolent Bandwidth Foundation
      </span>
    </footer>
  );
}
