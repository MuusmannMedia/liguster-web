// app/privacy.tsx
import { useRouter } from "expo-router";
import React from "react";
import { Linking, Platform, ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";

const PRIVACY_URL = "https://www.liguster-app.dk/privacy";

export default function PrivacyPolicy() {
  const router = useRouter();

  const Content = (
    <>
      {/* Web: “vis på web”-link + Native: tilbage-knap */}
      <View style={styles.topBar}>
        {Platform.OS !== "web" ? (
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <Text style={styles.backText}>‹ Tilbage</Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity
            onPress={() => Linking.openURL(PRIVACY_URL)}
            style={styles.webLinkBtn}
          >
            <Text style={styles.webLinkText}>Åbn fuld privatlivspolitik på liguster-app.dk</Text>
          </TouchableOpacity>
        )}
      </View>

      <View style={styles.inner}>
        <Text style={styles.title}>Privacy Policy for Liguster</Text>
        <Text style={styles.updated}>Last updated: August 04, 2025</Text>

        <Text style={styles.paragraph}>
          This Privacy Policy describes Our policies and procedures on the collection, use and
          disclosure of Your information when You use the Service and tells You about Your
          privacy rights and how the law protects You.
        </Text>

        <Text style={styles.paragraph}>
          We use Your Personal data to provide and improve the Service. By using the Service,
          You agree to the collection and use of information in accordance with this Privacy
          Policy.
        </Text>

        <Text style={styles.section}>Contact</Text>
        <Text style={styles.paragraph}>
          If you have any questions, contact us by email: morten.muusmann@gmail.com
        </Text>

        {/* Eksplicit link i teksten (begge platforme) */}
        <TouchableOpacity onPress={() => Linking.openURL(PRIVACY_URL)} style={styles.inlineLinkBtn}>
          <Text style={styles.inlineLinkText}>Læs den fulde politik på liguster-app.dk/privacy</Text>
        </TouchableOpacity>
      </View>
    </>
  );

  // Native: behold ScrollView; Web: brug View for at undgå nested scroll issue
  if (Platform.OS === "web") {
    return <View style={[styles.root, styles.rootWeb]}>{Content}</View>;
  }
  return (
    <View style={styles.root}>
      <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent}>
        {Content}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: "#171C22" },
  rootWeb: { minHeight: "100vh" }, // gør siden synlig på web
  scroll: { flex: 1 },
  scrollContent: { paddingBottom: 40 },
  topBar: {
    paddingTop: 50,
    paddingHorizontal: 16,
    paddingBottom: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "#333",
  },
  backBtn: { paddingVertical: 6 },
  backText: { color: "#fff", fontSize: 16, fontWeight: "600" },

  webLinkBtn: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    alignSelf: "flex-start",
    backgroundColor: "#0b1220",
    borderWidth: 1,
    borderColor: "#2b3445",
    borderRadius: 10,
  },
  webLinkText: { color: "#cbd5e1", fontSize: 13, fontWeight: "700" },

  inner: { padding: 20 },
  title: { fontSize: 22, fontWeight: "700", marginBottom: 10, color: "#fff" },
  updated: { fontSize: 14, color: "#bbb", marginBottom: 20 },
  section: { fontSize: 18, fontWeight: "600", marginTop: 20, marginBottom: 8, color: "#fff" },
  paragraph: { fontSize: 14, color: "#ddd", marginBottom: 14, lineHeight: 20 },

  inlineLinkBtn: { marginTop: 8 },
  inlineLinkText: { color: "#93c5fd", textDecorationLine: "underline", fontSize: 14, fontWeight: "600" },
});