/// <reference types="vite/client" />

/* ✅ Types pour les .vue si besoin d’édition TS forte */
declare module '*.vue' {
  import type { DefineComponent } from 'vue'
  const component: DefineComponent<{}, {}, any>
  export default component
}

/* ✅ Tape tes variables d'env Vite ici (prefix VITE_) */
interface ImportMetaEnv {
  readonly VITE_API_URL: string
  // ajoute d'autres clés VITE_ si nécessaire
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
