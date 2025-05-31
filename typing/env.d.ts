/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly MAIN_VITE_SOME_KEY: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
