// app/welcome/page.tsx
"use client";
import { useRouter } from "next/navigation";
import ShellNavbar from "@/app/components/ShellNavbar";
import { GradientBlobs, PageFooter } from "@/app/utils/routeUtils";

export default function WelcomePage() {
  const router = useRouter();

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Serif+Display&family=DM+Sans:wght@400;500;600&display=swap');

        .welcome-root {
          min-height: 100vh;
          background: #f7f7f5;
          display: flex;
          flex-direction: column;
          font-family: 'DM Sans', sans-serif;
          position: relative;
          overflow: hidden;
        }

        .welcome-content {
          flex: 1;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 48px 24px;
          position: relative;
          z-index: 1;
        }

        .welcome-title {
          font-family: 'DM Serif Display', serif;
          font-size: 2.4rem;
          font-weight: 400;
          color: #111;
          margin-bottom: 12px;
          text-align: center;
          letter-spacing: -0.01em;
        }

        .welcome-subtitle {
          font-size: 14px;
          color: #555;
          margin-bottom: 48px;
          text-align: center;
          max-width: 480px;
          line-height: 1.6;
        }

        .welcome-cards {
          display: flex;
          flex-wrap: wrap;
          gap: 24px;
          justify-content: center;
          width: 100%;
          max-width: 860px;
        }

        /*
         * Accessibility fix: the entire card is the interactive element.
         * role="button" + tabIndex={0} + onKeyDown are on the outer div.
         */
        .welcome-card {
          background: #ffffff;
          border-radius: 16px;
          border: 1px solid rgba(0,0,0,0.08);
          padding: 32px 28px 28px;
          display: flex;
          flex-direction: column;
          align-items: flex-start;
          gap: 12px;
          width: 340px;
          box-sizing: border-box;
          box-shadow: 0 1px 4px rgba(0,0,0,0.04);
          transition: box-shadow 0.2s, border-color 0.2s;
          cursor: pointer;
        }

        .welcome-card:hover,
        .welcome-card:focus-visible {
          box-shadow: 0 4px 16px rgba(0,0,0,0.08);
          border-color: rgba(0,0,0,0.14);
        }

        .welcome-card:focus-visible {
          outline: 2px solid #4a8c7a;
          outline-offset: 2px;
        }

        .welcome-card-icon {
          color: #4a8c7a;
          margin-bottom: 4px;
        }

        .welcome-card-title {
          font-size: 18px;
          font-weight: 600;
          color: #111;
          margin: 0;
        }

        .welcome-card-desc {
          font-size: 13px;
          color: #666;
          line-height: 1.55;
          margin: 0;
          flex: 1;
        }

        /* Presentational pill — aria-hidden, pointer-events:none */
        .welcome-card-cta {
          margin-top: 16px;
          align-self: flex-end;
          background: #4a8c7a;
          color: #fff;
          border-radius: 999px;
          padding: 10px 24px;
          font-size: 14px;
          font-weight: 500;
          font-family: 'DM Sans', sans-serif;
          pointer-events: none;
          transition: background 0.15s;
        }

        .welcome-card:hover .welcome-card-cta,
        .welcome-card:focus-visible .welcome-card-cta {
          background: #3d7a6a;
        }

        /* Back link restored below the cards */
        .welcome-back {
          margin-top: 32px;
          background: none;
          border: none;
          cursor: pointer;
          font-size: 13px;
          color: #555;
          font-family: 'DM Sans', sans-serif;
          display: flex;
          align-items: center;
          gap: 6px;
          padding: 0;
        }

        .welcome-back:hover {
          color: #111;
        }
      `}</style>

      <div className="welcome-root">
        <GradientBlobs />
        <ShellNavbar />

        <div className="welcome-content">
          <h1 className="welcome-title">New or returning user?</h1>
          <p className="welcome-subtitle">
            Transform your address lists into efficient, ordered routes to lower operational costs and reduce your fleet's carbon emissions.
          </p>

          <div className="welcome-cards">
            {/* New user — full card is the interactive target */}
            <div
              className="welcome-card"
              role="button"
              tabIndex={0}
              aria-label="New user — continue"
              onClick={() => router.push("/edit")}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  router.push("/edit");
                }
              }}
            >
              <div className="welcome-card-icon">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                  <circle cx="10" cy="7" r="4" stroke="currentColor" strokeWidth="1.75" />
                  <path d="M2 21c0-4 3.582-7 8-7" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" />
                  <path d="M16 19l2 2 4-4" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </div>
              <p className="welcome-card-title">New user</p>
              <p className="welcome-card-desc">
                Import routes, edit addresses, assign deliveries, monitor fleet routes, and export delivery operations.
              </p>
              <span className="welcome-card-cta" aria-hidden="true">Continue</span>
            </div>

            {/* Returning user — full card is the interactive target */}
            <div
              className="welcome-card"
              role="button"
              tabIndex={0}
              aria-label="Returning user — continue"
              onClick={() => router.push("/upload-save-point")}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  router.push("/upload-save-point");
                }
              }}
            >
              <div className="welcome-card-icon">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                  <circle cx="10" cy="7" r="4" stroke="currentColor" strokeWidth="1.75" />
                  <path d="M2 21c0-4 3.582-7 8-7" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" />
                  <path d="M19 14v6M16 17h6" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" />
                </svg>
              </div>
              <p className="welcome-card-title">Returning user</p>
              {/* Fixed: was copy-pasted Driver copy. Now correctly describes resuming from a save point. */}
              <p className="welcome-card-desc">
                Pick up where you left off! Upload your save point to resume editing addresses and continue your delivery operations.
              </p>
              <span className="welcome-card-cta" aria-hidden="true">Continue</span>
            </div>
          </div>
          <button
            className="welcome-back"
            onClick={() => router.back()}
          >
            <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
              <path d="M10 3L5 8l5 5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            Back
          </button>
        </div>

        <PageFooter />
      </div>
    </>
  );
}