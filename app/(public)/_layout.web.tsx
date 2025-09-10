// app/(public)/_layout.web.tsx
import { Link, Slot } from "expo-router";
import Head from "expo-router/head";
import React, { useState } from "react";
import {
  Image,
  StyleSheet,
  Text,
  TouchableOpacity,
  useWindowDimensions,
  View,
} from "react-native";
import { useSession } from "../../hooks/useSession";

const MOBILE_MAX = 860;

export default function PublicWebLayout() {
  const { session } = useSession();
  const { width } = useWindowDimensions();
  const isMobile = width < MOBILE_MAX;
  const [open, setOpen] = useState(false);

  return (
    <View style={styles.page}>
      <Head>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <style>{`
          html, body, #root, #__next { height: auto !important; overflow: auto !important; }
          body { margin: 0; -webkit-overflow-scrolling: touch; }
          footer, .footer, #footer, .bottom-nav, #bottom-nav, [data-footer], [role="contentinfo"] { display:none !important; }
        `}</style>
      </Head>

      <View style={styles.navbar}>
        <Link href="/" style={styles.brandWrap} aria-label="Forside">
          <Image
            source={{ uri: "/Liguster-logo-website-clean.png" }}
            style={styles.logo}
            resizeMode="contain"
          />
          <Text style={styles.brand}>LIGUSTER</Text>
        </Link>

        {isMobile ? (
          <View style={{ position: "relative" }}>
            <TouchableOpacity onPress={() => setOpen((v) => !v)} style={styles.burger}>
              <Text style={styles.burgerIcon}>☰</Text>
            </TouchableOpacity>
            {open && (
              <View style={styles.menu}>
                <Link href="/(protected)/Nabolag" style={styles.menuItem} onPress={() => setOpen(false)}>
                  Gå til app
                </Link>
                {!session && (
                  <Link href="/LoginScreen" style={styles.menuItem} onPress={() => setOpen(false)}>
                    Log ind
                  </Link>
                )}
              </View>
            )}
          </View>
        ) : (
          <View style={styles.links}>
            <Link href="/(protected)/Nabolag" style={styles.link}>Gå til app</Link>
            {!session && <Link href="/LoginScreen" style={styles.link}>Log ind</Link>}
          </View>
        )}
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
    height: 64, backgroundColor: "#0b1220",
    borderBottomWidth: 1, borderBottomColor: "#1e293b",
    paddingHorizontal: 16, flexDirection: "row",
    alignItems: "center", justifyContent: "space-between",
  },

  brandWrap: { flexDirection: "row", alignItems: "center", gap: 10 } as any,
  logo: { width: 32, height: 32 },
  brand: { color: "#fff", fontSize: 18, fontWeight: "800", letterSpacing: 1.5 },

  links: { flexDirection: "row", alignItems: "center", gap: 18 } as any,
  link: { color: "#cbd5e1", fontSize: 14, textDecorationLine: "none" },

  burger: {
    borderWidth: 1, borderColor: "#334155",
    borderRadius: 10, paddingVertical: 6, paddingHorizontal: 10,
    backgroundColor: "#0f172a",
  },
  burgerIcon: { color: "#e2e8f0", fontWeight: "900", fontSize: 16 },

  menu: {
    position: "absolute", right: 0, top: 44, minWidth: 200,
    backgroundColor: "#0b1220", borderWidth: 1, borderColor: "#1e293b",
    borderRadius: 12, paddingVertical: 8,
    shadowColor: "#000", shadowOpacity: 0.3, shadowRadius: 16, elevation: 8,
  },
  menuItem: {
    color: "#e2e8f0", fontSize: 15,
    paddingVertical: 12, paddingHorizontal: 14,
    textDecorationLine: "none",
  } as any,

  content: { flex: 1, minHeight: 0 },
});