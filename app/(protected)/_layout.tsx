// app/(protected)/_layout.tsx
import { Redirect, Stack } from "expo-router";
import React from "react";
import { ActivityIndicator, StyleSheet, View } from "react-native";
import useRegisterPushToken from "../../hooks/useRegisterPushToken";
import { useSession } from "../../hooks/useSession";

export default function ProtectedLayout() {
  const { session, loading } = useSession();
  const userId = session?.user?.id;

  // Registrér push-token efter login (no-op på web/simulator)
  useRegisterPushToken(userId ?? undefined);

  // Vis en lille loader mens vi afklarer sessionen
  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="small" />
      </View>
    );
  }

  // Ingen session -> hop til login (public)
  if (!session) {
    return <Redirect href="/LoginScreen" />;
  }

  // Beskyttet stak (native). Skjul headers; start på Nabolag.
  return (
    <Stack
      initialRouteName="Nabolag"
      screenOptions={{
        headerShown: false,
        animation: "default",
      }}
    />
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: "center", justifyContent: "center" },
});