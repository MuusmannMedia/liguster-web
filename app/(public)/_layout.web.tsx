// app/(public)/_layout.web.tsx
import { Slot, router } from "expo-router";
import React, { useEffect, useState } from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";

const COLORS = {
  bg: "#0b1220",
  border: "#1e293b",
  text: "#e2e8f0",
  dim: "#cbd5e1",
  btnBorder: "#334155",
};

function useIsMobile(breakpoint = 720) {
  const [isMobile, setIsMobile] = useState(false);
  useEffect(() => {
    const update = () => setIsMobile(window.innerWidth < breakpoint);
    update();
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, [breakpoint]);
  return isMobile;
}

export default function PublicWebLayout() {
  const isMobile = useIsMobile();
  const [open, setOpen] = useState(false);

  return (
    <View style={styles.page}>
      <View style={styles.nav}>
        <TouchableOpacity onPress={() => router.push("/")}>
          <img
            src="/liguster-logo-website-clean.png"
            alt="Liguster"
            style={{ height: 28, display: "block" }}
            onError={(e) => {
              const el = e.currentTarget as HTMLImageElement;
              if (!el.dataset.triedFallback) {
                el.dataset.triedFallback = "1";
                el.src = "/Liguster-logo-website-clean.png";
              }
            }}
          />
        </TouchableOpacity>

        {!isMobile ? (
          // Desktop: NO burger
          <View style={styles.right}>
            <TouchableOpacity onPress={() => router.push("/LoginScreen")} style={styles.cta}>
              <Text style={styles.ctaTxt}>Log ind</Text>
            </TouchableOpacity>
          </View>
        ) : (
          // Mobile: burger
          <View style={{ position: "relative" }}>
            <TouchableOpacity onPress={() => setOpen(v => !v)} style={styles.burger}>
              <Text style={styles.burgerIcon}>☰</Text>
            </TouchableOpacity>
            {open && (
              <View style={styles.menu}>
                <TouchableOpacity
                  onPress={() => { setOpen(false); router.push("/LoginScreen"); }}
                  style={styles.logout}
                >
                  <Text style={styles.logoutTxt}>Log ind</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        )}
      </View>

      <Slot />
    </View>
  );
}

const styles = StyleSheet.create({
  page: { flex: 1, backgroundColor: "#7C8996" },
  nav: {
    height: 64,
    backgroundColor: COLORS.bg,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    paddingHorizontal: 24,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    zIndex: 100,
  },
  right: { flexDirection: "row", alignItems: "center", gap: 16 },
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
    position: "absolute", right: 0, top: 44, minWidth: 220,
    backgroundColor: COLORS.bg, borderWidth: 1, borderColor: COLORS.border,
    borderRadius: 12, paddingVertical: 8, zIndex: 999,
    boxShadow: "0 6px 16px rgba(0,0,0,0.25)",
  } as any,
  logout: {
    marginTop: 6, marginHorizontal: 8, paddingVertical: 10,
    borderRadius: 10, backgroundColor: "#fff", alignItems: "center",
  },
  logoutTxt: { color: "#0b1220", fontWeight: "900" },
});