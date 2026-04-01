/**
 * useSession.ts
 * Manages session state: session ID, presentation ID, start/stop flow.
 * State persisted to localStorage so the add-in remembers the session on reload.
 */
import { useState, useEffect, useCallback } from "react";
import { startSession, endSession } from "../services/apiService";

const LS_SESSION_ID = "pm_addin_session_id";
const LS_PRES_ID = "pm_addin_presentation_id";
const LS_USER_ID = "pm_addin_user_id";
const DEFAULT_USER_ID = "addin_user"; // Simple default; replace with real auth later

export type SessionStatus = "idle" | "starting" | "active" | "error";

export interface UseSessionReturn {
  sessionId: string | null;
  presentationId: string | null;
  userId: string;
  status: SessionStatus;
  errorMessage: string | null;
  isActive: boolean;
  start: (presentationId: string) => Promise<void>;
  stop: () => Promise<void>;
  setPresentationId: (id: string) => void;
}

export function useSession(): UseSessionReturn {
  const [sessionId, setSessionId] = useState<string | null>(
    () => localStorage.getItem(LS_SESSION_ID)
  );
  const [presentationId, setPresentationIdState] = useState<string | null>(
    () => localStorage.getItem(LS_PRES_ID)
  );
  const [userId] = useState<string>(
    () => localStorage.getItem(LS_USER_ID) ?? DEFAULT_USER_ID
  );
  const [status, setStatus] = useState<SessionStatus>(
    () => (localStorage.getItem(LS_SESSION_ID) ? "active" : "idle")
  );
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Keep localStorage in sync
  useEffect(() => {
    if (sessionId) localStorage.setItem(LS_SESSION_ID, sessionId);
    else localStorage.removeItem(LS_SESSION_ID);
  }, [sessionId]);

  useEffect(() => {
    if (presentationId) localStorage.setItem(LS_PRES_ID, presentationId);
    else localStorage.removeItem(LS_PRES_ID);
  }, [presentationId]);

  const setPresentationId = useCallback((id: string) => {
    setPresentationIdState(id);
  }, []);

  const start = useCallback(
    async (presId: string) => {
      setStatus("starting");
      setErrorMessage(null);
      try {
        const { session_id } = await startSession(userId, presId);
        setSessionId(session_id);
        setPresentationIdState(presId);
        setStatus("active");
      } catch (err: any) {
        setStatus("error");
        setErrorMessage(err?.message ?? "Failed to start session");
      }
    },
    [userId]
  );

  const stop = useCallback(async () => {
    if (sessionId) {
      try {
        await endSession(sessionId);
      } catch {
        /* best-effort */
      }
    }
    setSessionId(null);
    setPresentationIdState(null);
    setStatus("idle");
    setErrorMessage(null);
    localStorage.removeItem(LS_SESSION_ID);
    localStorage.removeItem(LS_PRES_ID);
  }, [sessionId]);

  return {
    sessionId,
    presentationId,
    userId,
    status,
    errorMessage,
    isActive: status === "active",
    start,
    stop,
    setPresentationId,
  };
}
