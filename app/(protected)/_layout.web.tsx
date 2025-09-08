// app/(protected)/_layout.web.tsx
import { Redirect, Slot } from "expo-router";
import React from "react";
import { ActivityIndicator, StyleSheet, Text, View } from "react-native";
import { useSession } from "../../hooks/useSession";

/**
 * Beskyttet web-layout:
 * - Ingen navbar/footer/ScrollView her (det håndteres i app/_layout.web.tsx)
 * - Kun auth-check + <Slot />
 */
export default function ProtectedWebLayout() {
  const { session, loading } = useSession();

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" />
        <Text style={styles.muted}>Logger ind…</Text>
      </View>
    );
  }

  if (!session) {
    return <Redirect href="/LoginScreen" />;
  }

  return <Slot />;
}

const styles = StyleSheet.create({
  center: {
    flex: 1,
    backgroundColor: "#0f1623",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  muted: { color: "#94a3b8" },
});