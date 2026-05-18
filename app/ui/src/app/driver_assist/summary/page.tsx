"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";

import { downloadRouteSummary } from "@/lib/driver-route/exportSummary";
import type { DriverRoute } from "@/lib/driver-route/types";

import DriverFooter from "../components/DriverFooter";
import { WarningIcon } from "../components/icons";
import { readSavedRoute } from "../storage";
import SummaryStatBlock from "./components/SummaryStatBlock";
import SummaryStopCard from "./components/SummaryStopCard";
import { summaryStyles as styles } from "./styles";

export default function DriverAssistSummaryPage() {
  const router = useRouter();
  const [route, setRoute] = useState<DriverRoute | null>(null);
  const [hasCheckedRoute, setHasCheckedRoute] = useState(false);
  const [exportMessage, setExportMessage] = useState<string | null>(null);

  useEffect(() => {
    // Let the active route page finish its final localStorage write before the
    // summary reads it back after the Finish tap.
    const timeoutId = window.setTimeout(() => {
      const savedRoute = readSavedRoute();
      setRoute(savedRoute);
      setHasCheckedRoute(true);

      if (!savedRoute) {
        router.replace("/upload-route");
      }
    }, 0);

    return () => window.clearTimeout(timeoutId);
  }, [router]);

  const totals = useMemo(() => {
    // Failed stops count as remaining because they still need office review.
    const stops = route?.stops || [];
    return {
      total: stops.length,
      complete: stops.filter((stop) => stop.status === "completed").length,
      remaining: stops.filter((stop) => stop.status !== "completed").length,
    };
  }, [route]);

  const handleExport = () => {
    if (!route) return;

    // Reuse the session export downloader so route summaries behave like the
    // rest of the app's JSON save/export buttons.
    const result = downloadRouteSummary(route);
    setExportMessage(
      result.ok
        ? `Downloaded ${result.filename}`
        : "Failed to export route summary.",
    );
  };

  if (!hasCheckedRoute || !route) {
    // Keep the transition from the driver screen visually quiet.
    return <main style={styles.loadingScreen} aria-label="Loading summary" />;
  }

  return (
    <main style={styles.safeArea}>
      <section style={styles.container}>
        <div style={styles.topBar}>
          <h1 style={styles.appHeader}>Driver Assist</h1>
          <button
            type="button"
            style={styles.warningButton}
            aria-label="View remaining deliveries"
          >
            <WarningIcon />
          </button>
        </div>

        <section style={styles.summarySection}>
          <h2 style={styles.sectionTitle}>Summary</h2>
          <div style={styles.statsRow}>
            <SummaryStatBlock value={totals.total} label="Total" />
            <SummaryStatBlock value={totals.complete} label="Complete" />
            <SummaryStatBlock value={totals.remaining} label="Remaining" />
          </div>
        </section>

        <section style={styles.stopList} aria-label="Route stops">
          {route.stops.map((stop) => (
            <SummaryStopCard key={stop.id} stop={stop} />
          ))}
        </section>

        {/* Same footer as the edit flow so the PWA keeps the b2 baseline. */}
        <DriverFooter />
      </section>

      {/* Sticky mobile export action, matching the driver's Finish button. */}
      <div style={styles.exportBar}>
        {exportMessage ? (
          <p style={styles.exportMessage}>{exportMessage}</p>
        ) : null}
        <button
          type="button"
          style={styles.exportButton}
          onClick={handleExport}
        >
          Export route summary
        </button>
      </div>
    </main>
  );
}
