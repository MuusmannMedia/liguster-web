// hooks/useRegisterPushToken.ts
import { useEffect } from "react";
import * as Device from "expo-device";
import * as Notifications from "expo-notifications";
import { Platform } from "react-native";
import { supabase } from "../utils/supabase";

export function useRegisterPushToken(userId?: string) {
  useEffect(() => {
    let alive = true;

    (async () => {
      try {
        // Kun kør hvis vi har en bruger og en rigtig enhed
        if (!userId) return;
        if (!Device.isDevice) return;

        // Bed om tilladelser
        const { status: existingStatus } = await Notifications.getPermissionsAsync();
        let finalStatus = existingStatus;
        if (existingStatus !== "granted") {
          const { status } = await Notifications.requestPermissionsAsync();
          finalStatus = status;
        }
        if (finalStatus !== "granted") return;

        // Hent Expo push token
        // Hvis du har sat extra.eas.projectId i app.json behøver du ikke at angive projectId her.
        const token = (await Notifications.getExpoPushTokenAsync()).data;

        if (!alive || !token) return;

        // Gem/opsæt token i din DB
        await supabase
          .from("user_push_tokens")
          .upsert(
            { user_id: userId, token, platform: Platform.OS },
            { onConflict: "user_id" } // sørg for unique constraint på user_id i tabellen
          );
      } catch (e) {
        console.log("Push-token registrering fejlede:", e);
      }
    })();

    return () => {
      alive = false;
    };
  }, [userId]);
}
