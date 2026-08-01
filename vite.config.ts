import tailwindcss from "@tailwindcss/vite"
import react from "@vitejs/plugin-react"
import { fileURLToPath } from "node:url"
import { defineConfig } from "vite"

// https://vite.dev/config/
export default defineConfig({
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

self.addEventListener('message', (event) => {
  if (event.data?.type === 'SKIP_WAITING') {
    void self.skipWaiting();
  }
});
`,
        });
      },
    },
  ],
  resolve: {
    alias: {
      // fileURLToPath yields a platform-correct filesystem path. Using
      // URL.pathname directly produces "/C:/.../src" on Windows, which is
      // non-canonical even though Vite happens to tolerate it.
      "@": fileURLToPath(new URL("./src", import.meta.url)),
    },
  },
})
