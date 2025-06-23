/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_PJT: string
  readonly VITE_SSH_PORT: number
  readonly VITE_HLW_URL: string
  readonly VITE_GAW_URL: string
  readonly VITE_GZW_URL: string
}

declare module 'codemirror-editor-vue3'
