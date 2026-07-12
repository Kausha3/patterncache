import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { HashRouter } from "react-router-dom";
import { App } from "./App";
import { ProgressProvider } from "./hooks/useProgress";
import "./theme/global.css";

// HashRouter keeps this a zero-config static site — no server rewrites needed
// for deep links, consistent with the "static hosting, no infra" goal (§8).
createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <HashRouter>
      <ProgressProvider>
        <App />
      </ProgressProvider>
    </HashRouter>
  </StrictMode>,
);
