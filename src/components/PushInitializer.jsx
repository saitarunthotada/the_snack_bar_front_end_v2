import { useEffect } from "react";
import { registerPushForUser, listenForMessages } from "../services/firebase";

export default function PushInitializer() {

  useEffect(() => {

    const init = async () => {
      // Double-guard: PushInitializerGated in App.jsx already prevents mounting
      // for admins, but check here too in case the token appears mid-session.
      if (localStorage.getItem("admin_token")) {
        console.log("[PushInitializer] admin session detected — skipping push registration");
        return;
      }

      const phone = localStorage.getItem("phone");
      if (!phone) return;

      const alreadyRegistered = localStorage.getItem("push_registered");
      const savedToken = localStorage.getItem("push_token");

      if (alreadyRegistered && savedToken) {
        listenForMessages();
        return;
      }

      try {
        const success = await registerPushForUser(phone);
        if (success) localStorage.setItem("push_registered", "true");
      } catch (err) {
        console.error("❌ [PushInitializer] registerPushForUser threw:", err.message);
      }

      listenForMessages();
    };

    init();

    const handlePhoneRegistered = () => {
      localStorage.removeItem("push_registered");
      localStorage.removeItem("push_token");
      init();
    };

    window.addEventListener("phoneRegistered", handlePhoneRegistered);
    return () => window.removeEventListener("phoneRegistered", handlePhoneRegistered);

  }, []);

  return null;
}