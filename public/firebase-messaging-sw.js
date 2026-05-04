// public/firebase-messaging-sw.js
// ⚠️ Service workers cannot access import.meta.env (no Vite build pipeline here).
// Config is fetched from /sw-config.json which is generated at build time by vite.config.js

importScripts('https://www.gstatic.com/firebasejs/10.12.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.12.0/firebase-messaging-compat.js');

// ─── Fetch config injected by Vite at build time ────────────────────────────
async function getConfig() {
  const res = await fetch('/sw-config.json');
  return res.json();
}

// ─── Init after config loads ─────────────────────────────────────────────────
getConfig().then((config) => {
  firebase.initializeApp({
    apiKey: config.VITE_FIREBASE_API_KEY,
    authDomain: config.VITE_FIREBASE_AUTH_DOMAIN,
    projectId: config.VITE_FIREBASE_PROJECT_ID,
    messagingSenderId: config.VITE_FIREBASE_MESSAGING_SENDER_ID,
    appId: config.VITE_FIREBASE_APP_ID,
  });

  const messaging = firebase.messaging();

  messaging.onBackgroundMessage((payload) => {
    const title = payload?.notification?.title || "Notification";
    const body = payload?.notification?.body || "";
    self.registration.showNotification(title, { body });
  });
});