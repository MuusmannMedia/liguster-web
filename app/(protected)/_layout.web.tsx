// app/(protected)/_layout.web.tsx
import { Link, router, Slot } from "expo-router";
import Head from "expo-router/head";
import React, { useCallback, useState } from "react";
import { StyleSheet, Text, TouchableOpacity, useWindowDimensions, View } from "react-native";
import { useSession } from "../../hooks/useSession";
import { supabase } from "../../utils/supabase";

export default function ProtectedWebLayout() {
  const { session } = useSession();
  const isAuthed = !!session;

  const { width } = useWindowDimensions();
  const isMobile = width > 0 && width < 720; // robust på web

  const [menuOpen, setMenuOpen] = useState(false);

  const signOut = useCallback(async () => {
    try { await supabase.auth.signOut(); } finally { router.replace("/LoginScreen"); }
  }, []);

  return (
    <View style={styles.page}>
      <Head>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        {/* Tillad scroll & fjern absolut AL footer på web */}
        <style>{`
          html, body, #root, #__next { height: auto !important; overflow: auto !important; }
          body { position: static !important; -webkit-overflow-scrolling: touch; }
          footer, .footer, #footer, .bottom-nav, #bottom-nav, [data-footer] { display:none !important; }
        `}</style>
      </Head>

      {/* Topbar */}
      <View style={styles.nav}>
        <TouchableOpacity onPress={() => router.push("/(protected)/Nabolag")}>
          <Text style={styles.brand}>Liguster</Text>
        </TouchableOpacity>

        <View style={styles.right}>
          {/* Desktop links */}
          {isAuthed && !isMobile && (
            <>
              <Link href="/(protected)/Nabolag" style={styles.link}>Nabolag</Link>
              <Link href="/(protected)/ForeningerScreen" style={styles.link}>Forening</Link>
              <Link href="/(protected)/Beskeder" style={styles.link}>Beskeder</Link>
              <TouchableOpacity onPress={signOut} style={styles.cta}>
                <Text style={styles.ctaTxt}>Log ud</Text>
              </TouchableOpacity>
            </>
          )}

          {/* Mobil burger */}
          {isAuthed && isMobile && (
            <View style={{ position: "relative" }}>
              <TouchableOpacity
                style={styles.burger}
                onPress={() => setMenuOpen((v) => !v)}
                accessibilityRole="button"
                accessibilityLabel="Åbn menu"
              >
                <Text style={styles.burgerIcon}>☰</Text>
              </TouchableOpacity>

              {menuOpen && (
                <>
                  {/* overlay for at kunne klikke udenfor og lukke */}
                  <TouchableOpacity style={styles.overlay} onPress={() => setMenuOpen(false)} />
                  <View style={styles.menu}>
                    <Link
                      href="/(protected)/Nabolag"
                      style={styles.menuItem as any}
                      onPress={() => setMenuOpen(false)}
                    >
                      Nabolag
                    </Link>
                    <Link
                      href="/(protected)/ForeningerScreen"
                      style={styles.menuItem as any}
                      onPress={() => setMenuOpen(false)}
                    >
                      Forening
                    </Link>
                    <Link
                      href="/(protected)/Beskeder"
                      style={styles.menuItem as any}
                      onPress={() => setMenuOpen(false)}
                    >
                      Beskeder
                    </Link>

                    <TouchableOpacity onPress={signOut} style={styles.logout}>
                      <Text style={styles.logoutTxt}>Log ud</Text>
                    </TouchableOpacity>
                  </View>
                </>
              )}
            </View>
          )}
        </View>
      </View>

      {/* Indhold – lad body håndtere scroll */}
      <View style={styles.content}>
        <Slot />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  page: { flex: 1, backgroundColor: "#0f1623" },

  nav: {
    height: 64,
    backgroundColor: "#0b1220",
    borderBottomWidth: 1,
    borderBottomColor: "#1e293b",
    paddingHorizontal: 24,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    zIndex: 1000,
  },
  brand: { color: "#fff", fontSize: 18, fontWeight: "800" },
  right: { flexDirection: "row", alignItems: "center", gap: 16 },

  link: { color: "#cbd5e1", fontSize: 14, textDecorationLine: "none" },

  cta: {
    borderWidth: 1,
    borderColor: "#334155",
    borderRadius: 10,
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  ctaTxt: { color: "#e2e8f0", fontWeight: "700" },

  burger: {
    borderWidth: 1,
    borderColor: "#334155",
    borderRadius: 10,
    paddingVertical: 6,
    paddingHorizontal: 10,
    backgroundColor: "#0f172a",
  },
  burgerIcon: { color: "#e2e8f0", fontWeight: "900", fontSize: 16 },

  overlay: {
    position: "fixed" as any,
    inset: 0 as any,
    backgroundColor: "transparent",
    zIndex: 999, // under menu (1000), over indhold
  },

  menu: {
    position: "absolute",
    right: 0,
    top: 44,
    minWidth: 220,
    backgroundColor: "#0b1220",
    borderWidth: 1,
    borderColor: "#1e293b",
    borderRadius: 12,
    paddingVertical: 8,
    zIndex: 1000,
    boxShadow: "0 8px 24px rgba(0,0,0,0.35)" as any,
  },
  menuItem: { color: "#e2e8f0", fontSize: 14, paddingVertical: 10, paddingHorizontal: 12, textDecorationLine: "none" },
  logout: {
    marginTop: 6,
    marginHorizontal: 8,
    paddingVertical: 10,
    borderRadius: 10,
    backgroundColor: "#fff",
    alignItems: "center",
  },
  logoutTxt: { color: "#0b1220", fontWeight: "900" },

  content: { flex: 1, minHeight: 0 },
});