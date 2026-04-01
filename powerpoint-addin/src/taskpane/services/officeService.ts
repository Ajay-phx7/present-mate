/**
 * officeService.ts
 * Wraps all Office.js PowerPoint APIs.
 * Called from hooks — never import Office APIs directly in React components.
 */

export interface SlideContent {
  slide_number: number;
  text: string;
}

/**
 * Extract text from every slide in the active presentation using Office.js.
 * Returns an array ordered by slide index.
 */
export async function extractPresentationContent(): Promise<SlideContent[]> {
  return new Promise((resolve, reject) => {
    try {
      // Use the PowerPoint 1.1 API (ActiveView requirement)
      PowerPoint.run(async (context) => {
        const slides = context.presentation.slides;
        slides.load("items");
        await context.sync();

        const results: SlideContent[] = [];

        for (let i = 0; i < slides.items.length; i++) {
          const slide = slides.items[i];
          const shapes = slide.shapes;
          shapes.load("items");
          await context.sync();

          let textParts: string[] = [];

          for (const shape of shapes.items) {
            try {
              // textFrame may not exist on all shapes
              const tf = shape.textFrame;
              tf.load("textRange");
              await context.sync();
              tf.textRange.load("text");
              await context.sync();
              const t = tf.textRange.text?.trim();
              if (t) textParts.push(t);
            } catch {
              // Shape has no text — skip silently
            }
          }

          results.push({
            slide_number: i + 1,
            text: textParts.join("\n") || "(No text found on this slide)",
          });
        }

        resolve(results);
      }).catch(reject);
    } catch (err) {
      reject(err);
    }
  });
}

/**
 * Get the currently active slide index (1-based).
 * Uses the ActiveView API to read the current position.
 */
export function getCurrentSlideIndex(): Promise<number> {
  return new Promise((resolve, reject) => {
    try {
      Office.context.document.getActiveViewAsync((_result) => {
        // Fall back to selection-based approach for slide index
        Office.context.document.getSelectedDataAsync(
          Office.CoercionType.SlideRange,
          (slResult) => {
            if (slResult.status === Office.AsyncResultStatus.Succeeded) {
              const slides = (slResult.value as any)?.slides;
              if (slides && slides.length > 0) {
                resolve(slides[0].index); // 1-based
              } else {
                resolve(1);
              }
            } else {
              resolve(1);
            }
          }
        );
      });
    } catch (err) {
      reject(err);
    }
  });
}

/**
 * Register a callback that fires whenever the active slide changes.
 * Falls back gracefully — returns a cleanup function.
 * @param callback - Called with the new 1-based slide index
 */
export function onSlideChanged(
  callback: (slideIndex: number) => void
): () => void {
  let pollingTimer: ReturnType<typeof setInterval> | null = null;
  let lastSlide = -1;

  // Attempt to use the DocumentSelectionChanged event (available in PowerPoint Online + newer Desktop)
  try {
    Office.context.document.addHandlerAsync(
      Office.EventType.DocumentSelectionChanged,
      async () => {
        try {
          const idx = await getCurrentSlideIndex();
          if (idx !== lastSlide) {
            lastSlide = idx;
            callback(idx);
          }
        } catch {
          /* ignore */
        }
      },
      (result) => {
        if (result.status === Office.AsyncResultStatus.Failed) {
          // Event not supported — start polling fallback
          startPolling();
        }
      }
    );
  } catch {
    startPolling();
  }

  function startPolling() {
    pollingTimer = setInterval(async () => {
      try {
        const idx = await getCurrentSlideIndex();
        if (idx !== lastSlide) {
          lastSlide = idx;
          callback(idx);
        }
      } catch {
        /* ignore */
      }
    }, 1500);
  }

  // Return cleanup
  return () => {
    if (pollingTimer !== null) clearInterval(pollingTimer);
    try {
      Office.context.document.removeHandlerAsync(
        Office.EventType.DocumentSelectionChanged,
        () => {}
      );
    } catch {
      /* ignore */
    }
  };
}

/**
 * Returns true when Office.js has been fully loaded and initialized.
 */
export function isOfficeReady(): boolean {
  return typeof Office !== "undefined" && !!Office.context;
}
