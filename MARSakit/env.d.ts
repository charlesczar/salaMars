/// <reference types="vite/client" />

// Type declarations for Vue SFCs
declare module '*.vue' {
  import { DefineComponent } from 'vue'
  const component: DefineComponent<{}, {}, any>
  export default component
}

// Allow importing JSON into the Vue/TS app (Vite supports this at runtime)
declare module '*.json' {
  const value: unknown
  export default value
}

// OCR/Search globals loaded from /public/libs
declare global {
  interface Window {
    Tesseract?: {
      createWorker: (opts?: unknown) => Promise<{
        loadLanguage: (lang: string) => Promise<void>
        initialize: (lang: string) => Promise<void>
        recognize: (input: File | Blob | ArrayBuffer | string) => Promise<{
          data: { text: string; confidence: number }
        }>
        terminate: () => Promise<void>
      }>
    }
    Fuse?: new <T>(
      docs: T[],
      options: unknown,
    ) => {
      search: (pattern: string) => Array<{ item: T; score: number }>
    }
  }
}

export {}
