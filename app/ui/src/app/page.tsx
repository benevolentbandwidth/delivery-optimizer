// app/page.tsx
"use client";
import Image from "next/image";
import { useRouter } from "next/navigation";
import ShellNavbar from "./components/ShellNavbar";
import { PageFooter } from "./utils/routeUtils";

export default function LandingPage() {
  const router = useRouter();

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600&display=swap');

        .landing-root {
          min-height: 100vh;
          display: flex;
          flex-direction: column;
          font-family: 'DM Sans', sans-serif;
          position: relative;
        }

        .landing-bg {
          position: fixed;
          inset: 0;
          background:
            radial-gradient(ellipse at 100% 0%,   #cfe6da 0%, rgba(207,230,218,0) 55%),
            radial-gradient(ellipse at 0%   100%, #cfe6da 0%, rgba(207,230,218,0) 55%),
            #fbfaf7;
          z-index: 0;
        }

        .landing-navbar-wrap {
          position: relative;
          z-index: 10;
          background: #ffffff;
        }

        .landing-content {
          flex: 1;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 48px 24px;
          position: relative;
          z-index: 1;
        }

        .landing-title {
          font-family: 'DM Sans', sans-serif;
          font-size: 1.75rem;
          font-weight: 600;
          color: #111;
          margin-bottom: 12px;
          text-align: center;
          letter-spacing: -0.01em;
        }

        .landing-subtitle {
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

        .landing-cards {
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

        .landing-card {
          flex: 1;
          min-width: 220px;
          padding: 32px 28px 28px;
          display: flex;
          flex-direction: column;
          align-items: flex-start;
          gap: 10px;
          position: relative;
        }

        .landing-card + .landing-card::before {
          content: '';
          position: absolute;
          left: 0;
          top: 24px;
          bottom: 24px;
          width: 1px;
          background: rgba(0,0,0,0.08);
        }

        .landing-card-icon {
          width: 64px;
          height: 64px;
          object-fit: contain;
          margin-bottom: 4px;
        }

        .landing-card-title {
          font-size: 17px;
          font-weight: 600;
          color: #111;
          margin: 0;
        }

        .landing-card-desc {
          font-size: 13px;
          color: #666;
          line-height: 1.55;
          margin: 0;
          flex: 1;
        }

        .landing-card-cta {
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

        .landing-card-cta:hover { background: #3d7a6a; }

        .landing-card-cta:focus-visible {
          outline: 2px solid #4a8c7a;
          outline-offset: 2px;
        }

        .landing-root footer,
        .landing-root [class*="footer"],
        .landing-root [class*="Footer"] {
          background: #ffffff !important;
          position: relative;
          z-index: 1;
        }

        @media (max-width: 520px) {
          .landing-cards {
            flex-wrap: wrap;
          }

          .landing-card {
            min-width: 100%;
          }

          .landing-card + .landing-card::before {
            left: 24px;
            right: 24px;
            top: 0;
            bottom: auto;
            width: auto;
            height: 1px;
          }
        }
      `}</style>

      <div className="landing-root">
        <div className="landing-bg" />

        <div className="landing-navbar-wrap">
          <ShellNavbar />
        </div>

        <div className="landing-content">
          <h1 className="landing-title">Welcome to Delivery Optimizer</h1>
          <p className="landing-subtitle">
            Transform your address lists into efficient, ordered routes to lower
            operational costs and reduce your fleet&apos;s carbon emissions.
          </p>

          <div className="landing-cards">
            <div className="landing-card">
              <Image
                src="/icons/icon-route-manager.png"
                alt=""
                width={64}
                height={64}
                className="landing-card-icon"
                aria-hidden="true"
                priority
              />
              <p className="landing-card-title">Route manager</p>
              <p className="landing-card-desc">
                Upload and edit addresses, assign deliveries, monitor fleet
                routes, and export delivery operations.
              </p>
              <button
                className="landing-card-cta"
                aria-label="Route manager — continue"
                onClick={() => router.push("/welcome")}
              >
                Continue
              </button>
            </div>

            <div className="landing-card">
              <Image
                src="/icons/icon-driver.png"
                alt=""
                width={64}
                height={64}
                className="landing-card-icon"
                aria-hidden="true"
                priority
              />
              <p className="landing-card-title">Driver</p>
              <p className="landing-card-desc">
                View your assigned route, navigate through addresses, and update
                delivery status.
              </p>
              <button
                className="landing-card-cta"
                aria-label="Driver — continue"
                onClick={() => router.push("/upload-route")}
              >
                Continue
              </button>
            </div>
          </div>
        </div>

        <PageFooter />
      </div>
    </>
  );
}
