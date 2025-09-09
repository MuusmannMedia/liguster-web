// app/_layout.web.tsx
import { Link, router, Slot } from "expo-router";
import Head from "expo-router/head";
import { StatusBar } from "expo-status-bar";
import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  Modal,
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  useWindowDimensions,
  View,
} from "react-native";
import { useSession } from "../hooks/useSession";
import { supabase } from "../utils/supabase";

const NAV_H = 64;

export default function WebLayout() {
  const { session, loading } = useSession();
  const isAuthed = !!session;
  const { width } = useWindowDimensions();
  const isMobile = width < 760;

  // ── Auto-hide navbar on scroll (web)
  const [navHidden, setNavHidden] = useState(false);
  const lastY = useRef(0);
  useEffect(() => {
    if (Platform.OS !== "web") return;
    const onScroll = () => {
      const y = window.scrollY || 0;
      const dy = y - (lastY.current || 0);
      // hide when scrolling down, show when scrolling up
      if (y > 80 && dy > 4) setNavHidden(true);
      else if (dy < -4) setNavHidden(false);
      lastY.current = y;
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

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
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>

      <StatusBar style="light" />

      {/* Fixed topbar (auto-hide) */}
      <View
        style={[
          styles.navbar,
          navHidden && { transform: [{ translateY: -NAV_H }] },
        ]}
      >
        <TouchableOpacity onPress={() => router.push("/")} accessibilityRole="link">
          <Text style={styles.brand}>Liguster</Text>
        </TouchableOpacity>

        {isMobile ? (
          <>
            <TouchableOpacity onPress={() => setMenuOpen(true)} style={styles.burger}>
              <Text style={styles.burgerText}>≡</Text>
            </TouchableOpacity>

            <Modal
              visible={menuOpen}
              transparent
              animationType="fade"
              onRequestClose={() => setMenuOpen(false)}
            >
              <View style={styles.menuOverlay}>
                <View style={styles.menuSheet}>
                  <Text style={styles.menuTitle}>Menu</Text>
                  {isAuthed ? (
                    <>
                      <Link href="/(protected)/Nabolag" style={styles.menuItem} onPress={() => setMenuOpen(false)}>Nabolag</Link>
                      <Link href="/(protected)/ForeningerScreen" style={styles.menuItem} onPress={() => setMenuOpen(false)}>Forening</Link>
                      <Link href="/(protected)/Beskeder" style={styles.menuItem} onPress={() => setMenuOpen(false)}>Beskeder</Link>
                      <TouchableOpacity onPress={handleSignOut} style={[styles.menuItem, styles.menuBtn]}>
                        <Text style={styles.menuBtnText}>Log ud</Text>
                      </TouchableOpacity>
                    </>
                  ) : (
                    <Link href="/LoginScreen" style={styles.menuItem} onPress={() => setMenuOpen(false)}>Log ind</Link>
                  )}

                  <TouchableOpacity onPress={() => setMenuOpen(false)} style={styles.menuClose}>
                    <Text style={styles.menuCloseText}>Luk</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </Modal>
          </>
        ) : (
          <View style={styles.navRight}>
            {!loading && (
              isAuthed ? (
                <>
                  <Link href="/(protected)/Nabolag" style={styles.navLink}>Nabolag</Link>
                  <Link href="/(protected)/ForeningerScreen" style={styles.navLink}>Forening</Link>
                  <Link href="/(protected)/Beskeder" style={styles.navLink}>Beskeder</Link>
                  <TouchableOpacity style={styles.loginBtn} onPress={handleSignOut}>
                    <Text style={styles.loginBtnText}>Log ud</Text>
                  </TouchableOpacity>
                </>
              ) : (
                <TouchableOpacity style={styles.loginBtn} onPress={() => router.push("/LoginScreen")}>
                  <Text style={styles.loginBtnText}>Log ind</Text>
                </TouchableOpacity>
              )
            )}
          </View>
        )}
      </View>

      {/* Content – give plads under fixed nav, og ingen ekstra “kasse” */}
      <View style={[styles.content, { paddingTop: NAV_H }]} >
        <Slot />
      </View>

      {/* Footer – skjul på mobil */}
      {!isMobile && (
        <View style={styles.footer}>
          <Text style={styles.copy}>© {new Date().getFullYear()} Liguster</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  page: { flex: 1, backgroundColor: "#7C8996" }, // ønsket baggrund

  navbar: {
    position: "fixed",
    top: 0, left: 0, right: 0,
    height: NAV_H,
    backgroundColor: "#0b1220",
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255,255,255,0.06)",
    paddingHorizontal: 18,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    zIndex: 50,
    transitionProperty: "transform",
    transitionDuration: "200ms",
  } as any,
  brand: { color: "#fff", fontSize: 20, fontWeight: "900", letterSpacing: 0.3 },

  navRight: { flexDirection: "row", alignItems: "center", gap: 18 },
  navLink: { color: "#cbd5e1", fontSize: 14 },
  loginBtn: { paddingVertical: 8, paddingHorizontal: 12, borderWidth: 1, borderColor: "#334155", borderRadius: 10 },
  loginBtnText: { color: "#e2e8f0", fontWeight: "700" },

  burger: { padding: 8, borderWidth: 1, borderColor: "#334155", borderRadius: 10 },
  burgerText: { color: "#e2e8f0", fontSize: 18, fontWeight: "900" },

  content: { flex: 1, paddingBottom: 18 },

  footer: {
    borderTopWidth: 1,
    borderTopColor: "rgba(0,0,0,0.1)",
    backgroundColor: "#0b1220",
    paddingHorizontal: 18,
    paddingVertical: 16,
  },
  copy: { color: "#64748b", fontSize: 12 },

  // Burger menu
  menuOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.5)", justifyContent: "flex-end" },
  menuSheet: { backgroundColor: "#0b1220", padding: 18, borderTopLeftRadius: 18, borderTopRightRadius: 18, gap: 12 },
  menuTitle: { color: "#fff", fontWeight: "900", fontSize: 16 },
  menuItem: { color: "#e5e7eb", fontSize: 16, paddingVertical: 8 },
  menuBtn: { borderWidth: 1, borderColor: "#334155", borderRadius: 10, alignItems: "center", paddingVertical: 10, marginTop: 6 },
  menuBtnText: { color: "#e2e8f0", fontWeight: "800" },
  menuClose: { alignSelf: "center", marginTop: 4, padding: 8 },
  menuCloseText: { color: "#94a3b8" },
});