import tailwindcss from "@tailwindcss/vite"
import react from "@vitejs/plugin-react"
import { fileURLToPath } from "node:url"
import { defineConfig } from "vite"

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      // fileURLToPath yields a platform-correct filesystem path. Using
      // URL.pathname directly produces "/C:/.../src" on Windows, which is
      // non-canonical even though Vite happens to tolerate it.
      "@": fileURLToPath(new URL("./src", import.meta.url)),
    },
  },
})
