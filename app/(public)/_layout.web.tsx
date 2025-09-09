// app/(public)/_layout.web.tsx
import { Link, router, Slot } from "expo-router";
import Head from "expo-router/head";
import React, { useCallback, useState } from "react";
import { StyleSheet, Text, TouchableOpacity, useWindowDimensions, View } from "react-native";
import { useSession } from "../../hooks/useSession";
import { supabase } from "../../utils/supabase";

const PREVIEW = process.env.EXPO_PUBLIC_PREVIEW === "1";

export default function WebLayout() {
  const { session, loading } = useSession();
  const isAuthed = !!session;
  const { width } = useWindowDimensions();
  const isMobile = width < 720;
  const [menuOpen, setMenuOpen] = useState(false);

  const handleSignOut = useCallback(async () => {
    try {
      await supabase.auth.signOut();
    } finally {
      router.replace("/LoginScreen");
    }
  }, []);

  return (
    <View style={styles.page}>
      <Head>
        {PREVIEW && <meta name="robots" content="noindex,nofollow" />}
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>

      {/* Topbar */}
      <View style={styles.navbar}>
        <TouchableOpacity onPress={() => router.push("/")} accessibilityRole="link" accessibilityLabel="Gå til forsiden">
          <View style={styles.brandRow}>
            <Text style={styles.brand}>Liguster</Text>
            {PREVIEW && <Text style={styles.previewPill}>Preview</Text>}
          </View>
        </TouchableOpacity>

        {/* Right side */}
        <View style={styles.navRight}>
          {!loading && (
            <>
              {/* Desktop links */}
              {!isMobile && isAuthed && (
                <>
                  <Link href="/(protected)/Nabolag" style={styles.navLink}>Nabolag</Link>
                  <Link href="/(protected)/ForeningerScreen" style={styles.navLink}>Forening</Link>
                  <Link href="/(protected)/Beskeder" style={styles.navLink}>Beskeder</Link>
                </>
              )}

              {/* Burger på mobil når man er logget ind */}
              {isMobile && isAuthed && (
                <View style={{ position: "relative" }}>
                  <TouchableOpacity style={styles.burgerBtn} onPress={() => setMenuOpen(v => !v)}>
                    <Text style={styles.burgerIcon}>☰</Text>
                  </TouchableOpacity>
                  {menuOpen && (
                    <View style={styles.menuCard}>
                      <Link href="/(protected)/Nabolag" style={styles.menuItem} onPress={() => setMenuOpen(false)}>Nabolag</Link>
                      <Link href="/(protected)/ForeningerScreen" style={styles.menuItem} onPress={() => setMenuOpen(false)}>Forening</Link>
                      <Link href="/(protected)/Beskeder" style={styles.menuItem} onPress={() => setMenuOpen(false)}>Beskeder</Link>
                      <TouchableOpacity onPress={handleSignOut} style={styles.menuLogout}>
                        <Text style={styles.menuLogoutText}>Log ud</Text>
                      </TouchableOpacity>
                    </View>
                  )}
                </View>
              )}

              {/* Auth knap */}
              {isAuthed ? (
                !isMobile && (
                  <TouchableOpacity style={styles.loginBtn} onPress={handleSignOut} accessibilityRole="button">
                    <Text style={styles.loginBtnText}>Log ud</Text>
                  </TouchableOpacity>
                )
              ) : (
                <TouchableOpacity
                  style={styles.loginBtn}
                  onPress={() => router.push("/LoginScreen")}
                  accessibilityRole="button"
                >
                  <Text style={styles.loginBtnText}>Log ind</Text>
                </TouchableOpacity>
              )}
            </>
          )}
        </View>
      </View>

      {/* INDHOLD – vinduet skal kunne scrolle, ingen footer der “hænger fast” */}
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
  brandRow: { flexDirection: "row", alignItems: "center", gap: 10 },
  brand: { color: "#fff", fontSize: 18, fontWeight: "800", letterSpacing: 0.4 },
  previewPill: {
    color: "#022c22",
    backgroundColor: "#34d399",
    fontSize: 11, fontWeight: "800",
    paddingHorizontal: 8, paddingVertical: 3,
    borderRadius: 999, textTransform: "uppercase", letterSpacing: 0.5,
  },
  navRight: { flexDirection: "row", alignItems: "center", gap: 16 },
  navLink: { color: "#cbd5e1", fontSize: 14 },

  // Burger (mobil)
  burgerBtn: {
    borderWidth: 1, borderColor: "#334155", borderRadius: 10,
    paddingVertical: 6, paddingHorizontal: 10, backgroundColor: "#0f172a",
  },
  burgerIcon: { color: "#e2e8f0", fontWeight: "900", fontSize: 16 },
  menuCard: {
    position: "absolute", right: 0, top: 40,
    backgroundColor: "#0b1220",
    borderWidth: 1, borderColor: "#1e293b", borderRadius: 12,
    paddingVertical: 8, minWidth: 200,
  },
  menuItem: { color: "#e2e8f0", fontSize: 14, paddingVertical: 10, paddingHorizontal: 12 } as any,
  menuLogout: { marginTop: 6, marginHorizontal: 8, paddingVertical: 10, borderRadius: 10, backgroundColor: "#fff", alignItems: "center" },
  menuLogoutText: { color: "#0b1220", fontWeight: "900" },

  loginBtn: { paddingVertical: 8, paddingHorizontal: 12, borderWidth: 1, borderColor: "#334155", borderRadius: 10 },
  loginBtnText: { color: "#e2e8f0", fontWeight: "600" },

  content: {
    flex: 1,
    minHeight: 0, // vigtigt for korrekt flex-beregning på web
  },
});