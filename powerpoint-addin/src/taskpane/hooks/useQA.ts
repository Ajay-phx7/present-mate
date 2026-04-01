/**
 * useQA.ts
 * Polls the backend for the latest question + answer hint from the Chrome extension.
 * Polling interval: 2 seconds while session is active.
 */
import { useState, useEffect, useRef } from "react";
import { getLatestResponse, LatestResponse } from "../services/apiService";

export interface UseQA {
  qa: LatestResponse | null;
  isLoading: boolean;
  error: string | null;
}

const POLL_INTERVAL_MS = 2000;

export function useQA(sessionId: string | null): UseQA {
  const [qa, setQa] = useState<LatestResponse | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (!sessionId) {
      setQa(null);
      if (intervalRef.current) clearInterval(intervalRef.current);
      return;
    }

    // Immediate first poll
    const poll = async () => {
      try {
        setIsLoading(true);
        const data = await getLatestResponse(sessionId);
        setQa(data);
        setError(null);
      } catch (err: any) {
        setError(err?.message ?? "Failed to fetch Q&A");
      } finally {
        setIsLoading(false);
      }
    };

    poll();
    intervalRef.current = setInterval(poll, POLL_INTERVAL_MS);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [sessionId]);

  return { qa, isLoading, error };
}
