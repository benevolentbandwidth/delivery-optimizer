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
    // Only .json route files are accepted — CSV is rejected here.
    if (!f.name.endsWith(".json")) {
      setError("Only .json route files are accepted.");
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
      router.push("/driver-view");
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Something went wrong. Please try again.",
      );
    } finally {
      setIsProcessing(false);
    }
  }, [file, isProcessing, router]);

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Serif+Display&family=DM+Sans:wght@400;500;600&display=swap');

        .upload-root {
          min-height: 100vh;
          background: #f7f7f5;
          display: flex;
          flex-direction: column;
          font-family: 'DM Sans', sans-serif;
        }

        .upload-content {
          flex: 1;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 48px 24px;
        }

        .upload-title {
          font-family: 'DM Serif Display', serif;
          font-size: 2rem;
          font-weight: 400;
          color: #111;
          margin-bottom: 8px;
          text-align: center;
          letter-spacing: -0.01em;
        }

        .upload-subtitle {
          font-size: 14px;
          color: #888;
          margin-bottom: 32px;
          text-align: center;
        }

        .upload-dropzone {
          width: 100%;
          max-width: 580px;
          height: 200px;
          border: 1px dashed #dcdbd8;
          border-radius: 6px;
          padding: 24px 24px 16px;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 8px;
          background: #f8f7f5;
          transition: border-color 0.15s, background 0.15s;
          margin-bottom: 8px;
        }

        .upload-dropzone.dragging {
          border-color: #57ac91;
          background: #f0faf6;
        }

        .upload-dropzone-icon { color: #3d3d3c; margin-bottom: 4px; display: flex; }

        .upload-dropzone-text {
          font-size: 16px;
          color: #272725;
          text-align: center;
        }

        .upload-dropzone-browse {
          font-size: 14px;
          font-weight: 600;
          color: #272725;
          text-align: center;
          background: none;
          border: none;
          cursor: pointer;
          font-family: inherit;
          padding: 8px 16px;
          border-radius: 4px;
          transition: background 0.15s;
        }

        .upload-dropzone-browse:hover { background: #f6f5f2; }

        .upload-dropzone-description {
          width: 100%;
          max-width: 580px;
          font-size: 14px;
          color: #464544;
          margin-bottom: 24px;
        }

        .upload-file-row {
          width: 100%;
          max-width: 580px;
          background: #d5f2e8;
          border: none;
          border-radius: 6px;
          padding: 16px;
          display: flex;
          align-items: center;
          gap: 10px;
          margin-bottom: 24px;
          min-width: 0;
        }

        .upload-file-name {
          font-size: 13px;
          font-weight: 500;
          color: #111;
          flex: 1;
          min-width: 0;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        .upload-file-size { font-size: 12px; color: #666; }

        .upload-file-remove {
          background: none;
          border: none;
          cursor: pointer;
          color: #555;
          padding: 4px;
          display: flex;
          align-items: center;
          line-height: 1;
        }

        .upload-file-remove:hover { color: #111; }

        .upload-actions {
          width: 100%;
          max-width: 580px;
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-top: 8px;
        }

        .upload-back-btn {
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

        .upload-back-btn:hover { color: #111; }

        .upload-continue-btn {
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

        .upload-continue-btn:hover:not(:disabled) { background: #3d7a6a; }

        .upload-continue-btn:disabled {
          opacity: 0.4;
          cursor: not-allowed;
        }

        .upload-parse-error {
          width: 100%;
          max-width: 580px;
          font-size: 13px;
          color: #c0392b;
          margin-bottom: 12px;
          text-align: center;
        }

        @keyframes upload-spin {
          to { transform: rotate(360deg); }
        }

        .upload-spinner {
          width: 32px;
          height: 32px;
          border: 3px solid #e0e0e0;
          border-top-color: #4a8c7a;
          border-radius: 50%;
          animation: upload-spin 0.8s linear infinite;
        }

        @media (max-width: 520px) {
          .upload-content {
            justify-content: flex-start;
            padding-top: 36px;
            padding-bottom: calc(24px + env(safe-area-inset-bottom));
          }

          .upload-title {
            font-size: 1.75rem;
          }

          .upload-subtitle {
            margin-bottom: 24px;
            max-width: 280px;
            line-height: 1.5;
          }

          .upload-actions {
            align-items: stretch;
            flex-direction: column-reverse;
            gap: 16px;
          }

          .upload-back-btn {
            justify-content: center;
            min-height: 44px;
          }

          .upload-continue-btn {
            min-height: 48px;
            width: 100%;
          }
        }
      `}</style>

      <div className="upload-root">
        <ShellNavbar />

        <div className="upload-content">
          <h2 className="upload-title">Upload your route</h2>
          <p className="upload-subtitle">
            Upload your route to begin your deliveries!
          </p>

          {/* Drop zone — shows spinner while file is being read */}
          <div
            className={`upload-dropzone${isDragging ? " dragging" : ""}`}
            onDragEnter={handleDragEnter}
            onDragOver={(e) => e.preventDefault()}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
          >
            {isProcessing ? (
              <div className="upload-spinner" />
            ) : (
              <>
                <div className="upload-dropzone-icon">
                  <svg width="40" height="40" viewBox="0 0 40 40" fill="none">
                    <path
                      d="M18.667 31.6112H21.4449V23.7083L24.6116 26.875L26.5557 24.9166L20.0003 18.4721L13.5003 24.9721L15.4587 26.9166L18.667 23.7083V31.6112ZM9.44491 36.6666C8.69491 36.6666 8.04435 36.3912 7.49324 35.8404C6.94241 35.2893 6.66699 34.6387 6.66699 33.8887V6.11123C6.66699 5.36123 6.94241 4.71068 7.49324 4.15956C8.04435 3.60873 8.69491 3.33331 9.44491 3.33331H23.917L33.3337 12.75V33.8887C33.3337 34.6387 33.0582 35.2893 32.5074 35.8404C31.9563 36.3912 31.3057 36.6666 30.5557 36.6666H9.44491ZM22.5282 14.0554V6.11123H9.44491V33.8887H30.5557V14.0554H22.5282Z"
                      fill="currentColor"
                    />
                  </svg>
                </div>
                <p className="upload-dropzone-text">
                  Drag and drop .json files here, or
                </p>
                <button
                  type="button"
                  className="upload-dropzone-browse"
                  onClick={() => inputRef.current?.click()}
                >
                  Browse files
                </button>
              </>
            )}
            <input
              ref={inputRef}
              type="file"
              accept=".json"
              style={{ display: "none" }}
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) handleFile(f);
                e.target.value = "";
              }}
            />
          </div>

          <p className="upload-dropzone-description">
            Import your route file to begin. Maximum file size of {MAX_FILE_MB}{" "}
            MB.
          </p>

          {file && !isProcessing && (
            <div className="upload-file-row">
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                style={{ color: "#3d3d3c", flexShrink: 0 }}
              >
                <path
                  d="M21.44 11.05l-9.19 9.19a6 6 0 01-8.49-8.49l9.19-9.19a4 4 0 015.66 5.66l-9.2 9.19a2 2 0 01-2.83-2.83l8.49-8.48"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
              <span className="upload-file-name">{file.name}</span>
              <span className="upload-file-size">{formatSize(file.size)}</span>
              <button
                className="upload-file-remove"
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

          {error && <p className="upload-parse-error">{error}</p>}

          <div className="upload-actions">
            <button className="upload-back-btn" onClick={() => router.back()}>
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
              className="upload-continue-btn"
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
