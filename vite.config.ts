import { sentryVitePlugin } from "@sentry/vite-plugin"
import tailwindcss from "@tailwindcss/vite"
import react from "@vitejs/plugin-react"
import { fileURLToPath } from "node:url"
import { defineConfig, loadEnv } from "vite"

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  // Vite does not inject non-VITE_ keys into process.env for config files;
  // loadEnv with "" prefix pulls SENTRY_* for the optional source-map upload.
  const env = loadEnv(mode, process.cwd(), "")
  const sentryAuthToken = env.SENTRY_AUTH_TOKEN?.trim()
  const sentryOrg = env.SENTRY_ORG?.trim()
  const sentryProject = env.SENTRY_PROJECT?.trim()
  const uploadSourceMaps = Boolean(
    sentryAuthToken && sentryOrg && sentryProject,
  )

  return {
    build: {
      // Hidden maps keep stack traces readable in Sentry without serving
      // *.map next to the public bundle.
      sourcemap: uploadSourceMaps ? "hidden" : false,
    },
    plugins: [
      react(),
      tailwindcss(),
      {
        name: 'version-service-worker',
        generateBundle() {
          this.emitFile({
            type: 'asset',
            fileName: 'sw.js',
            source: `const BUILD_VERSION = '${Date.now()}';

self.addEventListener('install', () => {
  // Leave updates waiting until the user explicitly chooses “Update now”.
  void BUILD_VERSION;
});

// Take control of the open tab as soon as the new worker activates. Without
// this, Safari does not deliver 'controllerchange' to a page the new worker
// has not claimed, so the 'Update now' reload would stall on the 5s fallback.
self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener('message', (event) => {
  if (event.data?.type === 'SKIP_WAITING') {
    void self.skipWaiting();
  }
});
`,
          });
        },
      },
      // Sentry docs: place the plugin after all other plugins so maps and
      // tree-shaking stay correct.
      ...(uploadSourceMaps
        ? [
            sentryVitePlugin({
              org: sentryOrg,
              project: sentryProject,
              authToken: sentryAuthToken,
              sourcemaps: {
                filesToDeleteAfterUpload: ["./dist/**/*.map"],
              },
            }),
          ]
        : []),
    ],
    resolve: {
      alias: {
        // fileURLToPath yields a platform-correct filesystem path. Using
        // URL.pathname directly produces "/C:/.../src" on Windows, which is
        // non-canonical even though Vite happens to tolerate it.
        "@": fileURLToPath(new URL("./src", import.meta.url)),
      },
    },
  }
})
