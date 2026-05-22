"use client";

import type { CSSProperties } from "react";
import { useEffect, useMemo, useRef, useState } from "react";

import {
  createPersistedRouteState,
  loadSessionFromFile,
  parsePersistedRouteState,
} from "@/lib/driver-route/importSession";
import { transformSessionToDriverRoute } from "@/lib/driver-route/transformSession";
import type { DeliveryStop, DriverRoute } from "@/lib/driver-route/types";

const STORAGE_KEY = "driver_assist.routeState";

function readSavedRoute(): DriverRoute | null {
  if (typeof window === "undefined") return null;

  try {
    const saved = window.localStorage.getItem(STORAGE_KEY);
    if (!saved) return null;
    return parsePersistedRouteState(JSON.parse(saved)).route;
  } catch {
    window.localStorage.removeItem(STORAGE_KEY);
    return null;
  }
}

function openNavigation(stop: DeliveryStop) {
  const query =
    stop.lat !== 0 || stop.lng !== 0
      ? `${stop.lat},${stop.lng}`
      : encodeURIComponent(stop.address);

  window.open(
    `https://www.google.com/maps/dir/?api=1&destination=${query}`,
    "_blank",
  );
}

export default function DriverAssistPwaPage() {
  const inputRef = useRef<HTMLInputElement>(null);
  const [route, setRoute] = useState<DriverRoute | null>(null);
  const [openId, setOpenId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isImporting, setIsImporting] = useState(false);
  const [failureReport, setFailureReport] = useState<{
    stopId: string;
    reason: string;
  } | null>(null);

  useEffect(() => {
    setRoute(readSavedRoute());
  }, []);

  useEffect(() => {
    if (!route) return;
    window.localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify(createPersistedRouteState(route)),
    );
  }, [route]);

  const totals = useMemo(() => {
    const stops = route?.stops || [];
    const completed = stops.filter(
      (stop) => stop.status === "completed",
    ).length;
    const failed = stops.filter((stop) => stop.status === "failed").length;
    const pending = stops.filter((stop) => stop.status === "pending").length;

    return {
      completed,
      failed,
      pending,
      total: stops.length,
      progress: stops.length > 0 ? completed / stops.length : 0,
    };
  }, [route]);

  const importRoute = async (file: File) => {
    setError(null);
    setIsImporting(true);

    try {
      const session = await loadSessionFromFile(file);
      const nextRoute = transformSessionToDriverRoute(session);
      setRoute(nextRoute);
      setOpenId(nextRoute.stops[0]?.id || null);
    } catch (importError) {
      setError(
        importError instanceof Error
          ? importError.message
          : "Please upload a valid JSON file.",
      );
    } finally {
      setIsImporting(false);
    }
  };

  const updateStop = (stopId: string, changes: Partial<DeliveryStop>) => {
    setRoute((current) => {
      if (!current) return current;

      return {
        ...current,
        stops: current.stops.map((stop) =>
          stop.id === stopId ? { ...stop, ...changes } : stop,
        ),
      };
    });
  };

  const resetRoute = () => {
    window.localStorage.removeItem(STORAGE_KEY);
    setRoute(null);
    setOpenId(null);
    setError(null);
  };

  const pendingStops =
    route?.stops.filter((stop) => stop.status === "pending") || [];
  const resolvedStops =
    route?.stops.filter((stop) => stop.status !== "pending") || [];
  const reportStop = failureReport
    ? route?.stops.find((stop) => stop.id === failureReport.stopId)
    : null;

  const closeFailureReport = () => setFailureReport(null);

  const submitFailureReport = () => {
    if (!failureReport) return;

    updateStop(failureReport.stopId, {
      status: "failed",
      failureReason: failureReport.reason.trim() || "No reason provided",
    });
    setOpenId(null);
    closeFailureReport();
  };

  if (!route) {
    return (
      <main style={styles.safeArea}>
        <section style={styles.uploadScreen}>
          <h1 style={styles.appHeader}>driver_assist</h1>
          <input
            ref={inputRef}
            type="file"
            accept="application/json,.json"
            style={styles.hiddenInput}
            onChange={(event) => {
              const file = event.target.files?.[0];
              if (file) void importRoute(file);
            }}
          />
          <button
            type="button"
            style={styles.uploadButton}
            onClick={() => inputRef.current?.click()}
            disabled={isImporting}
          >
            {isImporting ? "Uploading..." : "Upload JSON"}
          </button>
          {error ? <p style={styles.errorText}>{error}</p> : null}
        </section>
      </main>
    );
  }

  return (
    <main style={styles.safeArea}>
      <section style={styles.container}>
        <div style={styles.topBar}>
          <h1 style={styles.appHeader}>driver_assist</h1>
          <button type="button" style={styles.textButton} onClick={resetRoute}>
            New route
          </button>
        </div>

        <section style={styles.summaryCard}>
          <p style={styles.headerLabel}>Current Route</p>
          <h2 style={styles.driverName}>{route.driverName}</h2>
          <p style={styles.routeLabel}>{route.routeLabel}</p>

          <div style={styles.progressHeader}>
            <span>Progress</span>
            <span>
              {totals.completed}/{totals.total} Deliveries Complete
            </span>
          </div>

          <div style={styles.progressTrack}>
            <div
              style={{
                ...styles.progressFill,
                width: `${totals.progress * 100}%`,
              }}
            />
          </div>

          <div style={styles.statsRow}>
            <StatBlock value={totals.pending} label="Remaining" />
            <StatBlock value={totals.failed} label="Failed" />
            <StatBlock value={totals.completed} label="Completed" />
          </div>
        </section>

        {pendingStops.map((stop) => (
          <StopCard
            key={stop.id}
            stop={stop}
            isOpen={openId === stop.id}
            onToggle={() => setOpenId(openId === stop.id ? null : stop.id)}
            onChangeNote={(notes) => updateStop(stop.id, { notes })}
            onComplete={() => {
              updateStop(stop.id, {
                status: "completed",
                completedAt: new Date().toISOString(),
              });
              setOpenId(null);
            }}
            onReport={() => {
              setFailureReport({
                stopId: stop.id,
                reason: stop.failureReason || "",
              });
            }}
            onNavigate={() => openNavigation(stop)}
          />
        ))}

        {resolvedStops.length > 0 ? (
          <section style={styles.historySection}>
            <h2 style={styles.historyTitle}>Completed & Failed</h2>
            {resolvedStops.map((stop) => (
              <StopCard
                key={stop.id}
                stop={stop}
                isOpen={openId === stop.id}
                onToggle={() => setOpenId(openId === stop.id ? null : stop.id)}
                onChangeNote={(notes) => updateStop(stop.id, { notes })}
                onComplete={() => undefined}
                onReport={() => undefined}
                onNavigate={() => openNavigation(stop)}
              />
            ))}
          </section>
        ) : null}

        {failureReport ? (
          <div style={styles.dialogBackdrop}>
            <section
              aria-modal="true"
              role="dialog"
              style={styles.dialog}
              aria-labelledby="failure-report-title"
            >
              <h2 id="failure-report-title" style={styles.dialogTitle}>
                Report delivery issue
              </h2>
              <p style={styles.dialogText}>
                {reportStop
                  ? `${reportStop.customerName} - Stop ${reportStop.stopNumber}`
                  : "Add a short reason for the failed delivery."}
              </p>
              <textarea
                autoFocus
                style={styles.noteInput}
                value={failureReport.reason}
                onChange={(event) =>
                  setFailureReport({
                    ...failureReport,
                    reason: event.target.value,
                  })
                }
                placeholder="Customer unavailable, blocked entrance, unsafe access..."
              />
              <div style={styles.dialogActions}>
                <button
                  type="button"
                  style={styles.secondaryButton}
                  onClick={closeFailureReport}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  style={styles.primaryButton}
                  onClick={submitFailureReport}
                >
                  Save issue
                </button>
              </div>
            </section>
          </div>
        ) : null}
      </section>
    </main>
  );
}

