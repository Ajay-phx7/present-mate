/**
 * index.tsx
 * Task pane entry point. Waits for Office.onReady before mounting React.
 */
import React from "react";
import { createRoot } from "react-dom/client";
import { App } from "./App";
import "./styles.css";

/* Office.onReady ensures Office.js is fully initialized before we render */
Office.onReady(() => {
  const container = document.getElementById("root");
  if (!container) return;
  const root = createRoot(container);
  root.render(
    <React.StrictMode>
      <App />
    </React.StrictMode>
  );
});
