// vite.config.js
import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import fs from 'fs'
import path from 'path'

function swConfigPlugin() {
  return {
    name: 'sw-config',
    buildStart() {
      const env = loadEnv('', process.cwd(), 'VITE_FIREBASE')

      // ── 1. Keep sw-config.json for any legacy consumers ──────────────
      fs.writeFileSync(
        path.resolve(__dirname, 'public/sw-config.json'),
        JSON.stringify({
          VITE_FIREBASE_API_KEY:            env.VITE_FIREBASE_API_KEY,
          VITE_FIREBASE_AUTH_DOMAIN:        env.VITE_FIREBASE_AUTH_DOMAIN,
          VITE_FIREBASE_PROJECT_ID:         env.VITE_FIREBASE_PROJECT_ID,
          VITE_FIREBASE_MESSAGING_SENDER_ID: env.VITE_FIREBASE_MESSAGING_SENDER_ID,
          VITE_FIREBASE_APP_ID:             env.VITE_FIREBASE_APP_ID,
        }, null, 2)
      )

      // ── 2. Generate the SW file with config values stamped inline ─────
      const sw = `
importScripts('https://www.gstatic.com/firebasejs/10.12.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.12.0/firebase-messaging-compat.js');

// Config stamped at build time by vite.config.js — no runtime fetch needed
firebase.initializeApp({
  apiKey:            "${env.VITE_FIREBASE_API_KEY}",
  authDomain:        "${env.VITE_FIREBASE_AUTH_DOMAIN}",
  projectId:         "${env.VITE_FIREBASE_PROJECT_ID}",
  messagingSenderId: "${env.VITE_FIREBASE_MESSAGING_SENDER_ID}",
  appId:             "${env.VITE_FIREBASE_APP_ID}",
});

const messaging = firebase.messaging();

messaging.onBackgroundMessage((payload) => {
  const title = payload?.notification?.title || 'Notification';
  const body  = payload?.notification?.body  || '';
  self.registration.showNotification(title, { body });
});
`.trimStart()

      fs.writeFileSync(
        path.resolve(__dirname, 'public/firebase-messaging-sw.js'),
        sw
      )

      console.log('✅ firebase-messaging-sw.js generated with inlined config')
      console.log('✅ sw-config.json generated')
    },
  }
}

export default defineConfig({
  plugins: [react(), swConfigPlugin()],
})