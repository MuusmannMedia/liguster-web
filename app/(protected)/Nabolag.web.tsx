import { Link, router, Slot } from "expo-router";
import Head from "expo-router/head";
import { StatusBar } from "expo-status-bar";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import { StyleSheet, Text, TouchableOpacity, useWindowDimensions, View } from "react-native";
import { useSession } from "../../hooks/useSession";
import { supabase } from "../../utils/supabase";

const PREVIEW = process.env.EXPO_PUBLIC_PREVIEW === "1";

export default function WebLayout() {
  const { session, loading } = useSession();
  const isAuthed = !!session;
  const { width } = useWindowDimensions();
  const isMobile = width < 760;

  const [menuOpen, setMenuOpen] = useState(false);
  const [hidden, setHidden] = useState(false);

  // Auto-hide / show navbar on scroll
  useEffect(() => {
    if (typeof window === "undefined") return;
    let lastY = window.scrollY;
    const onScroll = () => {
      const y = window.scrollY;
      // vis hvis man er tæt på top, ellers skjul ved scroll ned
      const shouldHide = y > 24 && y > lastY;
      setHidden(shouldHide);
      lastY = y;
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Sikr at siden kan scrolle og klikkes
  useEffect(() => {
    if (typeof document !== "undefined") {
      document.documentElement.style.overflow = "auto";
      document.body.style.overflow = "auto";
      document.body.style.pointerEvents = "auto";
      (document.getElementById("__next") as HTMLElement | null)?.style &&
        ((document.getElementById("__next") as HTMLElement).style.pointerEvents = "auto");
    }
  }, []);

  const handleSignOut = useCallback(async () => {
    try {
      await supabase.auth.signOut();
    } finally {
      router.replace("/LoginScreen");
    }
  }, []);

  const NavLinks = useMemo(
    () =>
      !loading && (
        <>
          {isAuthed ? (
            <>
              <Link href="/(protected)/Nabolag" style={styles.navLink}>
                Nabolag
              </Link>
              <Link href="/(protected)/ForeningerScreen" style={styles.navLink}>
                Forening
              </Link>
              <Link href="/(protected)/Beskeder" style={styles.navLink}>
                Beskeder
              </Link>
              <TouchableOpacity style={styles.loginBtn} onPress={handleSignOut}>
                <Text style={styles.loginBtnText}>Log ud</Text>
              </TouchableOpacity>
            </>
          ) : (
            <TouchableOpacity style={styles.loginBtn} onPress={() => router.push("/LoginScreen")}>
              <Text style={styles.loginBtnText}>Log ind</Text>
            </TouchableOpacity>
          )}
        </>
      ),
    [loading, isAuthed, handleSignOut]
  );

  return (
    <View style={styles.page}>
      <Head>
        {PREVIEW && <meta name="robots" content="noindex,nofollow" />}
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>
      <StatusBar style="light" />

      {/* NAVBAR (auto-hide) */}
      <View
        style={[
          styles.navbar,
          hidden ? { transform: [{ translateY: -72 }] } : { transform: [{ translateY: 0 }] },
        ]}
      >
        <TouchableOpacity onPress={() => router.push("/")} accessibilityRole="link">
          <View style={styles.brandRow}>
            <Text style={styles.brand}>Liguster</Text>
            {PREVIEW && <Text style={styles.previewPill}>Preview</Text>}
          </View>
        </TouchableOpacity>

        {/* Desktop links */}
        {!isMobile && <View style={styles.navRight}>{NavLinks}</View>}

        {/* Burger (mobile) */}
        {isMobile && (
          <TouchableOpacity
            accessibilityRole="button"
            onPress={() => setMenuOpen((v) => !v)}
            style={styles.burger}
          >
            <Text style={{ color: "#e2e8f0", fontSize: 18, fontWeight: "900" }}>☰</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Mobile dropdown menu */}
      {isMobile && menuOpen && (
        <View style={styles.mobileMenu}>
          {NavLinks}
        </View>
      )}

      {/* INDHOLD – ingen footer nedenfor, så siden kan scrolle naturligt */}
      <View style={styles.content}>
        <Slot />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  page: { flex: 1, backgroundColor: "#0f1623" },

  navbar: {
    position: "sticky" as any,
    top: 0,
    zIndex: 20,
    height: 64,
    backgroundColor: "#0b1220",
    borderBottomWidth: 1,
    borderBottomColor: "#1e293b",
    paddingHorizontal: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    transitionDuration: "250ms" as any,
  },

  brandRow: { flexDirection: "row", alignItems: "center", gap: 10 },
  brand: { color: "#fff", fontSize: 18, fontWeight: "800", letterSpacing: 0.4 },
  previewPill: {
    color: "#022c22",
    backgroundColor: "#34d399",
    fontSize: 11,
    fontWeight: "800",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 999,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },

  navRight: { flexDirection: "row", alignItems: "center", gap: 16 },
  navLink: { color: "#cbd5e1", fontSize: 14 },
  loginBtn: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: "#334155",
    borderRadius: 10,
  },
  loginBtnText: { color: "#e2e8f0", fontWeight: "600" },

  burger: {
    paddingVertical: 8,
    paddingHorizontal: 10,
    borderWidth: 1,
    borderColor: "#334155",
    borderRadius: 10,
  },

  mobileMenu: {
    backgroundColor: "#0b1220",
    borderBottomWidth: 1,
    borderBottomColor: "#1e293b",
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 12,
    zIndex: 15,
  },

  content: {
    flex: 1,
    minHeight: 0, // vigtigt på web for korrekt flex/scroll
  },
});