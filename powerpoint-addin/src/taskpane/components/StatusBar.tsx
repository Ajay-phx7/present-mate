/**
 * StatusBar.tsx
 * One-line status bar showing session ID snippet + connection status.
 */
import React from "react";
import { SessionStatus } from "../hooks/useSession";

interface Props {
  sessionId: string | null;
  status: SessionStatus;
  errorMessage: string | null;
}

const STATUS_CONFIG: Record<SessionStatus, { label: string; color: string; dot: string }> = {
  idle:     { label: "No Session",  color: "var(--text-muted)", dot: "#94a3b8" },
  starting: { label: "Starting…",   color: "var(--amber)",      dot: "#f59e0b" },
  active:   { label: "Connected",   color: "var(--teal)",       dot: "#10b981" },
  error:    { label: "Error",       color: "var(--red)",        dot: "#ef4444" },
};

export const StatusBar: React.FC<Props> = ({ sessionId, status, errorMessage }) => {
  const cfg = STATUS_CONFIG[status];

  return (
    <div className="status-bar">
      {/* Status pill */}
      <div className="status-pill" style={{ color: cfg.color }}>
        <span className="status-dot" style={{ background: cfg.dot }} />
        {cfg.label}
      </div>

      {/* Session ID snippet */}
      {sessionId && (
        <span className="session-id-chip" title={`Full session ID: ${sessionId}`}>
          #{sessionId.slice(-6)}
        </span>
      )}

      {/* Error message inline */}
      {errorMessage && status === "error" && (
        <span className="error-text" style={{ fontSize: 10, marginLeft: 6 }}>
          {errorMessage}
        </span>
      )}
    </div>
  );
};
