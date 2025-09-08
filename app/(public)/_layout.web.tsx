// app/(public)/_layout.web.tsx
import { router, Slot } from "expo-router";
import { useEffect } from "react";
import { View } from "react-native";
import { useSession } from "../../hooks/useSession";

export default function PublicWebLayout() {
  const { session, loading } = useSession();

  useEffect(() => {
    if (!loading && session) {
      // Når brugeren allerede er logget ind, send dem til den beskyttede web-side
      router.replace("/(protected)/Nabolag");
    }
  }, [loading, session]);

  // Undgå at vise landing/Login mens vi tjekker session
  if (loading) {
    return <View style={{ flex: 1, backgroundColor: "#0f1623" }} />;
  }

  return <Slot />;
}