function StatBlock({ value, label }: { value: number; label: string }) {
  return (
    <div style={styles.statBlock}>
      <strong style={styles.statNumber}>{value}</strong>
      <span style={styles.statLabel}>{label}</span>
    </div>
  );
}

function StopCard({
  stop,
  isOpen,
  onToggle,
  onChangeNote,
  onComplete,
  onReport,
  onNavigate,
}: {
  stop: DeliveryStop;
  isOpen: boolean;
  onToggle: () => void;
  onChangeNote: (value: string) => void;
  onComplete: () => void;
  onReport?: () => void;
  onNavigate?: () => void;
}) {
  const isCompleted = stop.status === "completed";
  const isFailed = stop.status === "failed";
  const isDone = isCompleted || isFailed;
  const completedAtText = stop.completedAt
    ? new Date(stop.completedAt).toLocaleString()
    : null;

  return (
    <article
      style={{
        ...styles.card,
        ...(isCompleted ? styles.completedCard : {}),
        ...(isFailed ? styles.failedCard : {}),
      }}
    >
      <button type="button" style={styles.cardButton} onClick={onToggle}>
        <span
          style={{
            ...styles.statusCircle,
            ...(isCompleted ? styles.completedCircle : {}),
            ...(isFailed ? styles.failedCircle : {}),
          }}
        />
        <span style={styles.textBlock}>
          <strong style={styles.stopText}>Stop {stop.stopNumber}</strong>
          <span style={styles.nameText}>{stop.customerName}</span>
          {stop.phoneNumber ? (
            <span style={styles.phoneText}>{stop.phoneNumber}</span>
          ) : null}
          <span style={styles.addressText}>{stop.address}</span>
        </span>
      </button>

      {isOpen ? (
        <div style={styles.expandedSection}>
          <p style={styles.metaText}>Packages: {stop.packageCount}</p>
          <textarea
            style={styles.noteInput}
            value={stop.notes}
            onChange={(event) => onChangeNote(event.target.value)}
            placeholder="Add delivery note"
          />

          {isCompleted && completedAtText ? (
            <p style={styles.statusText}>Completed at: {completedAtText}</p>
          ) : null}

          {isFailed && stop.failureReason ? (
            <p style={styles.statusText}>
              Failure reason: {stop.failureReason}
            </p>
          ) : null}

          {!isDone ? (
            <div style={styles.buttonRow}>
              <button
                type="button"
                style={styles.actionButton}
                onClick={onComplete}
              >
                Complete
              </button>
              <button
                type="button"
                style={styles.actionButton}
                onClick={onNavigate}
              >
                Navigate
              </button>
              <button
                type="button"
                style={styles.actionButton}
                onClick={onReport}
              >
                Report
              </button>
            </div>
          ) : (
            <button
              type="button"
              style={styles.actionButton}
              onClick={onNavigate}
            >
              Navigate
            </button>
          )}
        </div>
      ) : null}
    </article>
  );
}

