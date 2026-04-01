/**
 * Controls.tsx
 * Top control bar: Sync Slides button, Start/End Session button, status pill.
 */
import React, { useState } from "react";
import { extractPresentationContent } from "../services/officeService";
import { syncSlides, getPresentationStatus } from "../services/apiService";
import { SessionStatus } from "../hooks/useSession";

interface Props {
  sessionStatus: SessionStatus;
  sessionId: string | null;
  userId: string;
  onSessionStart: (presentationId: string) => void;
  onSessionStop: () => void;
}

type SyncState = "idle" | "extracting" | "uploading" | "processing" | "ready" | "error";

export const Controls: React.FC<Props> = ({
  sessionStatus,
  sessionId,
  userId,
  onSessionStart,
  onSessionStop,
}) => {
  const [syncState, setSyncState] = useState<SyncState>("idle");
  const [syncMessage, setSyncMessage] = useState<string>("");
  const [latestPresentationId, setLatestPresentationId] = useState<string | null>(null);

  /** Full sync-and-process flow */
  const handleSyncSlides = async () => {
    setSyncState("extracting");
    setSyncMessage("Reading slide content from PowerPoint…");

    try {
      // 1. Extract content via Office.js
      const slides = await extractPresentationContent();
      if (slides.length === 0) {
        setSyncState("error");
        setSyncMessage("No slides found in the presentation.");
        return;
      }

      setSyncState("uploading");
      setSyncMessage(`Uploading ${slides.length} slides to AI backend…`);

      // 2. Send to backend
      const { presentation_id } = await syncSlides(
        userId,
        `Presentation (${new Date().toLocaleString()})`,
        slides
      );
      setLatestPresentationId(presentation_id);

      // 3. Poll until ready
      setSyncState("processing");
      setSyncMessage("AI is generating summaries…");
      await pollUntilReady(presentation_id);

      setSyncState("ready");
      setSyncMessage(`✓ ${slides.length} slides synced and ready.`);
    } catch (err: any) {
      setSyncState("error");
      setSyncMessage(err?.message ?? "Sync failed. Check backend connection.");
    }
  };

  const pollUntilReady = async (presentationId: string, attempts = 0): Promise<void> => {
    if (attempts > 60) throw new Error("Processing timeout — try again.");
    const status = await getPresentationStatus(presentationId);
    if (status.processing_status === "ready") return;
    await new Promise((r) => setTimeout(r, 2000));
    return pollUntilReady(presentationId, attempts + 1);
  };

  const handleSessionToggle = () => {
    if (sessionStatus === "active") {
      onSessionStop();
    } else {
      if (!latestPresentationId) {
        setSyncState("error");
        setSyncMessage("Sync slides first before starting a session.");
        return;
      }
      onSessionStart(latestPresentationId);
    }
  };

  const syncBtnDisabled = syncState === "extracting" || syncState === "uploading" || syncState === "processing";
  const sessionBtnDisabled = sessionStatus === "starting";

  return (
    <div className="controls-bar">
      {/* Sync button */}
      <button
        className="btn btn-secondary"
        onClick={handleSyncSlides}
        disabled={syncBtnDisabled}
      >
        {syncBtnDisabled ? (
          <span className="spinner" />
        ) : (
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="23 4 23 10 17 10" />
            <polyline points="1 20 1 14 7 14" />
            <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15" />
          </svg>
        )}
        Sync Slides
      </button>

      {/* Session toggle */}
      <button
        className={`btn ${sessionStatus === "active" ? "btn-danger" : "btn-primary"}`}
        onClick={handleSessionToggle}
        disabled={sessionBtnDisabled}
      >
        {sessionStatus === "starting" ? (
          <span className="spinner" />
        ) : sessionStatus === "active" ? (
          "End Session"
        ) : (
          "Start Session"
        )}
      </button>

      {/* Status message */}
      {syncMessage && (
        <p
          className={`sync-message ${syncState === "error" ? "error-text" : syncState === "ready" ? "success-text" : "muted-text"}`}
        >
          {syncMessage}
        </p>
      )}
    </div>
  );
};
