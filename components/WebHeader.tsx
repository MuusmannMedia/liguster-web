// app/components/WebHeader.tsx
import { Link, router } from "expo-router";
import React, { useState } from "react";
import { StyleSheet, Text, TouchableOpacity, useWindowDimensions, View } from "react-native";
import { useSession } from "../hooks/useSession"; // tilpas hvis din hook ligger andetsteds
import { supabase } from "../utils/supabase"; // tilpas hvis din utils-sti er anderledes

const COLORS = {
  bg: "#0b1220",
  border: "#1e293b",
  text: "#e2e8f0",
  dim: "#cbd5e1",
  btnBorder: "#334155",
};

export default function WebHeader() {
  const { session, loading } = useSession();
  const isAuthed = !!session;
  const { width } = useWindowDimensions();
  const isMobile = width < 720;
  const [open, setOpen] = useState(false);

  const signOut = async () => {
    try { await supabase.auth.signOut(); } finally { router.replace("/LoginScreen"); }
  };

  return (
    <View style={styles.nav}>
      <TouchableOpacity onPress={() => router.push(isAuthed ? "/(protected)/Nabolag" : "/")}>
        {/* Logo-only brand (ingen tekst) */}
        <View style={styles.brandWrap}>
          <img
            src="/liguster-logo-website-clean.png"
            alt="Liguster"
            style={{ height: 28, display: "block" }}
          />
        </View>
      </TouchableOpacity>

      {/* Desktop links */}
      {!isMobile && (
        <View style={styles.right}>
          {!loading && (
            isAuthed ? (
              <>
                <Link href="/(protected)/Nabolag" style={styles.link}>Nabolag</Link>
                <Link href="/(protected)/ForeningerScreen" style={styles.link}>Forening</Link>
                <Link href="/(protected)/Beskeder" style={styles.link}>Beskeder</Link>
                <TouchableOpacity onPress={signOut} style={styles.cta}>
                  <Text style={styles.ctaTxt}>Log ud</Text>
                </TouchableOpacity>
              </>
            ) : (
              <TouchableOpacity onPress={() => router.push("/LoginScreen")} style={styles.cta}>
                <Text style={styles.ctaTxt}>Log ind</Text>
              </TouchableOpacity>
            )
          )}
        </View>
      )}

      {/* Mobile burger */}
      {isMobile && (
        <View style={{ position: "relative" }}>
          <TouchableOpacity
            onPress={() => setOpen(v => !v)}
            style={styles.burger}
            accessibilityRole="button"
            accessibilityLabel="Åbn menu"
          >
            <Text style={styles.burgerIcon}>☰</Text>
          </TouchableOpacity>

          {open && (
            <View style={styles.menu}>
              {!loading && (
                isAuthed ? (
                  <>
                    <Link href="/(protected)/Nabolag" style={styles.menuItem} onPress={() => setOpen(false)}>Nabolag</Link>
                    <Link href="/(protected)/ForeningerScreen" style={styles.menuItem} onPress={() => setOpen(false)}>Forening</Link>
                    <Link href="/(protected)/Beskeder" style={styles.menuItem} onPress={() => setOpen(false)}>Beskeder</Link>
                    <TouchableOpacity onPress={signOut} style={styles.logout}>
                      <Text style={styles.logoutTxt}>Log ud</Text>
                    </TouchableOpacity>
                  </>
                ) : (
                  <TouchableOpacity onPress={() => { setOpen(false); router.push("/LoginScreen"); }} style={styles.logout}>
                    <Text style={styles.logoutTxt}>Log ind</Text>
                  </TouchableOpacity>
                )
              )}
            </View>
          )}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  nav: {
    height: 64,
    backgroundColor: COLORS.bg,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    paddingHorizontal: 24,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  brandWrap: { height: 28, justifyContent: "center" },

  right: { flexDirection: "row", alignItems: "center", gap: 16 },
  link: { color: COLORS.dim, fontSize: 14, textDecorationLine: "none" as const },

  cta: {
    paddingVertical: 8, paddingHorizontal: 12,
    borderWidth: 1, borderColor: COLORS.btnBorder, borderRadius: 10,
  },
  ctaTxt: { color: COLORS.text, fontWeight: "700" },

  burger: {
    borderWidth: 1, borderColor: COLORS.btnBorder, borderRadius: 10,
    paddingVertical: 6, paddingHorizontal: 10, backgroundColor: "#0f172a",
  },
  burgerIcon: { color: COLORS.text, fontWeight: "900", fontSize: 16 },
  menu: {
    position: "absolute", right: 0, top: 40, minWidth: 220,
    backgroundColor: COLORS.bg, borderWidth: 1, borderColor: COLORS.border,
    borderRadius: 12, paddingVertical: 8, zIndex: 20,
  },
  menuItem: {
    color: COLORS.text, fontSize: 14,
    paddingVertical: 10, paddingHorizontal: 12,
    textDecorationLine: "none" as const,
  },
  logout: {
    marginTop: 6, marginHorizontal: 8, paddingVertical: 10,
    borderRadius: 10, backgroundColor: "#fff", alignItems: "center",
  },
  logoutTxt: { color: "#0b1220", fontWeight: "900" },
});