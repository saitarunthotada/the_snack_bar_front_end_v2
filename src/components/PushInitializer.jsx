// src/components/PushInitializer.jsx
import { useEffect } from "react";
import { registerPushForUser, listenForMessages } from "../services/firebase";

export default function PushInitializer() {

  useEffect(() => {

    const init = async () => {
      console.log("🔄 [PushInitializer] init() called");

      const phone = localStorage.getItem("phone");
      console.log("📱 [PushInitializer] phone from localStorage:", phone);

      if (!phone) {
        console.log("⏭️ [PushInitializer] No phone → skipping");
        return;
      }

      const alreadyRegistered = localStorage.getItem("push_registered");
      const savedToken = localStorage.getItem("push_token");
      console.log("💾 [PushInitializer] push_registered:", alreadyRegistered, "| push_token prefix:", savedToken?.substring(0, 20));

      // Both flags present — token is cached, skip registration entirely
      if (alreadyRegistered && savedToken) {
        console.log("✅ [PushInitializer] Already registered with cached token — attaching listener only");
        listenForMessages();
        return;
      }

      console.log("📡 [PushInitializer] Attempting push registration for:", phone);

      try {
        const success = await registerPushForUser(phone);
        console.log("📬 [PushInitializer] registerPushForUser returned:", success);

        if (success) {
          localStorage.setItem("push_registered", "true");
          // push_token is set inside registerPushForUser itself
          console.log("✅ [PushInitializer] push_registered flag set");
        } else {
          console.warn("⚠️ [PushInitializer] Registration returned false — will retry on next load");
        }
      } catch (err) {
        console.error("❌ [PushInitializer] registerPushForUser threw:", err.message, err);
      }

      listenForMessages();
      console.log("🔔 [PushInitializer] listenForMessages attached");
    };

    init();

    const handleStorageChange = (e) => {
      if (e.key === "phone") {
        console.log("📱 [PushInitializer] Storage event — phone changed, re-init");
        init();
      }
    };

    window.addEventListener("storage", handleStorageChange);
    return () => window.removeEventListener("storage", handleStorageChange);

  }, []);

  return null;
}