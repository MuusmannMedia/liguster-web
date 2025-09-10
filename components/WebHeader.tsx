// app/components/WebHeader.tsx
// app/components/WebHeader.tsx
import React, { useState } from "react";
import { Platform, View, Text, Pressable, Image, useWindowDimensions, StyleSheet } from "react-native";
import { Link } from "expo-router";

const BREAKPOINT = 900; // desktop hvis >= 900px

export default function WebHeader() {
  const { width } = useWindowDimensions();
  const isDesktop = width >= BREAKPOINT;
  const [open, setOpen] = useState(false);

  // Web-logo: brug public-fil hvis den findes; ellers fallback til assets
  const logoSource =
    Platform.OS === "web"
      ? { uri: "/Liguster-logo-website-clean.png" } // public/ root i Vercel
      : require("../../assets/images/Liguster-logo-NEG.png");

  return (
    <View style={styles.wrap}>
      <View style={styles.inner}>
        <Link href="/Nabolag/" asChild>
          <Pressable style={styles.brand} onPress={() => setOpen(false)}>
            <Image
              source={logoSource}
              style={{ width: 28, height: 28, marginRight: 10 }}
              resizeMode="contain"
            />
            <Text style={styles.brandText}>LIGUSTER</Text>
          </Pressable>
        </Link>

        {isDesktop ? (
          // DESKTOP: ingen burger, vis links inline
          <View style={styles.navRow}>
            <NavLink href="/Nabolag/">Nabolag</NavLink>
            <NavLink href="/Forening/">Forening</NavLink>
            <NavLink href="/Beskeder/">Beskeder</NavLink>
            <NavLink href="/LoginScreen" kind="button">Log ud</NavLink>
          </View>
        ) : (
          // MOBIL: burger
          <>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Åbn menu"
              onPress={() => setOpen(v => !v)}
              style={styles.burger}
            >
              <View style={styles.line}/>
              <View style={styles.line}/>
              <View style={styles.line}/>
            </Pressable>

            {open && (
              <View style={styles.sheet}>
                <NavItem href="/Nabolag/" onPress={() => setOpen(false)} label="Nabolag" />
                <NavItem href="/Forening/" onPress={() => setOpen(false)} label="Forening" />
                <NavItem href="/Beskeder/" onPress={() => setOpen(false)} label="Beskeder" />
                <NavItem href="/LoginScreen" onPress={() => setOpen(false)} label="Log ud" isButton />
              </View>
            )}
          </>
        )}
      </View>
    </View>
  );
}

function NavLink({ href, children, kind }: { href: string; children: React.ReactNode; kind?: "button" }) {
  return (
    <Link href={href} asChild>
      <Pressable style={[styles.link, kind === "button" && styles.button]}>
        <Text style={[styles.linkText, kind ===