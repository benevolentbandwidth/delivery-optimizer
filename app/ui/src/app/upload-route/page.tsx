// app/upload-route/page.tsx
"use client";

export const dynamic = "force-dynamic";

import { useCallback, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import ShellNavbar from "@/app/components/ShellNavbar";
import { formatSize } from "@/app/utils/routeUtils";

const MAX_FILE_MB = 10;
const MAX_FILE_BYTES = MAX_FILE_MB * 1024 * 1024;

export default function UploadRoutePage() {
  const router = useRouter();
  const [isDragging, setIsDragging] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const dragDepth = useRef(0);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFile = (f: File) => {
    setError(null);
    if (!f.name.endsWith(".json") && !f.name.endsWith(".csv")) {
      setError("Only .json or .csv route files are accepted.");
      return;
    }
    if (f.size > MAX_FILE_BYTES) {
      setError(`File exceeds the ${MAX_FILE_MB} MB limit.`);
      return;
    }
    setFile(f);
  };

  const handleDragEnter = (e: React.DragEvent) => {
    e.preventDefault();
    dragDepth.current += 1;
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    dragDepth.current -= 1;
    if (dragDepth.current === 0) setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    dragDepth.current = 0;
    setIsDragging(false);
    const f = e.dataTransfer.files[0];
    if (f) handleFile(f);
  };

  const handleContinue = useCallback(async () => {
    if (!file || isProcessing) return;
    setIsProcessing(true);
    setError(null);

    try {
      const text = await file.text();
      sessionStorage.setItem(
        "routeFile",
        JSON.stringify({ name: file.name, content: text }),
      );
      router.push("/driver_assist");
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Something went wrong. Please try again.",
      );
      setIsProcessing(false);
    }
  }, [file, isProcessing, router]);

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Serif+Display&family=DM+Sans:wght@400;500;600&display=swap');

        .ur-root {
          min-height: 100vh;
          background: #f7f7f5;
          display: flex;
          flex-direction: column;
          font-family: 'DM Sans', sans-serif;
        }

        .ur-content {
          flex: 1;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          width: 100%;
          padding: clamp(28px, 8vw, 48px) clamp(16px, 5vw, 24px);
        }

        .ur-title {
          font-family: 'DM Serif Display', serif;
          font-size: 2rem;
          font-weight: 400;
          color: #111;
          margin-bottom: 8px;
          text-align: center;
          letter-spacing: -0.01em;
        }

        .ur-subtitle {
          font-size: 14px;
          color: #888;
          margin-bottom: 32px;
          text-align: center;
        }

        .ur-dropzone {
          width: 100%;
          max-width: 580px;
          border: 1.5px dashed #ccc;
          border-radius: 12px;
          min-height: 184px;
          padding: clamp(32px, 10vw, 52px) clamp(18px, 6vw, 24px);
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 10px;
          cursor: pointer;
          background: #f9f9f8;
          transition: border-color 0.15s, background 0.15s;
          margin-bottom: 16px;
          min-height: 160px;
        }

        .ur-dropzone.dragging {
          border-color: #4a8c7a;
          background: #f0f7f5;
        }

        .ur-dropzone-icon { color: #555; margin-bottom: 4px; }

        .ur-dropzone-text {
          font-size: 14px;
          color: #333;
          text-align: center;
        }

        .ur-dropzone-browse {
          font-size: 14px;
          color: #4a8c7a;
          font-weight: 500;
          text-align: center;
        }

        .ur-file-row {
          width: 100%;
          max-width: 580px;
          background: #eef5f3;
          border: 1px solid #d0e5df;
          border-radius: 8px;
          padding: 10px 16px;
          display: flex;
          align-items: center;
          gap: 10px;
          margin-bottom: 24px;
          min-width: 0;
        }

        .ur-file-name {
          font-size: 13px;
          font-weight: 500;
          color: #111;
          flex: 1;
          min-width: 0;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        .ur-file-size { font-size: 12px; color: #666; }

        .ur-file-remove {
          background: none;
          border: none;
          cursor: pointer;
          color: #555;
          padding: 4px;
          display: flex;
          align-items: center;
          line-height: 1;
        }

        .ur-file-remove:hover { color: #111; }

        .ur-actions {
          width: 100%;
          max-width: 580px;
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-top: 8px;
        }

        .ur-back-btn {
          background: none;
          border: none;
          cursor: pointer;
          font-size: 14px;
          color: #555;
          display: flex;
          align-items: center;
          gap: 6px;
          font-family: inherit;
        }

        .ur-back-btn:hover { color: #111; }

        .ur-continue-btn {
          background: #4a8c7a;
          color: #fff;
          border: none;
          border-radius: 999px;
          padding: 10px 28px;
          font-size: 14px;
          font-weight: 500;
          cursor: pointer;
          font-family: inherit;
          transition: background 0.15s;
        }

        .ur-continue-btn:hover:not(:disabled) { background: #3d7a6a; }

        .ur-continue-btn:disabled {
          opacity: 0.4;
          cursor: not-allowed;
        }

        .ur-error {
          width: 100%;
          max-width: 580px;
          font-size: 13px;
          color: #c0392b;
          margin-bottom: 12px;
          text-align: center;
        }

        @keyframes ur-spin {
          to { transform: rotate(360deg); }
        }

        .ur-spinner {
          width: 32px;
          height: 32px;
          border: 3px solid #e0e0e0;
          border-top-color: #4a8c7a;
          border-radius: 50%;
          animation: ur-spin 0.8s linear infinite;
        }

        @media (max-width: 520px) {
          .ur-content {
            justify-content: flex-start;
            padding-top: 36px;
            padding-bottom: calc(24px + env(safe-area-inset-bottom));
          }

          .ur-title {
            font-size: 1.75rem;
          }

          .ur-subtitle {
            margin-bottom: 24px;
            max-width: 280px;
            line-height: 1.5;
          }

          .ur-actions {
            align-items: stretch;
            flex-direction: column-reverse;
            gap: 16px;
          }

          .ur-back-btn {
            justify-content: center;
            min-height: 44px;
          }

          .ur-continue-btn {
            min-height: 48px;
            width: 100%;
          }
        }
      `}</style>

      <div className="ur-root">
        <ShellNavbar />

        <div className="ur-content">
          <h2 className="ur-title">Upload your route</h2>
          <p className="ur-subtitle">
            Upload your route to begin your deliveries!
          </p>

          {/* Drop zone — shows spinner while file is being read */}
          <div
            className={`ur-dropzone${isDragging ? " dragging" : ""}`}
            onClick={() => !isProcessing && inputRef.current?.click()}
            onDragEnter={handleDragEnter}
            onDragOver={(e) => e.preventDefault()}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
          >
            {isProcessing ? (
              <div className="ur-spinner" />
            ) : (
              <>
                <div className="ur-dropzone-icon">
                  <svg width="32" height="40" viewBox="0 0 32 40" fill="none">
                    <rect
                      x="1"
                      y="1"
                      width="22"
                      height="34"
                      rx="3"
                      stroke="currentColor"
                      strokeWidth="1.5"
                      fill="none"
                    />
                    <path
                      d="M7 10h10M7 15h10M7 20h6"
                      stroke="currentColor"
                      strokeWidth="1.5"
                      strokeLinecap="round"
                    />
                    <path
                      d="M15 26v-7M15 19l-3 3M15 19l3 3"
                      stroke="currentColor"
                      strokeWidth="1.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </div>
                <p className="ur-dropzone-text">
                  Drag and drop .json or .csv files here, or
                </p>
                <p className="ur-dropzone-browse">Browse files</p>
              </>
            )}
            <input
              ref={inputRef}
              type="file"
              accept=".json,.csv"
              style={{ display: "none" }}
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) handleFile(f);
                e.target.value = "";
              }}
            />
          </div>

          {file && !isProcessing && (
            <div className="ur-file-row">
              <span className="ur-file-name">{file.name}</span>
              <span className="ur-file-size">{formatSize(file.size)}</span>
              <button
                className="ur-file-remove"
                onClick={(e) => {
                  e.stopPropagation();
                  setFile(null);
                  setError(null);
                }}
                aria-label="Remove file"
              >
                ×
              </button>
            </div>
          )}

          {error && <p className="ur-error">{error}</p>}

          <div className="ur-actions">
            <button className="ur-back-btn" onClick={() => router.back()}>
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
            <button
              className="ur-continue-btn"
              onClick={() => void handleContinue()}
              disabled={!file || isProcessing}
            >
              {isProcessing ? "Processing..." : "Continue"}
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
