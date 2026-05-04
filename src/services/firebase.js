// src/services/firebase.js
import { initializeApp } from "firebase/app";
import { getMessaging, getToken, onMessage } from "firebase/messaging";
import toast from "react-hot-toast";

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

const app = initializeApp(firebaseConfig);
const messaging = getMessaging(app);

const BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:8080";
const VAPID_KEY = import.meta.env.VITE_FIREBASE_VAPID_KEY;

// ==============================
// 🔐 GET DEVICE TOKEN
// ==============================
export const getDeviceToken = async () => {
  try {
    if (!("serviceWorker" in navigator)) {
      throw new Error("Service workers not supported in this browser");
    }

    const registration = await navigator.serviceWorker.register("/firebase-messaging-sw.js");
    await registration.update();

    await new Promise((resolve) => {
      if (registration.active) return resolve();
      const sw = registration.installing || registration.waiting;
      sw.addEventListener("statechange", (e) => {
        if (e.target.state === "activated") resolve();
      });
    });

    const permission = await Notification.requestPermission();
    if (permission !== "granted") {
      throw new Error("Notification permission denied");
    }

    const token = await getToken(messaging, {
      vapidKey: VAPID_KEY,
      serviceWorkerRegistration: registration,
    });

    if (!token) {
      throw new Error("No FCM token generated — check VAPID key in Firebase console");
    }

    console.log("🔥 DEVICE TOKEN:", token);
    return token;

  } catch (err) {
    console.error("❌ getDeviceToken error:", err.message);
    throw err;
  }
};

// ==============================
// 📡 REGISTER TOKEN TO BACKEND
// ==============================
export const registerPushForUser = async (phone) => {
  if (!phone) {
    console.log("❌ No phone → skipping push registration");
    return false;
  }

  try {
    const token = await getDeviceToken();

    // Cache token locally so PushInitializer can skip re-registration on next load
    localStorage.setItem("push_token", token);

    const res = await fetch(`${BASE_URL}/api/device-token`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ phone, token }),
    });

    if (!res.ok) {
      const errorText = await res.text();
      throw new Error(`Failed to save token: ${res.status} ${errorText}`);
    }

    console.log("✅ Token saved to backend for phone:", phone);
    return true;

  } catch (err) {
    console.error("❌ Push registration failed:", err.message);
    return false;
  }
};

// ==============================
// 🔔 FOREGROUND LISTENER
// ==============================
let isListenerAttached = false;

export const listenForMessages = () => {
  if (isListenerAttached) return;
  isListenerAttached = true;

  onMessage(messaging, (payload) => {
    console.log("📩 Foreground message:", payload);

    const title = payload?.notification?.title || "Notification";
    const body = payload?.notification?.body || "";

    toast.success(`${title} — ${body}`, {
      duration: 4000,
      position: "top-center",
    });
  });

  console.log("🔔 Foreground message listener attached");
};