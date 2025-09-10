// app/components/WebHeader.tsx
import { Link, router, useSegments } from "expo-router";
import React, { useState } from "react";
import { Image, Linking, StyleSheet, Text, TouchableOpacity, useWindowDimensions, View } from "react-native";

export default function WebHeader() {
  const { width } = useWindowDimensions();
  const isMobile = width < 720;
  const [open, setOpen] = useState(false);
  const segments = useSegments();

  // Vurder om vi er i (protected) eller (public)
  const inProtected = segments?.[0] === "(protected)";

  const NavItems = () => (
    <>
      {inProtected ? (
        <>
          <Link href="/(protected)/Nabolag" style={styles.link}>Nabolag</Link>
          <Link href="/(protected)/ForeningerScreen" style={styles.link}>Forening</Link>
          <Link href="/(protected)/Beskeder" style={styles.link}>Beskeder</Link>
        </>
      ) : (
        <>
          <Link href="/privacy" style={styles.link}>Privacy</Link>
        </>
      )}
    </>
  );

  return (
    <View style={styles.nav}>
      <TouchableOpacity onPress={() => router.push(inProtected ? "/(protected)/Nabolag" : "/") } style={styles.brandWrap}>
        {/* Logo fra /public */}
        <Image
          source={{ uri: "/liguster-logo-nav.png" }}
          style={styles.logo}
          resizeMode="contain"
          accessible accessibilityRole="image" accessibilityLabel="Liguster"
        />
      </TouchableOpacity>

      {/* Desktop */}
      {!isMobile && (
        <View style={styles.right}>
          <NavItems />
          {inProtected ? (
            <TouchableOpacity
              style={styles.cta}
              onPress={() => router.push("/LoginScreen")}
            >
              <Text style={styles.ctaTxt}>Skift bruger</Text>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity
              style={styles.cta}
              onPress={() => router.push("/LoginScreen")}
            >
              <Text style={styles.ctaTxt}>Log ind</Text>
            </TouchableOpacity>
          )}
        </View>
      )}

      {/* Mobile burger */}
      {isMobile && (
        <View style={{ position: "relative" }}>
          <TouchableOpacity style={styles.burger} onPress={() => setOpen(v => !v)} accessibilityRole="button" accessibilityLabel="Åbn menu">
            <Text style={styles.burgerIcon}>☰</Text>
          </TouchableOpacity>
          {open && (
            <View style={styles.menu}>
              <NavItems />
              <TouchableOpacity
                onPress={() => { setOpen(false); router.push("/LoginScreen"); }}
                style={[styles.menuBtn, styles.menuPrimary]}
              >
                <Text style={styles.menuBtnTxt}>Log ind</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => { setOpen(false); Linking.openURL("/privacy"); }}
                style={styles.menuBtn}
              >
                <Text style={styles.menuBtnTxt}>Privacy</Text>
              </TouchableOpacity>
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
    backgroundColor: "#0b1220",
    borderBottomWidth: 1,
    borderBottomColor: "#1e293b",
    paddingHorizontal: 24,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  brandWrap: { height: 38, justifyContent: "center" },
  logo: { width: 140, height: 38 },
  right: { flexDirection: "row", alignItems: "center", gap: 16 },
  link: { color: "#cbd5e1", fontSize: 14, textDecorationLine: "none" },
  cta: { borderWidth: 1, borderColor: "#334155", borderRadius: 10, paddingVertical: 8, paddingHorizontal: 12 },
  ctaTxt: { color: "#e2e8f0", fontWeight: "700" },

  burger: { borderWidth: 1, borderColor: "#334155", borderRadius: 10, paddingVertical: 6, paddingHorizontal: 10, backgroundColor: "#0f172a" },
  burgerIcon: { color: "#e2e8f0", fontWeight: "900", fontSize: 16 },
  menu: {
    position: "absolute", right: 0, top: 44, minWidth: 220,
    backgroundColor: "#0b1220", borderWidth: 1, borderColor: "#1e293b",
    borderRadius: 12, padding: 10, gap: 10, zIndex: 50,
  },
  menuBtn: {
    borderWidth: 1, borderColor: "#334155", borderRadius: 10,
    paddingVertical: 10, alignItems: "center",
  },
  menuPrimary: { backgroundColor: "#ffffff", borderColor: "#ffffff" },
  menuBtnTxt: { color: "#e2e8f0", fontWeight: "700" },
});