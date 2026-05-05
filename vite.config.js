import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import fs from 'fs'
import path from 'path'

function swConfigPlugin() {
  return {
    name: 'sw-config',
    buildStart() {
      const fileEnv = loadEnv('', process.cwd(), 'VITE_FIREBASE')
      const pick = (key) => fileEnv[key] || process.env[key] || ''

      const apiKey            = pick('VITE_FIREBASE_API_KEY')
      const authDomain        = pick('VITE_FIREBASE_AUTH_DOMAIN')
      const projectId         = pick('VITE_FIREBASE_PROJECT_ID')
      const messagingSenderId = pick('VITE_FIREBASE_MESSAGING_SENDER_ID')
      const appId             = pick('VITE_FIREBASE_APP_ID')

      const missing = [
        !apiKey            && 'VITE_FIREBASE_API_KEY',
        !authDomain        && 'VITE_FIREBASE_AUTH_DOMAIN',
        !projectId         && 'VITE_FIREBASE_PROJECT_ID',
        !messagingSenderId && 'VITE_FIREBASE_MESSAGING_SENDER_ID',
        !appId             && 'VITE_FIREBASE_APP_ID',
      ].filter(Boolean)

      if (missing.length > 0) {
        console.warn(`⚠️  sw-config: missing env vars: ${missing.join(', ')}`)
        console.warn('   Push notifications will NOT work until these are set.')
      }

      const sw = `importScripts('https://www.gstatic.com/firebasejs/10.12.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.12.0/firebase-messaging-compat.js');

firebase.initializeApp({
  apiKey:            "${apiKey}",
  authDomain:        "${authDomain}",
  projectId:         "${projectId}",
  messagingSenderId: "${messagingSenderId}",
  appId:             "${appId}",
});

const messaging = firebase.messaging();

messaging.onBackgroundMessage((payload) => {
  const title = payload?.notification?.title || 'Notification';
  const body  = payload?.notification?.body  || '';
  self.registration.showNotification(title, { body });
});
`
      fs.writeFileSync(path.resolve(__dirname, 'public/firebase-messaging-sw.js'), sw)
      console.log('✅ firebase-messaging-sw.js generated with inlined config')
    },
  }
}

export default defineConfig({
  plugins: [react(), swConfigPlugin()],
})