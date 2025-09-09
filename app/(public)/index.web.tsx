// app/(public)/index.web.tsx
import { useRouter } from "expo-router";
import React from "react";
import {
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

import LogoNEG from "../../assets/images/Liguster-logo-NEG.png";

export default function IndexWeb() {
  const router = useRouter();

  return (
    <ScrollView style={styles.root} contentContainerStyle={styles.container}>
      <Image source={LogoNEG} style={styles.heroImage} resizeMode="contain" />

      <Text style={styles.title}>Velkommen til Liguster</Text>
      <Text style={styles.subtitle}>
        Din lokale platform for fællesskab, hjælp og genbrug 🌱
      </Text>

      <View style={styles.buttons}>
        <TouchableOpacity
          accessibilityRole="button"
          style={styles.btn}
          onPress={() => router.push("/LoginScreen")}
        >
          <Text style={styles.btnText}>Log ind</Text>
        </TouchableOpacity>

        <TouchableOpacity
          accessibilityRole="button"
          style={[styles.btn, styles.btnSecondary]}
          onPress={() => router.push("/OpretBruger")}
        >
          <Text style={styles.btnText}>Opret bruger</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: "#0f1623" },
  container: {
    flexGrow: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 20,
  },
  heroImage: { width: 240, height: 240, marginBottom: 30 },
  title: { fontSize: 28, fontWeight: "800", color: "#fff", marginBottom: 10, textAlign: "center" },
  subtitle: {
    fontSize: 16, color: "#cbd5e1", marginBottom: 30, textAlign: "center", maxWidth: 500,
  },
  buttons: { flexDirection: "row", gap: 16 },
  btn: { backgroundColor: "#ffffff", paddingHorizontal: 22, paddingVertical: 14, borderRadius: 10 },
  btnSecondary: { backgroundColor: "#94a3b8" },
  btnText: { color: "#0f1623", fontWeight: "700", fontSize: 16 },
});