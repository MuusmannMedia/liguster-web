// app/(public)/_layout.web.tsx
import { Link, router, Slot } from "expo-router";
import Head from "expo-router/head";
import React from "react";
import { Image, StyleSheet, TouchableOpacity, useWindowDimensions, View } from "react-native";
import { useSession } from "../../hooks/useSession";

export default function PublicWebLayout() {
  const { session } = useSession();
  const { width } = useWindowDimensions();
  const isMobile = width < 720;

  return (
    <View style={styles.page}>
      <Head>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        {/* Scroll + skjul evt. gamle footere */}
        <style>{`
          html, body, #root, #__next { height: auto !important; overflow: auto !important; }
          body { margin: 0; -webkit-overflow-scrolling: touch; }
          footer, .footer, #footer, .bottom-nav, #bottom-nav, [data-footer] { display:none !important; }
        `}</style>
      </Head>

      <View style={styles.nav}>
        <TouchableOpacity
          onPress={() => router.push("/")}
          accessibilityRole="link"
          accessibilityLabel="Gå til forsiden"
          style={styles.brandWrap}
        >
          <Image
            source={{ uri: "/Liguster-logo-website-clean.png?v=2" }}
            style={styles.brandLogo}
            resizeMode="contain"
            accessible
            accessibilityLabel="Liguster"
          />
        </TouchableOpacity>

        <View style={styles.right}>
          {!session ? (
            <Link href="/LoginScreen" style={styles.link}>Log ind</Link>
          ) : (
            <>
              {!isMobile && (
                <>
                  <Link href="/(protected)/Nabolag" style={styles.link}>Nabolag</Link>
                  <Link href="/(protected)/ForeningerScreen" style={styles.link}>Forening</Link>
                  <Link href="/(protected)/Beskeder" style={styles.link}>Beskeder</Link>
                </>
              )}
              <Link href="/(protected)/Nabolag" style={styles.ctaLink}>Gå til app</Link>
            </>
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
  brandWrap: { paddingVertical: 8, paddingRight: 8 },
  brandLogo: { width: 128, height: 24 }, // ← kun billede, ingen tekst
  right: { flexDirection: "row", alignItems: "center", gap: 16 },
  link: { color: "#cbd5e1", fontSize: 14, textDecorationLine: "none" },
  ctaLink: {
    color: "#0b1220", backgroundColor: "#fff",
    paddingVertical: 8, paddingHorizontal: 12,
    borderRadius: 10, fontWeight: "800",
  } as any,
  content: { flex: 1, minHeight: 0 },
});