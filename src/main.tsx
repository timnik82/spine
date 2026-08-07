import { StrictMode } from "react"
import { createRoot } from "react-dom/client"
import { PostHogProvider } from "@posthog/react"

import "./index.css"
import App from "./App.tsx"

const posthogKey = import.meta.env.VITE_POSTHOG_PROJECT_TOKEN
const posthogHost = import.meta.env.VITE_POSTHOG_HOST

const app = <App />

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    {posthogKey ? (
      <PostHogProvider
        apiKey={posthogKey}
        options={{
          api_host: posthogHost,
          defaults: "2026-05-30",
        }}
      >
        {app}
      </PostHogProvider>
    ) : (
      app
    )}
  </StrictMode>
)
