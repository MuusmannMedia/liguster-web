// app/index.web.tsx
import { Link, useRouter } from "expo-router";
import { Image, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";

export default function Landing() {
  const router = useRouter();

  return (
    <ScrollView contentContainerStyle={styles.wrap}>
      {/* Hero */}
      <View style={styles.hero}>
        <View style={{ gap: 16, maxWidth: 640 }}>
          <Text style={styles.kicker}>Velkommen til Liguster</Text>
          <Text style={styles.h1}>Dit digitale naboskab og foreningsrum</Text>
          <Text style={styles.lead}>
            Slå opslag op i dit nabolag, koordiner i foreningen og hold styr på beskeder – alt ét sted.
          </Text>

          <View style={styles.actions}>
            <Pressable onPress={() => router.push("/OpretBruger")} style={styles.primary}>
              <Text style={styles.primaryText}>Kom i gang gratis</Text>
            </Pressable>
            <Link href="/LoginScreen" style={styles.secondary}>Log ind</Link>
          </View>
        </View>

        <Image
          source={require("../assets/images/Liguster-logo-NEG.png")}
          style={styles.heroImg}
          resizeMode="contain"
        />
      </View>

      {/* Features */}
      <View style={styles.grid}>
        <Feature title="Nabolag"
                 text="Find hjælp, udlån ting og del opslag i nærheden." />
        <Feature title="Foreninger"
                 text="Medlemslister, begivenheder og intern kommunikation." />
        <Feature title="Beskeder"
                 text="Hurtig, enkel kommunikation – samlet i én indbakke." />
      </View>

      {/* CTA */}
      <View style={styles.ctaBlock}>
        <Text style={styles.ctaTitle}>Klar til at prøve Liguster?</Text>
        <View style={{ flexDirection: "row", gap: 12 }}>
          <Pressable onPress={() => router.push("/OpretBruger")} style={styles.primary}>
            <Text style={styles.primaryText}>Opret bruger</Text>
          </Pressable>
          <Link href="/Nabolag" style={styles.secondary}>Se opslag</Link>
        </View>
      </View>
    </ScrollView>
  );
}

function Feature({ title, text }: { title: string; text: string }) {
  return (
    <View style={styles.card}>
      <Text style={styles.cardTitle}>{title}</Text>
      <Text style={styles.cardText}>{text}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: 48, paddingVertical: 32 },
  hero: {
    flexDirection: "row",
    gap: 32,
    alignItems: "center",
    justifyContent: "space-between",
  },
  kicker: { color: "#86efac", fontWeight: "700", letterSpacing: 1, textTransform: "uppercase" },
  h1: { color: "white", fontSize: 40, lineHeight: 46, fontWeight: "800" },
  lead: { color: "rgba(255,255,255,0.8)", fontSize: 16 },
  actions: { flexDirection: "row", gap: 12, marginTop: 8, alignItems: "center" },
  primary: { backgroundColor: "#22c55e", paddingHorizontal: 16, paddingVertical: 10, borderRadius: 10 },
  primaryText: { color: "#0b1220", fontWeight: "800" },
  secondary: { color: "rgba(255,255,255,0.9)", fontWeight: "600", paddingVertical: 10, paddingHorizontal: 8 },
  heroImg: { width: 200, height: 200, opacity: 0.9 },

  grid: { flexDirection: "row", flexWrap: "wrap", gap: 16 },
  card: {
    flexGrow: 1,
    minWidth: 260,
    backgroundColor: "rgba(255,255,255,0.04)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
    borderRadius: 14,
    padding: 16,
  },
  cardTitle: { color: "white", fontWeight: "800", marginBottom: 6 },
  cardText: { color: "rgba(255,255,255,0.75)" },

  ctaBlock: {
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
    borderRadius: 16,
    padding: 20,
    alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.03)",
  },
  ctaTitle: { color: "white", fontSize: 22, fontWeight: "800", marginBottom: 12 },
});