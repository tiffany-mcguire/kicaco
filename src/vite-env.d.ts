/// <reference types="vite/client" />
/// <reference types="vite-plugin-pwa/client" />

interface ImportMetaEnv {
  readonly VITE_OPENAI_API_KEY: string
  readonly VITE_ASSISTANT_ID: string
  readonly VITE_OPENAI_PROJECT_ID: string
  readonly VITE_API_URL?: string
  readonly VITE_USE_BACKEND_PROXY?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
} 