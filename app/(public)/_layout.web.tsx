// app/(public)/_layout.web.tsx
import { Slot } from "expo-router";
import React from "react";
import { StyleSheet, View } from "react-native";
import WebHeader from "../../components/WebHeader";

export default function PublicWebLayout() {
  return (
    <View style={styles.page}>
      {/* Global CSS for responsive header (no JS needed) */}
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