// app/components/WebHeader.tsx
import { Link, usePathname, useRouter } from "expo-router";
import Head from "expo-router/head";
import React, { useEffect, useRef, useState } from "react";
import { Image, Pressable, StyleSheet, Text, View } from "react-native";

// Brug det rene liguster-logo til headeren
const LOGO = require("../assets/images/Liguster-logo-NEG.png");

const LINKS = [
  { href: "/Nabolag", label: "Nabolag" },
  { href: "/Forening", label: "Forening" },
  { href: "/Beskeder", label: "Beskeder" },
];

export default function WebHeader() {
  const [open, setOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement | null>(null);
  const btnRef = useRef<HTMLButtonElement | null>(null);
  const pathname = usePathname();
  const router = useRouter();

  // Luk dropdown når man klikker udenfor
  useEffect(() => {
    const onDoc = (e: MouseEvent) => {
      if (!open) return;
      const t = e.target as Node;
      if (menuRef.current?.contains(t) || btnRef.current?.contains(t)) return;
      setOpen(false);
    };
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, [open]);

  // Luk dropdown ved route-skift
  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  return (
    <View style={styles.wrap}>
      {/* CSS der styrer hvornår burger/desktop vises */}
      <Head>
        <style>{`
          .only-mobile { display: none; }
          .only-desktop { display: flex; }
          @media (max-width: 900px) {
            .only-mobile { display: flex; }
            .only-desktop { display: none; }
          }
          /* Lille reset til knap */
          .icon-btn { background: #0b1220; border: 1px solid #253048; border-radius: 12px; padding: 8px; }
          .icon-btn:hover { background:#0e1627; }
        `}</style>
      </Head>

      {/* Venstre: logo (altid) */}
      <Link href="/Nabolag" style={{ textDecoration: "none" }}>
        <View style={styles.brand}>
          <Image source={LOGO} resizeMode="contain" style={styles.logo} />
        </View>
      </Link>

      {/* Højre: desktop-nav (ingen burger) */}
      <View className="only-desktop" style={styles.desktopRight}>
        <View style={styles.links}>
          {LINKS.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              style={[
                styles.link,
                pathname?.startsWith(l.href) && styles.linkActive,
              ]}
            >
              {l.label}
            </Link>
          ))}
        </View>
        <Pressable onPress={() => router.push("/LoginScreen?logout=1")} style={styles.logoutBtn}>
          <Text style={styles.logoutTxt}>Log ud</Text>
        </Pressable>
      </View>

      {/* Højre: mobil – KUN burger */}
      <View className="only-mobile" style={styles.mobileRight}>
        <button
          ref={btnRef}
          aria-label="Menu"
          className="icon-btn"
          onClick={() => setOpen((v) => !v)}
          style={{ cursor: "pointer" }}
        >
          {/* simpel burger-ikon */}
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
            <rect x="3" y="6" width="18" height="2" rx="1" fill="#d9e1ee" />
            <rect x="3" y="11" width="18" height="2" rx="1" fill="#d9e1ee" />
            <rect x="3" y="16" width="18" height="2" rx="1" fill="#d9e1ee" />
          </svg>
        </button>

        {open && (
          <View ref={menuRef as any} style={styles.dropdown}>
            {LINKS.map((l) => (
              <Link key={l.href} href={l.href} style={styles.ddItem}>
                {l.label}
              </Link>
            ))}
            <Pressable
              onPress={() => router.push("/LoginScreen?logout=1")}
              style={styles.ddLogout}
            >
              <Text style={styles.ddLogoutTxt}>Log ud</Text>
            </Pressable>
          </View>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    height: 64,
    backgroundColor: "#0b1220",
    borderBottomColor: "rgba(255,255,255,0.06)",
    borderBottomWidth: 0,
    paddingHorizontal: 16,
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
  },
  brand: { flexDirection: "row", alignItems: "center", gap: 8 },
  logo: { width: 32, height: 32 },
  desktopRight: { flexDirection: "row", alignItems: "center", gap: 12 },
  links: { flexDirection: "row", gap: 18 },
  link: {
    color: "#c6d1e6",
    fontWeight: "600",
    fontSize: 14,
    textDecorationLine: "none",
    paddingVertical: 6,
  },
  linkActive: { color: "#ffffff" },
  logoutBtn: {
    backgroundColor: "#0f1628",
    borderColor: "#253048",
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 6,
    marginLeft: 8,
  },
  logoutTxt: { color: "#dfe7f6", fontWeight: "700", fontSize: 12 },
  mobileRight: { alignItems: "center", flexDirection: "row", gap: 8, position: "relative" },
  dropdown: {
    position: "absolute",
    top: 52,
    right: 0,
    backgroundColor: "#0b1220",
    borderColor: "#253048",
    borderWidth: 1,
    borderRadius: 14,
    padding: 10,
    width: 220,
    gap: 10,
    shadowColor: "#000",
    shadowOpacity: 0.3,
    shadowOffset: { width: 0, height: 8 },
    shadowRadius: 16,
  },
  ddItem: {
    color: "#c6d1e6",
    fontSize: 16,
    fontWeight: "600",
    textDecorationLine: "none",
    paddingVertical: 6,
  },
  ddLogout: {
    marginTop: 6,
    backgroundColor: "#111827",
    borderRadius: 12,
    paddingVertical: 10,
    alignItems: "center",
  },
  ddLogoutTxt: { color: "#ffffff", fontWeight: "800", fontSize: 16 },
});