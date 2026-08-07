// Sentry must initialise before the rest of the app loads.
import "./instrument"

import { StrictMode } from "react"
import { createRoot } from "react-dom/client"
import * as Sentry from "@sentry/react"

import "./index.css"
import App from "./App.tsx"
import { AppErrorFallback } from "./components/AppErrorFallback.tsx"

createRoot(document.getElementById("root")!, {
  // React 19 root hooks report errors the ErrorBoundary does not catch.
  // Skip onCaughtError: Sentry.ErrorBoundary already captures those, and
  // wiring both produces duplicate Issues
  // (https://docs.sentry.io/platforms/javascript/guides/react/features/error-boundary/).
  onUncaughtError: Sentry.reactErrorHandler(),
  onRecoverableError: Sentry.reactErrorHandler(),
}).render(
  <StrictMode>
    <Sentry.ErrorBoundary fallback={<AppErrorFallback />}>
      <App />
    </Sentry.ErrorBoundary>
  </StrictMode>
)
