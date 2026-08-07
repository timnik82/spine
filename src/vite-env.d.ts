/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_POSTHOG_PROJECT_TOKEN?: string
  readonly VITE_POSTHOG_HOST?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}

declare module '*.svg?raw' {
  const content: string;
  export default content;
}
