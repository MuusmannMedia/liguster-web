// app/index.web.tsx
import { Link, router } from "expo-router";
import React, { useEffect } from "react";
import { Image, ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";

export default function WebLanding() {
  // Hjælpe‑log for at sikre at env vars er sat på Vercel
  useEffect(() => {
    // Disse linjer vises i browserens console (F12 → Console)
    // Fjern dem senere når alt virker.
    console.log("EXPO_PUBLIC_SUPABASE_URL:", process.env.EXPO_PUBLIC_SUPABASE_URL);
    console.log("EXPO_PUBLIC_SUPABASE_ANON_KEY:", process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ? "•sat•" : "•mangler•");
  }, []);

  return (
    <ScrollView contentContainerStyle={styles.page}>
      {/* Hero */}
      <View style={styles.hero}>
        <View style={styles.heroInner}>
          <View style={styles.heroCol}>
            <Text style={styles.heroTitle}>Nabolaget – samlet ét sted</Text>
            <Text style={styles.heroSubtitle}>
              Hjælp hinanden, lån ting, del arrangementer og hold styr på foreningen.
              Liguster samler hverdagen i dit nabolag.
            </Text>

            <View style={styles.heroActions}>
              <TouchableOpacity
                style={styles.cta}
                onPress={() => router.push("/OpretBruger")}
                accessibilityRole="button"
              >
                <Text style={styles.ctaText}>Kom i gang gratis</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.secondaryCta}
                onPress={() => router.push("/Nabolag")}
                accessibilityRole="button"
              >
                <Text style={styles.secondaryCtaText}>Se opslag</Text>
              </TouchableOpacity>
            </View>

            <Text style={styles.heroNote}>Ingen betalingskort – det tager under 1 minut.</Text>
          </View>

          <View style={styles.heroCol}>
            {/* Brug gerne en egentlig illustration (fx landing-illustration.png) når du har en */}
            <Image
              source={require("../assets/images/Liguster-logo-NEG.png")}
              style={styles.heroImage}
              resizeMode="contain"
            />
          </View>
        </View>
      </View>

      {/* Features */}
      <View style={styles.section}>
        <View style={styles.columns}>
          <Feature
            title="Opslag & hjælp"
            text="Efterlys hjælp, tilbyd din hånd eller del ting væk. Alt samlet i nabolaget."
          />
          <Feature
            title="Foreninger"
            text="Medlemslister, kalender, opslag og beskeder – nemt for bestyrelsen."
          />
          <Feature
            title="Beskeder"
            text="Hold samtalen i appen – både 1:1 og i grupper."
          />
        </View>
      </View>

      {/* Bottom CTA */}
      <View style={styles.bottomCta}>
        <Text style={styles.bottomCtaTitle}>Klar til at prøve Liguster?</Text>
        <View style={styles.bottomCtaRow}>
          <TouchableOpacity
            style={styles.cta}
            onPress={() => router.push("/OpretBruger")}
            accessibilityRole="button"
          >
            <Text style={styles.ctaText}>Opret bruger</Text>
          </TouchableOpacity>

          <Link href="/LoginScreen" style={styles.bottomLink} accessibilityRole="link">
            Har du allerede en konto? Log ind
          </Link>
        </View>
      </View>
    </ScrollView>
  );
}

function Feature({ title, text }: { title: string; text: string }) {
  return (
    <View style={styles.feature}>
      <Text style={styles.featureTitle}>{title}</Text>
      <Text style={styles.featureText}>{text}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  page: { backgroundColor: "#0f1623" },

  /* Hero */
  hero: { paddingVertical: 56, backgroundColor: "#0f1623" },
  heroInner: {
    maxWidth: 1200,
    width: "100%",
    alignSelf: "center",
    paddingHorizontal: 24,
    gap: 32,
    flexDirection: "row",
    flexWrap: "wrap",
  },
  heroCol: { flex: 1, minWidth: 300, justifyContent: "center" },
  heroTitle: { color: "white", fontSize: 42, fontWeight: "800", marginBottom: 12 },
  heroSubtitle: { color: "#cbd5e1", fontSize: 18, lineHeight: 26, marginBottom: 16, maxWidth: 560 },
  heroActions: { flexDirection: "row", gap: 12, marginTop: 8 },
  cta: { backgroundColor: "#22c55e", paddingVertical: 12, paddingHorizontal: 18, borderRadius: 12 },
  ctaText: { color: "#0b1220", fontWeight: "800" },
  secondaryCta: { borderWidth: 1, borderColor: "#334155", paddingVertical: 12, paddingHorizontal: 18, borderRadius: 12 },
  secondaryCtaText: { color: "#e2e8f0", fontWeight: "700" },
  heroNote: { color: "#94a3b8", fontSize: 13, marginTop: 10 },
  heroImage: { width: "100%", height: 320 },

  /* Features */
  section: { backgroundColor: "#0f1623", paddingVertical: 40 },
  columns: {
    maxWidth: 1200,
    width: "100%",
    alignSelf: "center",
    paddingHorizontal: 24,
    gap: 24,
    flexDirection: "row",
    flexWrap: "wrap",
  },
  feature: {
    flex: 1,
    minWidth: 260,
    backgroundColor: "#111827",
    borderWidth: 1,
    borderColor: "#1f2937",
    padding: 20,
    borderRadius: 16,
  },
  featureTitle: { color: "#e2e8f0", fontSize: 18, fontWeight: "700", marginBottom: 6 },
  featureText: { color: "#94a3b8", lineHeight: 20 },

  /* Bottom CTA */
  bottomCta: {
    backgroundColor: "#0b1220",
    borderTopWidth: 1,
    borderTopColor: "#1f2937",
    paddingVertical: 36,
    paddingHorizontal: 24,
    alignItems: "center",
    gap: 12,
  },
  bottomCtaTitle: { color: "#e2e8f0", fontWeight: "800", fontSize: 20 },
  bottomCtaRow: { flexDirection: "row", gap: 16, alignItems: "center" },
  bottomLink: { color: "#cbd5e1" },
});