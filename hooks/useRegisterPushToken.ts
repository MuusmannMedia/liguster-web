// hooks/useRegisterPushToken.ts
import Constants from "expo-constants";
import * as Notifications from "expo-notifications";
import { useEffect, useRef } from "react";
import { Platform } from "react-native";
import { supabase } from "../utils/supabase";

/**
 * Hook der kan registrere (eller fjerne) push-token for en bruger i public.push_tokens.
 * - Kører kun på iOS/Android (ikke web).
 * - Returnerer en funktion, som du kan kalde efter brugeren har givet samtykke.
 */
export default function useRegisterPushToken(userId?: string | null) {
  const hasSetHandler = useRef(false);

  // Sæt en simpel notifications-handler (kun én gang)
  useEffect(() => {
    if (hasSetHandler.current) return;
    hasSetHandler.current = true;

    Notifications.setNotificationHandler({
      handleNotification: async () => ({
        shouldShowAlert: true,
        shouldPlaySound: false,
        shouldSetBadge: false,
      }),
    });
  }, []);

  // (Valgfrit) oprydning ved logout – beholdt som kommentar
  useEffect(() => {
    if (!userId) return;
    return () => {
      // Eksempel: slet tokens for bruger ved logout (hvis du vil)
      // supabase.from("push_tokens").delete().eq("user_id", userId);
    };
  }, [userId]);

  /**
   * Bed om tilladelse og registrér token i Supabase.
   * Kald denne fra en onPress, efter at brugeren har accepteret push.
   */
  const requestAndRegister = async () => {
    if (!userId) return { ok: false as const, reason: "no-user" };
    if (Platform.OS === "web") return { ok: false as const, reason: "web-unsupported" };

    // 1) Tilladelser
    let { status } = await Notifications.getPermissionsAsync();
    if (status !== "granted") {
      const req = await Notifications.requestPermissionsAsync();
      status = req.status;
    }
    if (status !== "granted") return { ok: false as const, reason: "denied" };

    // 2) Hent Expo push-token
    // Sørg for at have projectId i app.json/app.config (EAS).
    const projectId =
      (Constants as any)?.expoConfig?.extra?.eas?.projectId ??
      (Constants as any)?.easConfig?.projectId ??
      undefined;

    const tokenRes = await Notifications.getExpoPushTokenAsync(
      projectId ? { projectId } : undefined
    );
    const token = tokenRes.data;
    if (!token) return { ok: false as const, reason: "no-token" };

    // 3) Gem token (upsert) i Supabase
    await supabase
      .from("push_tokens")
      .upsert(
        { user_id: userId, token },
        { onConflict: "user_id,token", ignoreDuplicates: false }
      );

    // 4) (valgfrit) markér samtykke i separat tabel
    await supabase
      .from("user_push_prefs")
      .upsert(
        { user_id: userId, allow_push: true },
        { onConflict: "user_id", ignoreDuplicates: false }
      );

    return { ok: true as const, token };
  };

  // Det er en hook, men den returnerer også en hjælper-funktion du kan bruge i UI
  return { requestAndRegister };
}