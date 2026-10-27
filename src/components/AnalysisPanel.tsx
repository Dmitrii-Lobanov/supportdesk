import { useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { ConvexError } from "convex/values";
import { api } from "../../convex/_generated/api";
import type { Id } from "../../convex/_generated/dataModel";
import "./AnalysisPanel.css";

type AnalysisPanelProps = {
  ticketId: Id<"tickets">;
};

const statusLabels = {
  queued: "Queued",
  running: "Analyzing…",
  succeeded: "Completed",
  failed: "Failed",
  cancelled: "Cancelled",
};

export default function AnalysisPanel({ ticketId }: AnalysisPanelProps) {
  const job = useQuery(api.jobs.latest, { ticketId });
  const startJob = useMutation(api.jobs.start);

  const cancelJob = useMutation(api.jobs.cancel);

  const [isStarting, setIsStarting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isCancelling, setIsCancelling] = useState(false);

  const isActive = job?.status === "queued" || job?.status === "running";

  async function handleStart() {
    if (isStarting || isActive) return;

    setIsStarting(true);
    setError(null);

    try {
      await startJob({ ticketId });
    } catch (error) {
      setError(
        error instanceof ConvexError
          ? String(error.data)
          : "Could not start analysis. Please try again.",
      );
    } finally {
      setIsStarting(false);
    }
  }

  async function handleCancel() {
    if (!job || !isActive || isCancelling) return;

    setIsCancelling(true);
    setError(null);

    try {
      await cancelJob({ jobId: job._id });
    } catch (error) {
      setError(
        error instanceof ConvexError
          ? String(error.data)
          : "Could not cancel analysis. Please try again.",
      );
    } finally {
      setIsCancelling(false);
    }
  }

  return (
    <section className="analysis-panel" aria-label="Ticket analysis">
      <h2>Ticket analysis</h2>
      <p className="analysis-note">
        Loads customer context in the background. AI integration comes later.
      </p>

      {job === undefined ? (
        <p role="status">Loading analysis status…</p>
      ) : (
        <>
          <p role="status">
            {job ? statusLabels[job.status] : "No analysis requested yet."}
          </p>

          {job?.status === "succeeded" && (
            <p className="analysis-result">{job.result}</p>
          )}

          {job?.status === "failed" && <p role="alert">{job.error}</p>}

          {error && <p role="alert">{error}</p>}

          <button
            className="analysis-button"
            type="button"
            onClick={() => {
              void handleStart();
            }}
            disabled={isStarting || isCancelling || isActive}
          >
            {isStarting
              ? "Starting…"
              : isActive
                ? "Analysis in progress"
                : job
                  ? "Analyze again"
                  : "Analyze ticket"}
          </button>

          {isActive && (
            <button
              className="analysis-button"
              type="button"
              onClick={() => {
                void handleCancel();
              }}
              disabled={isCancelling}
              style={{
                marginLeft: "8px",
              }}
            >
              {isCancelling ? "Cancelling…" : "Cancel analysis"}
            </button>
          )}
        </>
      )}
    </section>
  );
}
