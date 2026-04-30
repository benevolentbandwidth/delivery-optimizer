// app/utils/routeUtils.tsx
// Shared utilities extracted to avoid duplication across upload pages and gradient layouts.

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
            {/* b² logo — inline SVG recreated from brand asset */}
            <svg
                width="44"
                height="36"
                viewBox="0 0 44 36"
                fill="none"
                aria-label="b² logo"
                xmlns="http://www.w3.org/2000/svg"
            >
                {/* Stem of the b */}
                <rect x="0" y="0" width="7" height="36" rx="3.5" fill="#2d6e6e" />
                {/* Bowl of the b — constructed from a circle with the left side merged into the stem */}
                <circle cx="17" cy="23" r="13" fill="#2d6e6e" />
                <circle cx="17" cy="23" r="7.5" fill="white" />
                {/* Superscript 2 */}
                <text
                    x="32"
                    y="16"
                    fontSize="16"
                    fontWeight="700"
                    fontFamily="'DM Sans', sans-serif"
                    fill="#2d6e6e"
                >
                    2
                </text>
            </svg>

            <span style={{ fontSize: "13px", color: "#555" }}>
                Built with ❤️ for Humanity. The Benevolent Bandwidth Foundation
            </span>
        </footer>
    );
}