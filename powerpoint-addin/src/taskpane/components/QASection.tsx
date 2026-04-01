/**
 * QASection.tsx
 * Displays the latest audience question captured by the Chrome extension
 * and the AI-generated answer hint.
 */
import React from "react";
import { LatestResponse } from "../services/apiService";

interface Props {
  qa: LatestResponse | null;
  isLoading: boolean;
}

export const QASection: React.FC<Props> = ({ qa, isLoading }) => {
  const hasData = qa && qa.question;

  return (
    <div className="section qa-section">
      <div className="qa-header">
        <p className="section-label" style={{ margin: 0 }}>Live Q&amp;A</p>
        {isLoading && <span className="loading-dot" title="Polling…" />}
      </div>

      {!hasData ? (
        <p className="muted-text">
          No audience question detected yet.{" "}
          <span style={{ color: "var(--teal)" }}>
            Use the Chrome extension to capture speech.
          </span>
        </p>
      ) : (
        <div>
          {/* Question */}
          <div className="qa-question-box">
            <span className="qa-q-label">Q</span>
            <p className="qa-question-text">{qa!.question}</p>
          </div>

          {/* Answer hint */}
          {qa!.hint && (
            <div style={{ marginTop: 10 }}>
              <p className="section-label">Answer Hint</p>
              <p className="summary-text" style={{ color: "var(--text-primary)" }}>
                {qa!.hint.answer_hint}
              </p>

              {/* Talking points */}
              {qa!.hint.talking_points && qa!.hint.talking_points.length > 0 && (
                <div style={{ marginTop: 8 }}>
                  <p className="section-label">Talking Points</p>
                  <ul className="key-points-list">
                    {qa!.hint.talking_points.map((tp, i) => (
                      <li key={i}>{tp}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
