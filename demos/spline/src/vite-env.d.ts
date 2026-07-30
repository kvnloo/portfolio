/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_SPLINE_SCENE?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
