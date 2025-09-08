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
  // (Vi bruger ikke returværdien her, men hooken initialiserer sig selv.)
  useRegisterPushToken(userId ?? undefined);

  // Loader mens session afklares
  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color="#fff" />
      </View>
    );
  }

  // Ingen session -> tilbage til public (web håndterer selv redirect til Nabolag)
  if (!session) {
    return <Redirect href="/(public)" />;
  }

  // Beskyttet stack (native). Skjuler headers.
  return <Stack screenOptions={{ headerShown: false }} />;
}

const styles = StyleSheet.create({
  center: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#0f1623",
  },
});