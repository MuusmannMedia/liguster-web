// app/(protected)/_layout.web.tsx
import { Slot } from "expo-router";
import React from "react";
import { StyleSheet, View } from "react-native";
import WebHeader from "../components/WebHeader"; // <- KORREKT relativ sti (søskende-mappe)

export default function ProtectedWebLayout() {
  return (
    <View style={styles.page}>
      <WebHeader />
      <Slot />
    </View>
  );
}

const styles = StyleSheet.create({
  page: { flex: 1, backgroundColor: "#7C8996" },
});