importScripts('https://www.gstatic.com/firebasejs/10.12.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.12.0/firebase-messaging-compat.js');

firebase.initializeApp({
  apiKey:            "AIzaSyDouq2ghclS05gTAjeG3KGldI35axkC3a0",
  authDomain:        "thesnackbar-notifications.firebaseapp.com",
  projectId:         "thesnackbar-notifications",
  messagingSenderId: "1073638424999",
  appId:             "1:1073638424999:web:dfa9f08d511c440a943682",
});

const messaging = firebase.messaging();

messaging.onBackgroundMessage((payload) => {
  const title = payload?.notification?.title || 'Notification';
  const body  = payload?.notification?.body  || '';
  self.registration.showNotification(title, { body });
});
