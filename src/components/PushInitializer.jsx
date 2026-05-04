import { useEffect } from "react";
import { registerPushForUser, listenForMessages } from "../services/firebase";

export default function PushInitializer() {

  useEffect(() => {

    const init = async () => {
      const phone = localStorage.getItem("phone");

      // 🔒 Only register for customers
      if (!phone) {
        console.log("No phone → skip push init");
        return;
      }

      const alreadyRegistered = localStorage.getItem("push_registered");

      if (!alreadyRegistered) {
        console.log("📡 Attempting push registration for:", phone);

        // ✅ Only mark registered if backend actually confirmed
        const success = await registerPushForUser(phone);

        if (success) {
          localStorage.setItem("push_registered", "true");
          console.log("✅ push_registered flag set");
        } else {
          console.warn("⚠️ Push registration failed — will retry on next load");
          // Intentionally NOT setting push_registered so it retries next time
        }
      }

      // 🔥 Always attach foreground listener (safe — deduped internally)
      listenForMessages();
    };

    init();

    // 🔁 Handle case: phone added AFTER app load (e.g. after modal submit)
    const handleStorageChange = (e) => {
      if (e.key === "phone") {
        console.log("📱 Phone changed in storage — re-init push");
        init();
      }
    };

    window.addEventListener("storage", handleStorageChange);

    return () => {
      window.removeEventListener("storage", handleStorageChange);
    };

  }, []);

  return null;
}