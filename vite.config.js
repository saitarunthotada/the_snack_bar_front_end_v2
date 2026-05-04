import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import fs from 'fs'
import path from 'path'

// ─── Plugin: generate public/sw-config.json from .env at build time ──────────
function swConfigPlugin() {
  return {
    name: 'sw-config',
    buildStart() {
      // During dev & build, write sw-config.json into public/
      // so the service worker can fetch it at /sw-config.json
      const env = loadEnv('', process.cwd(), 'VITE_FIREBASE')
      const config = {
        VITE_FIREBASE_API_KEY: env.VITE_FIREBASE_API_KEY,
        VITE_FIREBASE_AUTH_DOMAIN: env.VITE_FIREBASE_AUTH_DOMAIN,
        VITE_FIREBASE_PROJECT_ID: env.VITE_FIREBASE_PROJECT_ID,
        VITE_FIREBASE_MESSAGING_SENDER_ID: env.VITE_FIREBASE_MESSAGING_SENDER_ID,
        VITE_FIREBASE_APP_ID: env.VITE_FIREBASE_APP_ID,
      }
      fs.writeFileSync(
        path.resolve(__dirname, 'public/sw-config.json'),
        JSON.stringify(config, null, 2)
      )
      console.log('✅ sw-config.json generated')
    },
  }
}

export default defineConfig({
  plugins: [react(), swConfigPlugin()],
})