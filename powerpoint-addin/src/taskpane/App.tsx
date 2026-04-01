/**
 * App.tsx
 * Main task pane application. Composes all panels.
 * Waits for Office.onReady before rendering.
 */
import React from "react";
import { useSession } from "./hooks/useSession";
import { useSlideSync } from "./hooks/useSlideSync";
import { useQA } from "./hooks/useQA";
import { Controls } from "./components/Controls";
import { SlideInfo } from "./components/SlideInfo";
import { QASection } from "./components/QASection";
import { StatusBar } from "./components/StatusBar";

export const App: React.FC = () => {
  const session = useSession();
  const { slideData, isLoading: slideLoading, error: slideError } = useSlideSync(
    session.isActive ? session.sessionId : null
  );
  const { qa, isLoading: qaLoading } = useQA(
    session.isActive ? session.sessionId : null
  );

  return (
    <div className="app-container">
      {/* ── Header ─────────────────────────────── */}
      <header className="app-header">
        <div className="header-brand">
          <div className="header-icon">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M2 3h20" />
              <path d="M21 3v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V3" />
              <path d="m7 21 5-5 5 5" />
            </svg>
          </div>
          <span className="header-title">PresentMate</span>
        </div>
        <StatusBar
          sessionId={session.sessionId}
          status={session.status}
          errorMessage={session.errorMessage}
        />
      </header>

      {/* ── Controls ───────────────────────────── */}
      <Controls
        sessionStatus={session.status}
        sessionId={session.sessionId}
        userId={session.userId}
        onSessionStart={session.start}
        onSessionStop={session.stop}
      />

      {/* ── Divider ────────────────────────────── */}
      <div className="divider" />

      {/* ── Scrollable content area ────────────── */}
      <div className="content-scroll">
        {/* Not yet active explanation */}
        {!session.isActive && (
          <div className="idle-banner">
            <p>
              1. Click <strong>Sync Slides</strong> to extract your presentation content.<br />
              2. Click <strong>Start Session</strong> to begin real-time assistance.<br />
              3. Use the <strong>Chrome Extension</strong> to capture audience speech.
            </p>
          </div>
        )}

        {/* Current Slide Section */}
        <div className="section-header">
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="var(--teal)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <rect x="2" y="3" width="20" height="14" rx="2" />
            <path d="M8 21h8M12 17v4" />
          </svg>
          Current Slide
        </div>
        <SlideInfo data={slideData} isLoading={slideLoading} error={slideError} />

        {/* Q&A Section */}
        <div className="section-header" style={{ marginTop: 4 }}>
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="var(--teal)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
          </svg>
          Audience Q&amp;A
        </div>
        <QASection qa={qa} isLoading={qaLoading} />
      </div>
    </div>
  );
};
