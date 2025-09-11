// app/(protected)/_layout.web.tsx
import { Slot } from "expo-router";
import React from "react";
import { StyleSheet, View } from "react-native";
import WebHeader from "../components/WebHeader"; // <- sti fra app/(protected)

export default function ProtectedWebLayout() {
  return (
    <View style={styles.page}>
      <style>{`
        .only-mobile { display: none; }
        .only-desktop { display: flex; }
        @media (max-width: 719px) {
          .only-mobile { display: block; }
          .only-desktop { display: none; }
        }
      `}</style>

      <WebHeader />
      <Slot />
    </View>
  );
}

const styles = StyleSheet.create({
  page: { flex: 1, backgroundColor: "#7C8996" },
});