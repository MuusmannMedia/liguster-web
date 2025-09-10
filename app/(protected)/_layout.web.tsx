// app/(protected)/_layout.web.tsx
import { Slot } from "expo-router";
import React from "react";
import { StyleSheet, View } from "react-native";
import WebHeader from "../components/WebHeader";

export default function ProtectedWebLayout() {
  return (
    <View style={styles.page}>
      <WebHeader />
      <Slot />
    </View>
  );
}
const styles = StyleSheet.create({ page: { flex: 1, backgroundColor: "#7C8996" } });

// app/(public)/_layout.web.tsx
import React from "react";

export default function PublicWebLayout() {
  return (
    <View style={styles.page}>
      <WebHeader />
      <Slot />
    </View>
  );
}
const styles = StyleSheet.create({ page: { flex: 1, backgroundColor: "#7C8996" } });