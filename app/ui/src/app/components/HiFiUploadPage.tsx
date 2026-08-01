"use client";

import { useRef, type ChangeEventHandler, type DragEventHandler } from "react";
import ShellNavbar from "@/app/components/ShellNavbar";
import { formatSize, PageFooter } from "@/app/utils/routeUtils";

type HiFiUploadPageProps = {
  title: string;
  dropzoneText: string;
  description: string;
  accept: string;
  file: File | null;
  isDragging: boolean;
  isProcessing: boolean;
  error: string | null;
  onSelectFile: (file: File) => void;
  onDragEnter: DragEventHandler<HTMLDivElement>;
  onDragLeave: DragEventHandler<HTMLDivElement>;
  onDrop: DragEventHandler<HTMLDivElement>;
  onRemoveFile: () => void;
  onCancel: () => void;
  onNext: () => void;
};

export default function HiFiUploadPage({
  title,
  dropzoneText,
  description,
  accept,
  file,
  isDragging,
  isProcessing,
  error,
  onSelectFile,
  onDragEnter,
  onDragLeave,
  onDrop,
  onRemoveFile,
  onCancel,
  onNext,
}: HiFiUploadPageProps) {
  const inputRef = useRef<HTMLInputElement>(null);

  const openFilePicker = () => {
    if (!isProcessing) inputRef.current?.click();
  };

  const handleDragEnter: DragEventHandler<HTMLDivElement> = (event) => {
    event.preventDefault();
    if (!isProcessing) onDragEnter(event);
  };

  const handleDragLeave: DragEventHandler<HTMLDivElement> = (event) => {
    event.preventDefault();
    if (!isProcessing) onDragLeave(event);
  };

  const handleDrop: DragEventHandler<HTMLDivElement> = (event) => {
    event.preventDefault();
    if (!isProcessing) onDrop(event);
  };

  const handleFileChange: ChangeEventHandler<HTMLInputElement> = (event) => {
    const selectedFile = event.target.files?.[0];
    if (!isProcessing && selectedFile) onSelectFile(selectedFile);
    event.target.value = "";
  };

  return (
    <>
      <style>{`
        .upload-root {
          min-height: 100vh;
          background: var(--edit-bg-primary);
          display: flex;
          flex-direction: column;
          color: var(--edit-text-primary);
          font-family: var(--font-manrope), Arial, Helvetica, sans-serif;
        }

        .upload-root > header {
          height: 68px !important;
          padding: 16px !important;
          background: var(--edit-stone-50) !important;
          border: 0 !important;
          position: relative !important;
          flex-shrink: 0;
        }

        .upload-root > header a,
        .upload-root > header span {
          color: var(--edit-text-primary) !important;
          font-family: inherit !important;
          font-size: 20px !important;
          font-weight: 700 !important;
          letter-spacing: 0 !important;
          text-transform: none !important;
        }

        .upload-content {
          flex: 1;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 64px 24px 48px;
        }

        .upload-panel {
          width: min(752px, 100%);
          display: flex;
          flex-direction: column;
          align-items: flex-end;
          gap: 24px;
        }

        .upload-form {
          width: 100%;
          display: flex;
          flex-direction: column;
          gap: 16px;
        }

        .upload-form-main {
          display: flex;
          flex-direction: column;
          gap: 24px;
        }

        .upload-title {
          margin: 0;
          color: var(--edit-text-primary);
          font-size: 20px;
          font-weight: 700;
          line-height: 28px;
        }

        .upload-dropzone {
          width: 100%;
          height: 200px;
          box-sizing: border-box;
          border: 1px dashed var(--edit-stone-200);
          border-radius: 6px;
          padding: 24px 16px 16px;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 8px;
          cursor: pointer;
          background: var(--edit-stone-50);
          transition: border-color 0.15s, background 0.15s;
        }

        .upload-dropzone.dragging {
          border-color: var(--edit-drop-zone-active-border);
          background: var(--edit-drop-zone-active-bg);
        }

        .upload-dropzone.processing {
          cursor: not-allowed;
        }

        .upload-dropzone-icon {
          color: var(--edit-text-primary);
          line-height: 0;
        }

        .upload-dropzone-prompt {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 8px;
        }

        .upload-dropzone-text {
          margin: 0;
          color: var(--edit-text-primary);
          font-size: 16px;
          font-weight: 400;
          line-height: 24px;
          text-align: center;
        }

        .upload-dropzone-browse,
        .upload-cancel-btn {
          border: 0;
          border-radius: 4px;
          background: transparent;
          color: var(--edit-text-primary);
          cursor: pointer;
          font-family: inherit;
          font-size: 14px;
          font-weight: 600;
          line-height: 20px;
          min-height: 36px;
          padding: 8px 12px;
        }

        .upload-dropzone-browse:hover,
        .upload-cancel-btn:hover {
          background: var(--edit-tertiary-btn-hover);
        }

        .upload-dropzone-browse:focus-visible,
        .upload-cancel-btn:focus-visible,
        .upload-continue-btn:focus-visible,
        .upload-file-remove:focus-visible {
          outline: 2px solid var(--edit-teal-500);
          outline-offset: 2px;
        }

        .upload-description {
          margin: 0;
          color: var(--edit-text-secondary);
          font-size: 14px;
          font-weight: 400;
          line-height: 21px;
        }

        .upload-file-row {
          width: 100%;
          display: flex;
          align-items: center;
          gap: 10px;
        }

        .upload-file-name {
          overflow: hidden;
          color: var(--edit-text-primary);
          font-size: 16px;
          font-weight: 400;
          line-height: 24px;
          text-overflow: ellipsis;
          white-space: nowrap;
          flex: 1;
        }

        .upload-file-size {
          color: var(--edit-text-secondary);
          font-size: 14px;
          line-height: 21px;
          white-space: nowrap;
        }

        .upload-file-remove {
          background: none;
          border: none;
          cursor: pointer;
          color: var(--edit-text-primary);
          padding: 4px;
          display: flex;
          align-items: center;
          line-height: 1;
        }

        .upload-file-remove:hover { opacity: 0.7; }

        .upload-file-remove:disabled {
          cursor: not-allowed;
          opacity: 0.48;
        }

        .upload-actions {
          display: flex;
          align-items: center;
          gap: 6px;
        }

        .upload-continue-btn {
          border: none;
          border-radius: 4px;
          background: var(--edit-btn-primary);
          color: var(--edit-text-primary);
          cursor: pointer;
          font-family: inherit;
          font-size: 14px;
          font-weight: 600;
          line-height: 20px;
          min-height: 36px;
          padding: 8px 12px;
          transition: background 0.15s;
        }

        .upload-continue-btn:hover:not(:disabled) {
          background: var(--edit-teal-400);
        }

        .upload-continue-btn:disabled {
          opacity: 0.48;
          cursor: not-allowed;
        }

        .upload-parse-error {
          width: 100%;
          margin: 0;
          color: var(--edit-error-border);
          font-size: 14px;
          line-height: 21px;
        }

        @keyframes upload-spin {
          to { transform: rotate(360deg); }
        }

        .upload-spinner {
          width: 32px;
          height: 32px;
          border: 3px solid var(--edit-stone-200);
          border-top-color: var(--edit-teal-500);
          border-radius: 50%;
          animation: upload-spin 0.8s linear infinite;
        }

        .upload-root > footer {
          flex-shrink: 0;
          border: 0 !important;
          padding: 24px !important;
          font-family: inherit !important;
        }

        .upload-root > footer img {
          width: 25px !important;
          height: 28px !important;
        }

        .upload-root > footer span {
          max-width: none !important;
          color: var(--edit-text-primary) !important;
          font-family: inherit !important;
          font-size: 16px !important;
          line-height: 24px !important;
        }

        @media (max-width: 640px) {
          .upload-content {
            justify-content: flex-start;
            padding: 48px 16px;
          }

          .upload-dropzone {
            height: 180px;
          }

          .upload-dropzone-text {
            white-space: normal;
          }

          .upload-file-name {
            font-size: 14px;
          }

          .upload-root > footer {
            align-items: flex-end !important;
            gap: 16px;
            padding: 16px !important;
          }

          .upload-root > footer span {
            font-size: 12px !important;
            line-height: 18px !important;
          }
        }
      `}</style>

      <div className="upload-root">
        <ShellNavbar />

        <div className="upload-content">
          <div className="upload-panel">
            <div className="upload-form">
              <div className="upload-form-main">
                <h1 className="upload-title">{title}</h1>
                <div
                  className={`upload-dropzone${isDragging ? " dragging" : ""}${
                    isProcessing ? " processing" : ""
                  }`}
                  onClick={openFilePicker}
                  onDragEnter={handleDragEnter}
                  onDragOver={(event) => event.preventDefault()}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                  aria-disabled={isProcessing}
                >
                  {isProcessing ? (
                    <div className="upload-spinner" />
                  ) : (
                    <>
                      <div className="upload-dropzone-icon" aria-hidden="true">
                        <svg
                          width="40"
                          height="40"
                          viewBox="0 0 40 40"
                          fill="none"
                        >
                          <path
                            d="M24 4H10a2 2 0 00-2 2v28a2 2 0 002 2h20a2 2 0 002-2V14L24 4z"
                            stroke="currentColor"
                            strokeWidth="1.75"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          />
                          <path
                            d="M24 4v10h10"
                            stroke="currentColor"
                            strokeWidth="1.75"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          />
                          <path
                            d="M20 27v-8m-4 4l4-4 4 4"
                            stroke="currentColor"
                            strokeWidth="1.75"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          />
                        </svg>
                      </div>
                      <div className="upload-dropzone-prompt">
                        <p className="upload-dropzone-text">{dropzoneText}</p>
                        <button
                          type="button"
                          className="upload-dropzone-browse"
                          onClick={(event) => {
                            event.stopPropagation();
                            openFilePicker();
                          }}
                        >
                          Browse files
                        </button>
                      </div>
                    </>
                  )}
                  <input
                    ref={inputRef}
                    type="file"
                    accept={accept}
                    className="hidden"
                    onChange={handleFileChange}
                    disabled={isProcessing}
                  />
                </div>
                <p className="upload-description">{description}</p>
              </div>

              <div className="upload-file-row">
                <svg
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  aria-hidden="true"
                >
                  <path
                    d="M21.44 11.05l-9.19 9.19a6 6 0 01-8.49-8.49l9.19-9.19a4 4 0 015.66 5.66l-9.2 9.19a2 2 0 01-2.83-2.83l8.49-8.48"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
                <span className="upload-file-name">
                  {file ? file.name : "No file added"}
                </span>
                {file && (
                  <>
                    <span className="upload-file-size">
                      {formatSize(file.size)}
                    </span>
                    <button
                      type="button"
                      className="upload-file-remove"
                      onClick={onRemoveFile}
                      aria-label="Remove file"
                      disabled={isProcessing}
                    >
                      <svg
                        width="16"
                        height="16"
                        viewBox="0 0 24 24"
                        fill="none"
                        aria-hidden="true"
                      >
                        <path
                          d="M6 6l12 12M18 6L6 18"
                          stroke="currentColor"
                          strokeWidth="1.8"
                          strokeLinecap="round"
                        />
                      </svg>
                    </button>
                  </>
                )}
              </div>
            </div>

            {error && (
              <p className="upload-parse-error" role="alert">
                {error}
              </p>
            )}

            <div className="upload-actions">
              <button
                type="button"
                className="upload-cancel-btn"
                onClick={onCancel}
              >
                Cancel
              </button>
              <button
                type="button"
                className="upload-continue-btn"
                onClick={onNext}
                disabled={!file || isProcessing}
              >
                {isProcessing ? "Processing..." : "Next"}
              </button>
            </div>
          </div>
        </div>

        <PageFooter />
      </div>
    </>
  );
}
