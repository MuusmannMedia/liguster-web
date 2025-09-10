// app/(public)/_layout.web.tsx
import { Link, Slot } from "expo-router";
import Head from "expo-router/head";
import React from "react";
import { Image, StyleSheet, useWindowDimensions, View } from "react-native";
import { useSession } from "../../hooks/useSession";

export default function PublicWebLayout() {
  const { session } = useSession();
  const { width } = useWindowDimensions();
  const isMobile = width < 760;

  return (
    <View style={styles.page}>
      <Head>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <style>{`
          html, body, #root, #__next { height: auto !important; overflow: auto !important; }
          body { margin: 0; -webkit-overflow-scrolling: touch; background: #7C8996; }
          footer, .footer, #footer, .bottom-nav, #bottom-nav, [data-footer], [role="contentinfo"] { display:none !important; }
        `}</style>
      </Head>

      <View style={styles.nav}>
        <Link href="/" style={styles.brandWrap} aria-label="Forside">
          <Image
            source={{ uri: "/Liguster-logo-website-clean.png" }}
            style={styles.logo}
            resizeMode="contain"
          />
        </Link>

        <View style={styles.right}>
          {!session ? (
            <Link href="/LoginScreen" style={styles.link}>Log ind</Link>
          ) : (
            <>
              {/* Desktop: vis sektioner */}
              {!isMobile && (
                <>
                  <Link href="/(protected)/Nabolag" style={styles.link}>Nabolag</Link>
                  <Link href="/(protected)/ForeningerScreen" style={styles.link}>Forening</Link>
                  <Link href="/(protected)/Beskeder" style={styles.link}>Beskeder</Link>
                </>
              )}
              {/* CTA til app */}
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
  page: { flex: 1, backgroundColor: "#7C8996" },

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

  brandWrap: { flexDirection: "row", alignItems: "center", gap: 10 },
  logo: { height: 28, width: 120 },

  right: { flexDirection: "row", alignItems: "center", gap: 16 },
  link: { color: "#cbd5e1", fontSize: 14, textDecorationLine: "none" },

  ctaLink: {
    color: "#0b1220",
    backgroundColor: "#fff",
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 10,
    fontWeight: "800",
    textDecorationLine: "none",
  } as any,

  content: { flex: 1, minHeight: 0 },
});