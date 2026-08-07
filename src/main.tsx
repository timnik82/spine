// Sentry must initialise before the rest of the app loads.
import "./instrument"

import { StrictMode } from "react"
import { createRoot } from "react-dom/client"
import * as Sentry from "@sentry/react"

import "./index.css"
import App from "./App.tsx"
import { AppErrorFallback } from "./components/AppErrorFallback.tsx"

createRoot(document.getElementById("root")!, {
  // React 19 root error hooks — global safety net for reporting
  // (https://docs.sentry.io/platforms/javascript/guides/react/).
  onUncaughtError: Sentry.reactErrorHandler(),
  onCaughtError: Sentry.reactErrorHandler(),
  onRecoverableError: Sentry.reactErrorHandler(),
}).render(
  <StrictMode>
    <Sentry.ErrorBoundary
      fallback={({ resetError }) => (
        <AppErrorFallback resetError={resetError} />
      )}
    >
      <App />
    </Sentry.ErrorBoundary>
  </StrictMode>
)
