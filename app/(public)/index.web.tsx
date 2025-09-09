import { Link, router } from "expo-router";
import Head from "expo-router/head";
import React, { useEffect } from "react";
import { Image, StyleSheet, Text, View } from "react-native";
import { useSession } from "../../hooks/useSession";

export default function PublicIndexWeb() {
  const { session, loading } = useSession();

  // Hvis logget ind → direkte til appen
  useEffect(() => {
    if (!loading && session) {
      router.replace("/(protected)/Nabolag");
    }
  }, [loading, session]);

  // Mens vi afklarer session, undgå at blinke landing
  if (loading) return null;

  // Ikke logget ind → vis landing
  return (
    <View style={styles.page}>
      <Head>
        <title>Liguster</title>
        <meta name="description" content="Din lokale platform for fællesskab, hjælp og genbrug." />
      </Head>

      <View style={styles.header}>
        <Text style={styles.brand}>Liguster</Text>
        <Link href="/LoginScreen" style={styles.topLogin}>Log ind</Link>
      </View>

      <View style={styles.hero}>
        {/* brug jeres egen grafik hvis I vil */}
        <Image
          source={{ uri: "https://dummyimage.com/200x200/0b1220/ffffff&text=L" }}
          style={styles.logo}
        />
        <Text style={styles.title}>Velkommen til Liguster</Text>
        <Text style={styles.sub}>Din lokale platform for fællesskab, hjælp og genbrug 🌱</Text>

        <View style={styles.ctas}>
          <Link href="/LoginScreen" style={[styles.cta, styles.ctaPrimary]}>Log ind</Link>
          <Link href="/(public)/LoginScreen" style={[styles.cta, styles.ctaGhost]}>Opret bruger</Link>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  page: { flex: 1, backgroundColor: "#0f1623" },
  header: {
    height: 64, paddingHorizontal: 24,
    alignItems: "center", justifyContent: "space-between",
    flexDirection: "row", borderBottomWidth: 1, borderBottomColor: "#1e293b",
    backgroundColor: "#0b1220",
  },
  brand: { color: "#fff", fontWeight: "800", fontSize: 18 },
  topLogin: { color: "#cbd5e1", fontSize: 14, textDecorationLine: "none" },

  hero: { flex: 1, alignItems: "center", justifyContent: "center", padding: 24, gap: 12 },
  logo: { width: 100, height: 100, marginBottom: 8, borderRadius: 20, backgroundColor: "#0b1220" },
  title: { color: "#fff", fontSize: 24, fontWeight: "900" },
  sub: { color: "#cbd5e1", fontSize: 14 },

  ctas: { flexDirection: "row", gap: 12, marginTop: 10 },
  cta: { paddingVertical: 10, paddingHorizontal: 14, borderRadius: 10, textDecorationLine: "none" } as any,
  ctaPrimary: { backgroundColor: "#fff", color: "#0b1220", fontWeight: "800" } as any,
  ctaGhost: { backgroundColor: "#1f2937", color: "#cbd5e1" } as any,
});