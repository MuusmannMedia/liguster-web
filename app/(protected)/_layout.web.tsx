// app/(protected)/_layout.web.tsx
import { Slot, router } from "expo-router";
import React, { useEffect, useState } from "react";
import { ActivityIndicator, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { supabase } from "../../utils/supabase";

export default function ProtectedLayout() {
  const [loading, setLoading] = useState(true);
  const [authed, setAuthed] = useState(false);

  useEffect(() => {
    let isMounted = true;

    // Tjek nuværende session
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!isMounted) return;
      setAuthed(!!session);
      setLoading(false);
      if (!session) router.replace("/LoginScreen");
    });

    // Lyt efter login/logout
    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!isMounted) return;
      const signedIn = !!session;
      setAuthed(signedIn);
      if (!signedIn) router.replace("/LoginScreen");
    });

    return () => {
      isMounted = false;
      // Beskyt mod forskellige SDK‑versioner
      // @ts-ignore – nogle versioner bruger .subscription, andre ikke
      sub?.subscription?.unsubscribe?.();
      // @ts-ignore
      sub?.unsubscribe?.();
    };
  }, []);

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" />
        <Text style={styles.muted}>Loader…</Text>
      </View>
    );
  }

  if (!authed) return null; // vi redirecter allerede, men undgår blink

  return (
    <View style={styles.page}>
      {/* Topbar til de beskyttede sider */}
      <View style={styles.navbar}>
        <TouchableOpacity onPress={() => router.push("/")}>
          <Text style={styles.brand}>Liguster</Text>
        </TouchableOpacity>

        <View style={{ flexDirection: "row", gap: 12, alignItems: "center" }}>
          <TouchableOpacity onPress={() => router.push("/(protected)/Nabolag")}>
            <Text style={styles.link}>Opslag</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => router.push("/(protected)/ForeningerScreen")}>
            <Text style={styles.link}>Forening</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => router.push("/(protected)/Beskeder")}>
            <Text style={styles.link}>Beskeder</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.logout}
            onPress={async () => {
              await supabase.auth.signOut();
              router.replace("/");
            }}
          >
            <Text style={styles.logoutText}>Log ud</Text>
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.content}>
        <Slot />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  page: { flex: 1, backgroundColor: "#0f1623" },
  navbar: {
    height: 64,
    backgroundColor: "#0b1220",
    borderBottomWidth: 1,
    borderBottomColor: "#1e293b",
    paddingHorizontal: 24,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  brand: { color: "#fff", fontSize: 18, fontWeight: "800", letterSpacing: 0.4 },
  link: { color: "#cbd5e1", fontSize: 14 },
  logout: { borderWidth: 1, borderColor: "#334155", borderRadius: 10, paddingVertical: 8, paddingHorizontal: 12 },
  logoutText: { color: "#e2e8f0", fontWeight: "600" },
  content: { flex: 1 },
  center: { flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: "#0f1623", gap: 8 },
  muted: { color: "#94a3b8" },
});