const styles: Record<string, CSSProperties> = {
  safeArea: {
    minHeight: "100svh",
    backgroundColor: "#ffffff",
    color: "#111827",
    fontFamily: "var(--font-geist-sans), Arial, sans-serif",
  },
  uploadScreen: {
    minHeight: "100svh",
    display: "flex",
    flexDirection: "column",
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
  },
  hiddenInput: {
    display: "none",
  },
  appHeader: {
    fontSize: 32,
    fontWeight: 700,
    color: "#111827",
    margin: "0 0 16px",
  },
  uploadButton: {
    backgroundColor: "#111827",
    border: 0,
    borderRadius: 8,
    color: "#ffffff",
    cursor: "pointer",
    fontSize: 16,
    fontWeight: 600,
    padding: "14px 20px",
  },
  errorText: {
    color: "#b91c1c",
    fontSize: 14,
    marginTop: 14,
    maxWidth: 300,
    textAlign: "center",
  },
  container: {
    maxWidth: 520,
    margin: "0 auto",
    padding: 16,
  },
  topBar: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 16,
  },
  textButton: {
    background: "transparent",
    border: "1px solid #d1d5db",
    borderRadius: 8,
    color: "#111827",
    cursor: "pointer",
    fontSize: 14,
    fontWeight: 600,
    padding: "9px 12px",
  },
  summaryCard: {
    backgroundColor: "#ffffff",
    border: "2px solid #4b5563",
    borderRadius: 8,
    marginBottom: 16,
    padding: 20,
  },
  headerLabel: {
    color: "#6b7280",
    fontSize: 18,
    margin: "0 0 8px",
  },
  driverName: {
    color: "#111827",
    fontSize: 36,
    fontWeight: 700,
    lineHeight: 1.1,
    margin: 0,
  },
  routeLabel: {
    color: "#374151",
    fontSize: 18,
    margin: "4px 0 18px",
  },
  progressHeader: {
    color: "#111827",
    display: "flex",
    fontSize: 15,
    justifyContent: "space-between",
    marginBottom: 8,
  },
  progressTrack: {
    backgroundColor: "#e5e7eb",
    borderRadius: 999,
    height: 12,
    marginBottom: 18,
    overflow: "hidden",
  },
  progressFill: {
    backgroundColor: "#22c55e",
    height: 12,
  },
  statsRow: {
    backgroundColor: "#f3f4f6",
    borderRadius: 8,
    display: "flex",
    justifyContent: "space-between",
    padding: "18px 0",
  },
  statBlock: {
    alignItems: "center",
    display: "flex",
    flex: 1,
    flexDirection: "column",
  },
  statNumber: {
    color: "#111827",
    fontSize: 28,
    fontWeight: 700,
  },
  statLabel: {
    color: "#4b5563",
    fontSize: 14,
    marginTop: 4,
  },
  card: {
    backgroundColor: "#f3f4f6",
    borderRadius: 8,
    marginBottom: 14,
    padding: 18,
  },
  completedCard: {
    backgroundColor: "#e5e7eb",
  },
  failedCard: {
    backgroundColor: "#fee2e2",
  },
  cardButton: {
    alignItems: "flex-start",
    background: "transparent",
    border: 0,
    cursor: "pointer",
    display: "flex",
    gap: 12,
    padding: 0,
    textAlign: "left",
    width: "100%",
  },
  statusCircle: {
    backgroundColor: "#ffffff",
    border: "2px solid #d1d5db",
    borderRadius: 11,
    flex: "0 0 22px",
    height: 22,
    marginTop: 4,
    width: 22,
  },
  completedCircle: {
    backgroundColor: "#22c55e",
    borderColor: "#22c55e",
  },
  failedCircle: {
    backgroundColor: "#ef4444",
    borderColor: "#ef4444",
  },
  textBlock: {
    display: "flex",
    flex: 1,
    flexDirection: "column",
    minWidth: 0,
  },
  stopText: {
    color: "#111827",
    fontSize: 24,
    fontWeight: 700,
    marginBottom: 2,
  },
  nameText: {
    color: "#6b7280",
    fontSize: 16,
    marginBottom: 2,
  },
  phoneText: {
    color: "#6b7280",
    fontSize: 15,
    marginBottom: 4,
  },
  addressText: {
    color: "#374151",
    fontSize: 16,
    overflowWrap: "anywhere",
  },
  expandedSection: {
    borderTop: "1px solid #e5e7eb",
    marginTop: 16,
    paddingTop: 14,
  },
  metaText: {
    color: "#111827",
    fontSize: 16,
    margin: "0 0 12px",
  },
  noteInput: {
    backgroundColor: "#ffffff",
    border: "1px solid #d1d5db",
    borderRadius: 8,
    boxSizing: "border-box",
    color: "#111827",
    font: "inherit",
    marginBottom: 12,
    minHeight: 72,
    padding: 12,
    resize: "vertical",
    width: "100%",
  },
  statusText: {
    color: "#374151",
    fontSize: 14,
    margin: "0 0 12px",
  },
  buttonRow: {
    display: "grid",
    gap: 8,
    gridTemplateColumns: "repeat(3, minmax(0, 1fr))",
  },
  actionButton: {
    backgroundColor: "#ffffff",
    border: "1px solid #e5e7eb",
    borderRadius: 8,
    color: "#111827",
    cursor: "pointer",
    fontWeight: 600,
    minHeight: 44,
    padding: "12px 8px",
  },
  historySection: {
    marginTop: 8,
  },
  historyTitle: {
    color: "#111827",
    fontSize: 20,
    fontWeight: 700,
    margin: "0 0 10px",
  },
  dialogBackdrop: {
    alignItems: "center",
    backgroundColor: "rgba(17, 24, 39, 0.42)",
    bottom: 0,
    display: "flex",
    justifyContent: "center",
    left: 0,
    padding: 18,
    position: "fixed",
    right: 0,
    top: 0,
    zIndex: 20,
  },
  dialog: {
    backgroundColor: "#ffffff",
    borderRadius: 10,
    boxShadow: "0 24px 60px rgba(17, 24, 39, 0.24)",
    maxWidth: 420,
    padding: 18,
    width: "100%",
  },
  dialogTitle: {
    color: "#111827",
    fontSize: 22,
    fontWeight: 700,
    margin: "0 0 8px",
  },
  dialogText: {
    color: "#4b5563",
    fontSize: 15,
    margin: "0 0 14px",
  },
  dialogActions: {
    display: "grid",
    gap: 10,
    gridTemplateColumns: "1fr 1fr",
  },
  secondaryButton: {
    backgroundColor: "#ffffff",
    border: "1px solid #d1d5db",
    borderRadius: 8,
    color: "#111827",
    cursor: "pointer",
    fontWeight: 600,
    minHeight: 44,
  },
  primaryButton: {
    backgroundColor: "#111827",
    border: "1px solid #111827",
    borderRadius: 8,
    color: "#ffffff",
    cursor: "pointer",
    fontWeight: 700,
    minHeight: 44,
  },
};
