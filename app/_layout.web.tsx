// app/_layout.web.tsx
import { Link, router, Slot } from "expo-router";
import { StatusBar } from "expo-status-bar";
import React, { useCallback } from "react";
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { useSession } from "../hooks/useSession";
import { supabase } from "../utils/supabase";

export default function WebLayout() {
  const { session, isLoading } = useSession(); // sørg for at useSession returnerer isLoading
  const isAuthed = !!session;

  const handleSignOut = useCallback(async () => {
    try {
      await supabase.auth.signOut();
    } finally {
      router.replace("/LoginScreen");
    }
  }, []);

  return (
    <View style={styles.page}>
      <StatusBar style="light" />

      {/* Topbar */}
      <View style={styles.navbar}>
        <TouchableOpacity onPress={() => router.push("/")}>
          <Text style={styles.brand}>Liguster</Text>
        </TouchableOpacity>

        <View style={styles.navRight}>
          {/* Mens vi loader session, viser vi ingenting for at undgå flash */}
          {!isLoading && (
            <>
              {isAuthed ? (
                <>
                  <Link href="/(protected)/Nabolag" style={styles.navLink}>Opslag</Link>
                  <Link href="/(protected)/ForeningerScreen" style={styles.navLink}>Forening</Link>
                  <Link href="/(protected)/Beskeder" style={styles.navLink}>Beskeder</Link>

                  <TouchableOpacity style={styles.loginBtn} onPress={handleSignOut}>
                    <Text style={styles.loginBtnText}>Log ud</Text>
                  </TouchableOpacity>
                </>
              ) : (
                <>
                  <TouchableOpacity style={styles.loginBtn} onPress={() => router.push("/LoginScreen")}>
                    <Text style={styles.loginBtnText}>Log ind</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.cta} onPress={() => router.push("/OpretBruger")}>
                    <Text style={styles.ctaText}>Opret bruger</Text>
                  </TouchableOpacity>
                </>
              )}
            </>
          )}
        </View>
      </View>

      {/* Side‑indhold */}
      <ScrollView contentContainerStyle={styles.content}>
        <Slot />
      </ScrollView>

      {/* Footer */}
      <View style={styles.footer}>
        <Text style={styles.copy}>© {new Date().getFullYear()} Liguster</Text>

        <View style={styles.footerLinks}>
          {!isLoading && (
            <>
              {isAuthed ? (
                <>
                  <Link href="/(protected)/Nabolag" style={styles.footerLink}>Opslag</Link>
                  <Link href="/(protected)/ForeningerScreen" style={styles.footerLink}>Forening</Link>
                  <Link href="/(protected)/Beskeder" style={styles.footerLink}>Beskeder</Link>
                </>
              ) : (
                <>
                  <Link href="/LoginScreen" style={styles.footerLink}>Log ind</Link>
                  <Link href="/OpretBruger" style={styles.footerLink}>Opret bruger</Link>
                </>
              )}
            </>
          )}
        </View>
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
  navRight: { flexDirection: "row", alignItems: "center", gap: 16 },
  navLink: { color: "#cbd5e1", fontSize: 14 },
  loginBtn: { paddingVertical: 8, paddingHorizontal: 12, borderWidth: 1, borderColor: "#334155", borderRadius: 10 },
  loginBtnText: { color: "#e2e8f0", fontWeight: "600" },
  cta: { backgroundColor: "#22c55e", paddingVertical: 9, paddingHorizontal: 14, borderRadius: 10 },
  ctaText: { color: "#0b1220", fontWeight: "800" },

  content: { paddingBottom: 32 },

  footer: {
    borderTopWidth: 1,
    borderTopColor: "#1e293b",
    backgroundColor: "#0b1220",
    paddingHorizontal: 24,
    paddingVertical: 18,
    gap: 10,
  },
  copy: { color: "#64748b", fontSize: 12 },
  footerLinks: { flexDirection: "row", gap: 16 },
  footerLink: { color: "#cbd5e1", fontSize: 13 },
});