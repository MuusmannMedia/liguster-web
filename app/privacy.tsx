import Constants from "expo-constants";
import { useRouter } from "expo-router";
import * as WebBrowser from "expo-web-browser";
import React from "react";
import {
    Platform,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";

export default function PrivacyPolicy() {
  const router = useRouter();
  // Fallback inkl. trailing slash:
  const privacyUrl =
    (Constants.expoConfig?.extra as any)?.privacyUrl ||
    "https://www.liguster-app.dk/privacy/";

  const openFullPolicy = async () => {
    try {
      await WebBrowser.openBrowserAsync(privacyUrl, {
        // pænt toolbar-tema; ignoreres hvor ikke understøttet
        toolbarColor: "#131921",
        enableBarCollapsing: true,
        presentationStyle: WebBrowser.WebBrowserPresentationStyle.FULL_SCREEN,
      });
    } catch {
      // Hvis noget går galt, lader vi routeren prøve (web)
      if (Platform.OS === "web") window.location.href = privacyUrl;
    }
  };

  return (
    <View style={styles.root}>
      {Platform.OS !== "web" && (
        <View style={styles.topBar}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <Text style={styles.backText}>‹ Tilbage</Text>
          </TouchableOpacity>
        </View>
      )}

      <ScrollView style={styles.scroll} contentContainerStyle={styles.container}>
        <Text style={styles.title}>Privacy Policy for Liguster</Text>
        <Text style={styles.updated}>Last updated: August 04, 2025</Text>

        <Text style={styles.paragraph}>
          This Privacy Policy describes Our policies and procedures on the
          collection, use and disclosure of Your information when You use the
          Service and tells You about Your privacy rights and how the law
          protects You.
        </Text>

        <Text style={styles.paragraph}>
          We use Your Personal data to provide and improve the Service. By using
          the Service, You agree to the collection and use of information in
          accordance with this Privacy Policy.
        </Text>

        <Text style={styles.section}>Contact</Text>
        <Text style={styles.paragraph}>
          If you have any questions, contact us by email:
          {" "}kontakt@liguster-app.dk
        </Text>

        <TouchableOpacity onPress={openFullPolicy}>
          <Text style={styles.link}>
            Læs den fulde politik på liguster-app.dk/privacy
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: "#171C22" },
  scroll: { flex: 1 },
  container: { padding: 20, paddingBottom: 40 },
  topBar: {
    paddingTop: 50,
    paddingHorizontal: 16,
    paddingBottom: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "#333",
  },
  backBtn: { paddingVertical: 6 },
  backText: { color: "#fff", fontSize: 16, fontWeight: "600" },

  title: { fontSize: 22, fontWeight: "700", marginBottom: 10, color: "#fff" },
  updated: { fontSize: 14, color: "#bbb", marginBottom: 20 },
  section: { fontSize: 18, fontWeight: "600", marginTop: 20, marginBottom: 8, color: "#fff" },
  paragraph: { fontSize: 14, color: "#ddd", marginBottom: 14, lineHeight: 20 },
  link: { fontSize: 14, color: "#93c5fd", textDecorationLine: "underline", marginTop: 16 },
});