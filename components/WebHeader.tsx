// app/components/WebHeader.tsx
import { Link, usePathname } from "expo-router";
import React, { useMemo, useState } from "react";
import {
    Image,
    Pressable,
    StyleSheet,
    Text,
    useWindowDimensions,
    View
} from "react-native";

const NAV = [
  { href: "/Nabolag/", label: "Nabolag" },
  { href: "/forening/", label: "Forening" },
  { href: "/Beskeder/", label: "Beskeder" },
];

export default function WebHeader() {
  const { width } = useWindowDimensions();
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  // “Mobil” = under 768 px (kun her vises burgeren)
  const isMobile = useMemo(() => width < 768, [width]);

  // Luk menuen når man skifter side
  React.useEffect(() => {
    setOpen(false);
  }, [pathname]);

  return (
    <View style={styles.wrap}>
      <View style={styles.inner}>
        <Link href="/Nabolag/" asChild>
          <Pressable style={styles.brand}>
            <Image
              source={
                // fra app/components -> ../../assets/images/...
                require("../../assets/images/Liguster-logo-website-clean.png")
              }
              resizeMode="contain"
              style={styles.logo}
            />
            <Text style={styles.wordmark}>LIGUSTER</Text>
          </Pressable>
        </Link>

        {/* Desktop-nav (ingen burger) */}
        {!isMobile && (
          <View style={styles.nav}>
            {NAV.map((item) => {
              const active =
                pathname?.toLowerCase().startsWith(item.href.toLowerCase());
              return (
                <Link key={item.href} href={item.href} asChild>
                  <Pressable style={[styles.navItem, active && styles.active]}>
                    <Text style={[styles.navText, active && styles.navTextActive]}>
                      {item.label}
                    </Text>
                  </Pressable>
                </Link>
              );
            })}
            <Link href="/LoginScreen/" asChild>
              <Pressable style={styles.logoutBtn}>
                <Text style={styles.logoutText}>Log ud</Text>
              </Pressable>
            </Link>
          </View>
        )}

        {/* Mobil: burger */}
        {isMobile && (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Åbn menu"
            onPress={() => setOpen((v) => !v)}
            style={styles.burger}
          >
            <View style={styles.bar} />
            <View style={styles.bar} />
            <View style={styles.bar} />
          </Pressable>
        )}
      </View>

      {/* Mobil dropdown */}
      {isMobile && open && (
        <View style={styles.mobileMenu}>
          {NAV.map((item) => {
            const active =
              pathname?.toLowerCase().startsWith(item.href.toLowerCase());
            return (
              <Link key={item.href} href={item.href} asChild>
                <Pressable style={styles.mobileItem}>
                  <Text style={[styles.mobileText, active && styles.navTextActive]}>
                    {item.label}
                  </Text>
                </Pressable>
              </Link>
            );
          })}
          <Link href="/LoginScreen/" asChild>
            <Pressable style={[styles.mobileItem, { marginTop: 4 }]}>
              <Text style={styles.mobileText}>Log ud</Text>
            </Pressable>
          </Link>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    backgroundColor: "#0F2437",
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  inner: {
    maxWidth: 1100,
    width: "100%",
    alignSelf: "center",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
  },
  brand: { flexDirection: "row", alignItems: "center", gap: 10 },
  logo: { width: 28, height: 28 },
  wordmark: {
    color: "white",
    fontSize: 18,
    fontWeight: "800",
    letterSpacing: 2,
  },
  nav: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  navItem: {
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 8,
  },
  active: {
    backgroundColor: "rgba(255,255,255,0.08)",
  },
  navText: { color: "white", fontSize: 14, fontWeight: "600" },
  navTextActive: { color: "white" },
  logoutBtn: {
    marginLeft: 8,
    backgroundColor: "white",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 10,
  },
  logoutText: { color: "#0F2437", fontWeight: "700" },

  burger: {
    width: 34,
    height: 34,
    borderRadius: 10,
    justifyContent: "center",
    alignItems: "center",
    gap: 4,
    backgroundColor: "rgba(255,255,255,0.08)",
  },
  bar: { width: 18, height: 2, backgroundColor: "white", borderRadius: 1 },

  mobileMenu: {
    backgroundColor: "#0F2437",
    borderTopWidth: 1,
    borderTopColor: "rgba(255,255,255,0.12)",
    paddingHorizontal: 16,
    paddingBottom: 12,
  },
  mobileItem: {
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255,255,255,0.08)",
  },
  mobileText: { color: "white", fontSize: 16, fontWeight: "600" },
});