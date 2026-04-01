/**
 * useSlideSync.ts
 * Registers an Office.js slide-change listener (or polling fallback).
 * Fetches slide hints from backend each time the active slide changes.
 */
import { useState, useEffect, useRef, useCallback } from "react";
import { onSlideChanged, getCurrentSlideIndex } from "../services/officeService";
import { getSlideHints, updateCurrentSlide, SlideData } from "../services/apiService";

export interface UseSlideSync {
  slideData: SlideData | null;
  currentSlide: number;
  isLoading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

export function useSlideSync(sessionId: string | null): UseSlideSync {
  const [slideData, setSlideData] = useState<SlideData | null>(null);
  const [currentSlide, setCurrentSlide] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const sessionIdRef = useRef(sessionId);
  useEffect(() => { sessionIdRef.current = sessionId; }, [sessionId]);

  const fetchHints = useCallback(async (sessionId: string, slideNum?: number) => {
    setIsLoading(true);
    setError(null);
    try {
      // If a specific slide number is provided, notify backend first
      if (slideNum !== undefined) {
        await updateCurrentSlide(sessionId, slideNum).catch(() => {});
      }
      const data = await getSlideHints(sessionId);
      setSlideData(data);
      if (data.slide_number) setCurrentSlide(data.slide_number);
    } catch (err: any) {
      setError(err?.message ?? "Failed to fetch slide hints");
    } finally {
      setIsLoading(false);
    }
  }, []);

  // On mount / session change: do initial fetch and register slide-change listener
  useEffect(() => {
    if (!sessionId) {
      setSlideData(null);
      return;
    }

    // Initial fetch
    getCurrentSlideIndex()
      .then((idx) => fetchHints(sessionId, idx))
      .catch(() => fetchHints(sessionId));

    // Register slide-change listener (event or poll)
    const cleanup = onSlideChanged((idx) => {
      setCurrentSlide(idx);
      if (sessionIdRef.current) {
        fetchHints(sessionIdRef.current, idx);
      }
    });

    return cleanup;
  }, [sessionId, fetchHints]);

  const refetch = useCallback(async () => {
    if (!sessionId) return;
    const idx = await getCurrentSlideIndex().catch(() => currentSlide);
    await fetchHints(sessionId, idx);
  }, [sessionId, currentSlide, fetchHints]);

  return { slideData, currentSlide, isLoading, error, refetch };
}
