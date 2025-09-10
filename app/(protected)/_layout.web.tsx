import { Link, router, Slot } from "expo-router";
import Head from "expo-router/head";
import React, { useCallback, useState } from "react";
import {
    Image,
    StyleSheet,
    Text,
    TouchableOpacity,
    useWindowDimensions,
    View,
} from "react-native";
import { useSession } from "../../hooks/useSession";
import { supabase } from "../../utils/supabase";

const NAV_HEIGHT = 64;
const MOBILE_MAX = 860; // breakpoint for burgermenu

export default function ProtectedWebLayout() {
  const { session, loading } = useSession();
  const isAuthed = !!session;
  const { width } = useWindowDimensions();
  const isMobile = width < MOBILE_MAX;
  const [open, setOpen] = useState(false);

  const signOut = useCallback(async () => {
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
        {/* Sikrer scroll og nulstiller evt. gamle footere */}
        <style>{`
          html, body, #root, #__next { height: auto !important; overflow: auto !important; }
          body { margin: 0; -webkit-overflow-scrolling: touch; background: #7C8996; }
          footer, .footer, #footer, .bottom-nav, #bottom-nav, [data-footer], [role="contentinfo"] { display:none !important; }
        `}</style>
      </Head>

      {/* NAVBAR */}
      <View style={styles.navbar}>
        <Link href="/(protected)/Nabolag" style={styles.brandWrap} aria-label="Forside">
          <Image
            source={{ uri: "/Liguster-logo-website-clean.png" }}
            style={styles.logo}
            resizeMode="contain"
          />
          <Text style={styles.brand}>LIGUSTER</Text>
        </Link>

        {/* Right side */}
        {!loading && (
          isMobile ? (
            // MOBILE: burger
            <View style={{ position: "relative" }}>
              <TouchableOpacity
                onPress={() => setOpen((v) => !v)}
                accessibilityRole="button"
                accessibilityLabel="Åbn menu"
                style={styles.burger}
              >
                <Text style={styles.burgerIcon}>☰</Text>
              </TouchableOpacity>

              {open && (
                <View style={styles.menu}>
                  <Link href="/(protected)/Nabolag" style={styles.menuItem} onPress={() => setOpen(false)}>
                    Nabolag
                  </Link>
                  <Link href="/(protected)/ForeningerScreen" style={styles.menuItem} onPress={() => setOpen(false)}>
                    Forening
                  </Link>
                  <Link href="/(protected)/Beskeder" style={styles.menuItem} onPress={() => setOpen(false)}>
                    Beskeder
                  </Link>

                  {isAuthed ? (
                    <TouchableOpacity onPress={signOut} style={styles.logoutBtn}>
                      <Text style={styles.logoutTxt}>Log ud</Text>
                    </TouchableOpacity>
                  ) : (
                    <Link href="/LoginScreen" style={styles.menuItem} onPress={() => setOpen(false)}>
                      Log ind
                    </Link>
                  )}
                </View>
              )}
            </View>
          ) : (
            // DESKTOP: links
            <View style={styles.links}>
              {isAuthed ? (
                <>
                  <Link href="/(protected)/Nabolag" style={styles.link}>Nabolag</Link>
                  <Link href="/(protected)/ForeningerScreen" style={styles.link}>Forening</Link>
                  <Link href="/(protected)/Beskeder" style={styles.link}>Beskeder</Link>
                  <TouchableOpacity style={styles.logoutDesk} onPress={signOut}>
                    <Text style={styles.logoutDeskTxt}>Log ud</Text>
                  </TouchableOpacity>
                </>
              ) : (
                <Link href="/LoginScreen" style={styles.link}>Log ind</Link>
              )}
            </View>
          )
        )}
      </View>

      {/* INDHOLD */}
      <View style={styles.content}>
        <Slot />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  page: { flex: 1, backgroundColor: "#7C8996" },

  navbar: {
    height: NAV_HEIGHT,
    backgroundColor: "#0b1220",
    borderBottomWidth: 1,
    borderBottomColor: "#1e293b",
    paddingHorizontal: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    zIndex: 50,
  },

  brandWrap: { flexDirection: "row", alignItems: "center", gap: 10 } as any,
  logo: { width: 32, height: 32 },
  brand: { color: "#fff", fontWeight: "800", fontSize: 18, letterSpacing: 1.5 },

  links: { flexDirection: "row", alignItems: "center", gap: 18 } as any,
  link: { color: "#cbd5e1", fontSize: 14, textDecorationLine: "none" },

  burger: {
    borderWidth: 1, borderColor: "#334155",
    borderRadius: 10, paddingVertical: 6, paddingHorizontal: 10,
    backgroundColor: "#0f172a",
  },
  burgerIcon: { color: "#e2e8f0", fontWeight: "900", fontSize: 16 },

  menu: {
    position: "absolute", right: 0, top: 44, minWidth: 220,
    backgroundColor: "#0b1220",
    borderWidth: 1, borderColor: "#1e293b",
    borderRadius: 12, paddingVertical: 8,
    shadowColor: "#000", shadowOpacity: 0.3, shadowRadius: 16, elevation: 8,
  },
  menuItem: {
    color: "#e2e8f0", fontSize: 15,
    paddingVertical: 12, paddingHorizontal: 14,
    textDecorationLine: "none",
  } as any,
  logoutBtn: {
    marginTop: 6, marginHorizontal: 8, paddingVertical: 12,
    borderRadius: 10, backgroundColor: "#fff", alignItems: "center",
  },
  logoutTxt: { color: "#0b1220", fontWeight: "900" },

  logoutDesk: {
    borderWidth: 1, borderColor: "#334155", borderRadius: 10,
    paddingVertical: 8, paddingHorizontal: 12,
  },
  logoutDeskTxt: { color: "#e2e8f0", fontWeight: "700" },

  content: { flex: 1, minHeight: 0, paddingBottom: 12 },
});