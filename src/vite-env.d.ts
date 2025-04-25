/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_PJT: string
  readonly VITE_BASE_HOST: string
  readonly VITE_PJT_PORT: number
  readonly VITE_SSH_PORT: number
}

declare module 'codemirror-editor-vue3'
