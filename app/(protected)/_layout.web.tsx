import { Link, router, Slot } from "expo-router";
import Head from "expo-router/head";
import React, { useCallback, useState } from "react";
import { StyleSheet, Text, TouchableOpacity, useWindowDimensions, View } from "react-native";
import { useSession } from "../../hooks/useSession"; // korrekt sti
import { supabase } from "../../utils/supabase";

export default function ProtectedWebLayout() {
  const { session } = useSession();
  const isAuthed = !!session;
  const { width } = useWindowDimensions();
  const isMobile = width < 720;
  const [menuOpen, setMenuOpen] = useState(false);

  const signOut = useCallback(async () => {
    try { await supabase.auth.signOut(); } finally { router.replace("/LoginScreen"); }
  }, []);

  return (
    <View style={styles.page}>
      <Head>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        {/* Tillad scroll + fjern footere globalt */}
        <style>{`
          html, body, #root, #__next { height: auto !important; overflow: auto !important; }
          body { position: static !important; -webkit-overflow-scrolling: touch; }
          footer, .footer, #footer, .bottom-nav, #bottom-nav, [data-footer] { display:none !important; }
        `}</style>
      </Head>

      <View style={styles.nav}>
        <TouchableOpacity onPress={() => router.push("/(protected)/Nabolag")}>
          <Text style={styles.brand}>Liguster</Text>
        </TouchableOpacity>

        <View style={styles.right}>
          {!isMobile && isAuthed && (
            <>
              <Link href="/(protected)/Nabolag" style={styles.link}>Nabolag</Link>
              <Link href="/(protected)/ForeningerScreen" style={styles.link}>Forening</Link>
              <Link href="/(protected)/Beskeder" style={styles.link}>Beskeder</Link>
            </>
          )}

          {isMobile && isAuthed && (
            <View style={{ position: "relative" }}>
              <TouchableOpacity style={styles.burger} onPress={() => setMenuOpen(v => !v)}>
                <Text style={styles.burgerIcon}>☰</Text>
              </TouchableOpacity>
              {menuOpen && (
                <View style={styles.menu}>
                  <Link href="/(protected)/Nabolag" style={styles.menuItem} onPress={() => setMenuOpen(false)}>Nabolag</Link>
                  <Link href="/(protected)/ForeningerScreen" style={styles.menuItem} onPress={() => setMenuOpen(false)}>Forening</Link>
                  <Link href="/(protected)/Beskeder" style={styles.menuItem} onPress={() => setMenuOpen(false)}>Beskeder</Link>
                  <TouchableOpacity onPress={signOut} style={styles.logout}>
                    <Text style={styles.logoutTxt}>Log ud</Text>
                  </TouchableOpacity>
                </View>
              )}
            </View>
          )}

          {isAuthed && !isMobile && (
            <TouchableOpacity onPress={signOut} style={styles.cta}>
              <Text style={styles.ctaTxt}>Log ud</Text>
            </TouchableOpacity>
          )}
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
  nav: {
    height: 64, backgroundColor: "#0b1220",
    borderBottomWidth: 1, borderBottomColor: "#1e293b",
    paddingHorizontal: 24, flexDirection: "row",
    alignItems: "center", justifyContent: "space-between",
  },
  brand: { color: "#fff", fontSize: 18, fontWeight: "800" },
  right: { flexDirection: "row", alignItems: "center", gap: 16 },
  link: { color: "#cbd5e1", fontSize: 14 },
  cta: { borderWidth: 1, borderColor: "#334155", borderRadius: 10, paddingVertical: 8, paddingHorizontal: 12 },
  ctaTxt: { color: "#e2e8f0", fontWeight: "700" },
  burger: { borderWidth: 1, borderColor: "#334155", borderRadius: 10, paddingVertical: 6, paddingHorizontal: 10, backgroundColor: "#0f172a" },
  burgerIcon: { color: "#e2e8f0", fontWeight: "900", fontSize: 16 },
  menu: {
    position: "absolute", right: 0, top: 40, minWidth: 200,
    backgroundColor: "#0b1220", borderWidth: 1, borderColor: "#1e293b",
    borderRadius: 12, paddingVertical: 8,
  },
  menuItem: { color: "#e2e8f0", fontSize: 14, paddingVertical: 10, paddingHorizontal: 12 } as any,
  logout: { marginTop: 6, marginHorizontal: 8, paddingVertical: 10, borderRadius: 10, backgroundColor: "#fff", alignItems: "center" },
  logoutTxt: { color: "#0b1220", fontWeight: "900" },
  content: { flex: 1, minHeight: 0 },
});