import { defineNuxtConfig } from 'nuxt/config'

export default defineNuxtConfig({
  ssr: true,
  modules: ['@pinia/nuxt'],
  css: ['~/assets/styles/tailwind.css'],
  runtimeConfig: {
    jwtAccessSecret: process.env.JWT_ACCESS_SECRET,
    jwtRefreshSecret: process.env.JWT_REFRESH_SECRET,
    storagePath: process.env.STORAGE_PATH || 'storage',
    sqlitePath: process.env.SQLITE_PATH || './db/dochub.sqlite',
    public: {
      uploadMaxSizeMb: Number.parseInt(process.env.UPLOAD_MAX_SIZE_MB || '25', 10)
    }
  },
  nitro: {
    storage: {
      documents: {
        driver: 'fs',
        base: process.env.STORAGE_PATH || 'storage'
      }
    }
  },
  typescript: {
    typeCheck: true
  },
  tailwindcss: {
    exposeConfig: true
  },
  devtools: { enabled: true }
})
