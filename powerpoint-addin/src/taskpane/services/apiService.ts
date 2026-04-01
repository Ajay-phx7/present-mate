/**
 * apiService.ts
 * All REST calls to the PresentMate FastAPI backend.
 */

const API_BASE = "http://localhost:8000";

export interface SlideInput {
  slide_number: number;
  text: string;
}

export interface SlideData {
  slide_number: number;
  total_slides: number;
  summary: string;
  key_points: string[];
  likely_questions?: string[];
  message?: string; // e.g. "No hints available"
}

export interface HintData {
  answer_hint: string;
  talking_points: string[];
}

export interface LatestResponse {
  question: string | null;
  hint: HintData | null;
}

// ─── Presentation Sync ────────────────────────────────────────────────────────

/**
 * POST /presentations/from-addin
 * Sends raw slide content extracted via Office.js to the backend for AI processing.
 * Returns { presentation_id: string }
 */
export async function syncSlides(
  userId: string,
  title: string,
  slides: SlideInput[]
): Promise<{ presentation_id: string }> {
  const res = await fetch(`${API_BASE}/presentations/from-addin`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ user_id: userId, title, slides }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err?.detail ?? `Server error ${res.status}`);
  }
  return res.json();
}

/**
 * GET /presentations/{id}/status
 * Poll processing status until "ready".
 */
export async function getPresentationStatus(
  presentationId: string
): Promise<{ processing_status: string; total_slides: number }> {
  const res = await fetch(`${API_BASE}/presentations/${presentationId}`);
  if (!res.ok) throw new Error(`Server error ${res.status}`);
  return res.json();
}

// ─── Session Management ───────────────────────────────────────────────────────

/**
 * POST /sessions/start
 * Returns { session_id: string }
 */
export async function startSession(
  userId: string,
  presentationId: string
): Promise<{ session_id: string }> {
  const res = await fetch(`${API_BASE}/sessions/start`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ user_id: userId, presentation_id: presentationId }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err?.detail ?? `Server error ${res.status}`);
  }
  return res.json();
}

/**
 * POST /sessions/{id}/end
 */
export async function endSession(sessionId: string): Promise<void> {
  await fetch(`${API_BASE}/sessions/${sessionId}/end`, { method: "POST" });
}

// ─── Slide Hints ──────────────────────────────────────────────────────────────

/**
 * POST /sessions/{id}/slide
 * Tells the backend which slide the user is currently on.
 */
export async function updateCurrentSlide(
  sessionId: string,
  slideNumber: number
): Promise<void> {
  await fetch(
    `${API_BASE}/sessions/${sessionId}/slide?slide_number=${slideNumber}`,
    { method: "POST" }
  );
}

/**
 * GET /sessions/{id}/hints/current-slide
 * Returns AI summary + key points for the current slide.
 */
export async function getSlideHints(sessionId: string): Promise<SlideData> {
  const res = await fetch(
    `${API_BASE}/sessions/${sessionId}/hints/current-slide`
  );
  if (!res.ok) throw new Error(`Server error ${res.status}`);
  return res.json();
}

// ─── Q&A / Latest Response ────────────────────────────────────────────────────

/**
 * GET /sessions/{id}/latest-response
 * Returns the latest recognized question + AI-generated hint from the session.
 */
export async function getLatestResponse(
  sessionId: string
): Promise<LatestResponse> {
  const res = await fetch(`${API_BASE}/sessions/${sessionId}/latest-response`);
  if (!res.ok) throw new Error(`Server error ${res.status}`);
  return res.json();
}
