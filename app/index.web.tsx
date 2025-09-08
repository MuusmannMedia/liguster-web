// app/index.web.tsx
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

// IMPORTANT: use an import so Metro can bundle it
import LogoNEG from "../../assets/images/Liguster-logo-NEG.png";

export default function LandingPage() {
  const router = useRouter();

  return (
    <ScrollView style={styles.page} contentContainerStyle={styles.container}>
      {/* Hero logo */}
      <Image source={LogoNEG} style={styles.logo} resizeMode="contain" />

      {/* Copy */}
      <Text style={styles.title}>Velkommen til Liguster</Text>
      <Text style={styles.subtitle}>
        Din lokale platform for fællesskab, hjælp og genbrug 🌱
      </Text>

      {/* CTAs */}
      <View style={styles.btnRow}>
        <TouchableOpacity style={styles.btnPrimary} onPress={() => router.push("/LoginScreen")}>
          <Text style={styles.btnPrimaryText}>Log ind</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.btnSecondary} onPress={() => router.push("/OpretBruger")}>
          <Text style={styles.btnSecondaryText}>Opret bruger</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  page: { flex: 1, backgroundColor: "#0f1623" },
  container: {
    flexGrow: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 48,
    paddingHorizontal: 20,
    gap: 14,
  },
  logo: { width: 180, height: 180, marginBottom: 8 },
  title: { color: "#fff", fontSize: 26, fontWeight: "800", textAlign: "center" },
  subtitle: {
    color: "#cbd5e1",
    fontSize: 16,
    textAlign: "center",
    marginTop: 4,
    marginBottom: 18,
    maxWidth: 560,
  },
  btnRow: { flexDirection: "row", gap: 12, marginTop: 4 },
  btnPrimary: {
    backgroundColor: "#fff",
    paddingHorizontal: 22,
    paddingVertical: 12,
    borderRadius: 10,
  },
  btnPrimaryText: { color: "#0f1623", fontSize: 16, fontWeight: "700" },
  btnSecondary: {
    backgroundColor: "#94a3b8",
    paddingHorizontal: 22,
    paddingVertical: 12,
    borderRadius: 10,
  },
  btnSecondaryText: { color: "#fff", fontSize: 16, fontWeight: "700" },
});