/**
 * SlideInfo.tsx
 * Displays: current slide number badge, AI summary, key points.
 */
import React from "react";
import { SlideData } from "../services/apiService";

interface Props {
  data: SlideData | null;
  isLoading: boolean;
  error: string | null;
}

export const SlideInfo: React.FC<Props> = ({ data, isLoading, error }) => {
  if (isLoading && !data) {
    return (
      <div className="section">
        <div className="skeleton" style={{ height: 16, width: "60%", marginBottom: 10 }} />
        <div className="skeleton" style={{ height: 12, width: "100%", marginBottom: 6 }} />
        <div className="skeleton" style={{ height: 12, width: "90%" }} />
      </div>
    );
  }

  if (error) {
    return (
      <div className="section">
        <p className="error-text">⚠️ {error}</p>
      </div>
    );
  }

  if (!data || data.message) {
    return (
      <div className="section">
        <p className="muted-text">
          {data?.message ?? "No slide data yet. Sync slides and start a session."}
        </p>
      </div>
    );
  }

  return (
    <div className="section">
      {/* Slide badge */}
      <div className="slide-badge">
        <span className="badge-dot" />
        <span>
          Slide {data.slide_number}
          {data.total_slides ? ` of ${data.total_slides}` : ""}
        </span>
        {isLoading && <span className="loading-dot" title="Syncing…" />}
      </div>

      {/* Summary */}
      <p className="summary-text">{data.summary}</p>

      {/* Key Points */}
      {data.key_points && data.key_points.length > 0 && (
        <div>
          <p className="section-label">Key Points</p>
          <ul className="key-points-list">
            {data.key_points.map((pt, i) => (
              <li key={i}>{pt}</li>
            ))}
          </ul>
        </div>
      )}

      {/* Likely Questions */}
      {data.likely_questions && data.likely_questions.length > 0 && (
        <div style={{ marginTop: 12 }}>
          <p className="section-label">Likely Questions</p>
          <ul className="key-points-list secondary">
            {data.likely_questions.map((q, i) => (
              <li key={i}>{q}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};
