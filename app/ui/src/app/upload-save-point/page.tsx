"use client";

export const dynamic = "force-dynamic";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import HiFiUploadPage from "@/app/components/HiFiUploadPage";
import { createUploadOperation } from "@/app/utils/uploadOperation";
import { migrateSessionSaveFile } from "@/lib/validation/session.schema";

const MAX_FILE_MB = 10;
const MAX_FILE_BYTES = MAX_FILE_MB * 1024 * 1024;

export default function UploadSavePointPage() {
  const router = useRouter();
  const [isDragging, setIsDragging] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [continueError, setContinueError] = useState<string | null>(null);
  const dragDepth = useRef(0);
  const [activeOperation] = useState(createUploadOperation);

  useEffect(() => {
    return () => {
      activeOperation.invalidate();
    };
  }, [activeOperation]);

  const handleFile = (f: File) => {
    setContinueError(null);
    if (!f.name.endsWith(".json") && !f.name.endsWith(".csv")) {
      setContinueError("Only .json or .csv files are accepted.");
      return;
    }
    if (f.size > MAX_FILE_BYTES) {
      setContinueError(`File exceeds the ${MAX_FILE_MB} MB limit.`);
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
    const operation = activeOperation.start();
    const isCurrentOperation = () => activeOperation.isCurrent(operation);

    setIsProcessing(true);
    setContinueError(null);

    try {
      if (file.name.endsWith(".json")) {
        let text: string;
        let parsed: unknown;

        try {
          text = await file.text();
          if (!isCurrentOperation()) return;
          parsed = JSON.parse(text);
        } catch {
          if (isCurrentOperation()) {
            setContinueError("This file is not valid JSON.");
          }
          return;
        }

        // Valid session save — restore full state on edit page
        try {
          migrateSessionSaveFile(parsed);
          if (!isCurrentOperation()) return;
          sessionStorage.setItem(
            "savePointFile",
            JSON.stringify({ name: file.name, content: text }),
          );
          if (!isCurrentOperation()) return;
          router.push("/edit");
          return;
        } catch {
          // Not a session save — fall through to CSVUploadOverlay column-mapper
        }
      }

      // CSV or raw JSON array: store the file content and navigate to /edit,
      // which will open CSVUploadOverlay automatically on mount.
      const text = await file.text();
      if (!isCurrentOperation()) return;
      try {
        sessionStorage.setItem(
          "pendingCSVFile",
          JSON.stringify({ name: file.name, content: text }),
        );
      } catch {
        // sessionStorage has a ~5 MB quota — large files can exceed it.
        // Fail visibly rather than silently navigating to a blank column mapper.
        if (isCurrentOperation()) {
          setContinueError(
            "This file is too large to import directly. Please use a smaller file (under 5 MB).",
          );
        }
        return;
      }
      if (!isCurrentOperation()) return;
      router.push("/edit");
    } catch (err) {
      if (isCurrentOperation()) {
        setContinueError(
          err instanceof Error
            ? err.message
            : "Something went wrong. Please try again.",
        );
      }
    } finally {
      if (isCurrentOperation()) {
        setIsProcessing(false);
      }
    }
  }, [activeOperation, file, isProcessing, router]);

  const handleCancel = () => {
    activeOperation.invalidate();
    setIsProcessing(false);
    router.back();
  };

  return (
    <HiFiUploadPage
      title="Import from saved CSV or JSON"
      dropzoneText="Drag and drop CSV or JSON files here, or"
      description={`Import delivery details from a saved CSV or JSON file. Maximum file size of ${MAX_FILE_MB} MB.`}
      accept=".json,.csv"
      file={file}
      isDragging={isDragging}
      isProcessing={isProcessing}
      error={continueError}
      onSelectFile={handleFile}
      onDragEnter={handleDragEnter}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      onRemoveFile={() => {
        setFile(null);
        setContinueError(null);
      }}
      onCancel={handleCancel}
      onNext={() => void handleContinue()}
    />
  );
}
