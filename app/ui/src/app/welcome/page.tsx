// app/welcome/page.tsx
"use client";
import Image from "next/image";
import { useRouter } from "next/navigation";
import ShellNavbar from "@/app/components/ShellNavbar";
import { PageFooter } from "@/app/utils/routeUtils";
import { clearEditPageDraft } from "@/lib/session/editPageDraft";
import { clearOptimizeResults } from "@/app/edit/utils/hasOptimizeResults";

export default function WelcomePage() {
  const router = useRouter();

  const handleNewSession = () => {
    clearEditPageDraft();
    clearOptimizeResults();
    router.push("/edit");
  };

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600&display=swap');

        .welcome-root {
          min-height: 100vh;
          background: #f7f7f5;
          display: flex;
          flex-direction: column;
          font-family: 'DM Sans', sans-serif;
          position: relative;
          overflow: hidden;
        }

        .welcome-bg {
          position: fixed;
          inset: 0;
          background:
            radial-gradient(ellipse at 100% 0%,   #cfe6da 0%, rgba(207,230,218,0) 55%),
            radial-gradient(ellipse at 0%   100%, #cfe6da 0%, rgba(207,230,218,0) 55%),
            #fbfaf7;
          z-index: 0;
        }

        .welcome-content {
          flex: 1;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: flex-start;
          padding: 48px 24px;
          position: relative;
          z-index: 1;
        }

        .welcome-main {
          width: 100%;
          display: flex;
          flex-direction: column;
          align-items: center;
          margin-block: auto;
        }

        .welcome-title {
          font-family: 'DM Sans', sans-serif;
          font-size: 1.75rem;
          font-weight: 600;
          color: #111;
          margin-bottom: 12px;
          text-align: center;
          letter-spacing: -0.01em;
        }

        .welcome-subtitle {
          font-size: 14px;
          font-weight: 700;
          color: #555;
          margin-bottom: 40px;
          text-align: center;
          max-width: 500px;
          line-height: 1.65;
          min-height: 46px;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .welcome-cards {
          display: flex;
          flex-wrap: wrap;
          width: 100%;
          max-width: 640px;
          background: #ffffff;
          border-radius: 16px;
          border: 1px solid rgba(0,0,0,0.09);
          box-shadow: 0 2px 12px rgba(0,0,0,0.06);
          overflow: hidden;
        }

        .welcome-card {
          flex: 1;
          min-width: 220px;
          padding: 32px 28px 28px;
          display: flex;
          flex-direction: column;
          align-items: flex-start;
          gap: 10px;
          position: relative;
        }

        .welcome-card + .welcome-card::before {
          content: '';
          position: absolute;
          left: 0;
          top: 24px;
          bottom: 24px;
          width: 1px;
          background: rgba(0,0,0,0.08);
        }

        .welcome-card-icon {
          width: 64px;
          height: 64px;
          object-fit: contain;
          margin-bottom: 4px;
        }

        .welcome-card-title {
          font-size: 17px;
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

        .welcome-card-cta {
          margin-top: 20px;
          align-self: flex-end;
          background: #4a8c7a;
          color: #ffffff;
          border: none;
          border-radius: 6px;
          padding: 8px 20px;
          font-size: 13px;
          font-weight: 500;
          font-family: 'DM Sans', sans-serif;
          cursor: pointer;
          transition: background 0.15s;
        }

        .welcome-card-cta:hover { background: #3d7a6a; }

        .welcome-card-cta:focus-visible {
          outline: 2px solid #4a8c7a;
          outline-offset: 2px;
        }

        .welcome-back {
          align-self: center;
          flex-shrink: 0;
          margin-top: 24px;
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

        .welcome-back:hover { color: #111; }

        .welcome-root footer,
        .welcome-root [class*="footer"],
        .welcome-root [class*="Footer"] {
          background: #ffffff !important;
          position: relative;
          z-index: 1;
        }

        @media (max-width: 520px) {
          .welcome-cards {
            flex-wrap: wrap;
          }

          .welcome-card {
            min-width: 100%;
          }

          .welcome-card + .welcome-card::before {
            left: 24px;
            right: 24px;
            top: 0;
            bottom: auto;
            width: auto;
            height: 1px;
          }
        }
      `}</style>

      <div className="welcome-root">
        <div className="welcome-bg" />
        <ShellNavbar />

        <div className="welcome-content">
          <div className="welcome-main">
            <h1 className="welcome-title">
              Choose how you&apos;d like to continue
            </h1>
            <p className="welcome-subtitle">Select one</p>

            <div className="welcome-cards">
              <div className="welcome-card">
                <Image
                  src="/icons/icon-new-session.png"
                  alt=""
                  width={64}
                  height={64}
                  className="welcome-card-icon"
                  aria-hidden="true"
                  priority
                />
                <p className="welcome-card-title">Start new session</p>
                <p className="welcome-card-desc">
                  Set up vehicles, drivers, and delivery stops to create your
                  optimized route.
                </p>
                <button
                  className="welcome-card-cta"
                  aria-label="Start new session — continue"
                  onClick={handleNewSession}
                >
                  Continue
                </button>
              </div>

              <div className="welcome-card">
                <Image
                  src="/icons/icon-resume-session.png"
                  alt=""
                  width={64}
                  height={64}
                  className="welcome-card-icon"
                  aria-hidden="true"
                  priority
                />
                <p className="welcome-card-title">Resume session</p>
                <p className="welcome-card-desc">
                  Import a saved CSV file from a previous session to continue
                  managing and optimizing routes.
                </p>
                <button
                  className="welcome-card-cta"
                  aria-label="Resume session — continue"
                  onClick={() => router.push("/upload-save-point")}
                >
                  Continue
                </button>
              </div>
            </div>
          </div>

          <button className="welcome-back" onClick={() => router.back()}>
            <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
              <path
                d="M10 3L5 8l5 5"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            Back
          </button>
        </div>

        <PageFooter />
      </div>
    </>
  );
}
