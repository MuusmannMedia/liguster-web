// app/privacy.tsx
import { useRouter } from "expo-router";
import React from "react";
import { Linking, Platform, ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";

export default function PrivacyPolicy() {
  const router = useRouter();

  return (
    <View style={styles.root}>
      {/* Tilbage-knap kun i native app */}
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

        {/* Nyt link til websiden */}
        <TouchableOpacity
          onPress={() => Linking.openURL("https://liguster-app.dk/privacy")}
          style={styles.linkBtn}
        >
          <Text style={styles.linkText}>👉 Læs den fulde Privacy Policy på websiden</Text>
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

  linkBtn: { marginTop: 20 },
  linkText: { fontSize: 15, color: "#4da6ff", textDecorationLine: "underline" },
});