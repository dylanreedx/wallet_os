/// <reference types="vite/client" />

// Extend Vite's default env typing instead of replacing it
interface ImportMetaEnv {
  readonly VITE_API_URL?: string;
  readonly DEV: boolean;
  readonly PROD: boolean;
  readonly MODE: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}











