// app/(public)/LoginScreen.web.tsx
import { Link, useRouter } from "expo-router";
import React, { useRef, useState } from "react";
import {
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { supabase } from "../../utils/supabase";

export const options = { headerShown: false };

export default function LoginScreenWeb() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const passwordRef = useRef<TextInput>(null);

  const onLogin = async () => {
    if (!email || !password) {
      Alert.alert("Fejl", "Udfyld både email og password.");
      return;
    }
    try {
      setLoading(true);
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;
      router.replace("/(protected)/Nabolag");
    } catch (e: any) {
      Alert.alert("Login fejlede", e?.message ?? "Ukendt fejl");
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.page}>
      {/* ScrollView sikrer både scroll og korrekt klik/fokus på web */}
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.container}
        keyboardShouldPersistTaps="always"
      >
        {/* “Tilbage” i normal flow (ingen fixed overlay der kan stjæle klik) */}
        <View style={styles.backRow}>
          <Link href="/" style={styles.backLink} accessibilityRole="link">
            ‹ Tilbage
          </Link>
        </View>

        <View style={styles.card}>
          <Text style={styles.title}>Log ind</Text>

          <TextInput
            style={styles.input}
            placeholder="Email"
            placeholderTextColor={THEME.mutedText}
            autoCapitalize="none"
            autoCorrect={false}
            keyboardType="email-address"
            textContentType="username"
            value={email}
            onChangeText={setEmail}
            autoFocus
            returnKeyType="next"
            onSubmitEditing={() => passwordRef.current?.focus()}
          />

          <TextInput
            ref={passwordRef}
            style={styles.input}
            placeholder="Password"
            placeholderTextColor={THEME.mutedText}
            secureTextEntry
            textContentType="password"
            value={password}
            onChangeText={setPassword}
            returnKeyType="go"
            onSubmitEditing={onLogin}
          />

          <TouchableOpacity style={styles.button} onPress={onLogin} disabled={loading}>
            <Text style={styles.buttonText}>
              {loading ? "Logger ind…" : "LOG IND"}
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
}

/* ─────────────  TEMA: skift farver her  ───────────── */
const THEME = {
  // Side-/baggrundsfarve
  pageBg: "#7C8996",

  // Kort (boksen omkring login)
  cardBg: "#0b1220",
  cardBorder: "#1f2937",

  // Input
  inputBg: "#ffffff",
  mutedText: "#6b7280",

  // Tekst
  titleText: "#e5e7eb",

  // Knappen
  btnBg: "#ffffff",
  btnText: "#0b1220",

  // Links
  link: "#ffffff",
  linkMuted: "#e5e7eb",
};

const styles = StyleSheet.create({
  page: {
    flex: 1,
    backgroundColor: THEME.pageBg, // ← BAGGRUND
  },
  scroll: {
    flex: 1,
  },
  container: {
    minHeight: "100vh" as any, // gør den fuld højde og tillader pæn scroll
    padding: 24,
    alignItems: "center",
    justifyContent: "center",
    gap: 16,
  },

  backRow: { width: "100%", maxWidth: 420 },
  backLink: {
    color: THEME.link,
    opacity: 0.9,
    textDecorationLine: "none",
    marginBottom: 4,
    fontSize: 16,
  },

  card: {
    width: "100%",
    maxWidth: 420,
    backgroundColor: THEME.cardBg,
    borderWidth: 1,
    borderColor: THEME.cardBorder,
    borderRadius: 16,
    padding: 20,

    // subtil skygge
    shadowColor: "#000",
    shadowOpacity: 0.25,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 10 },
    elevation: 6,
  },

  title: {
    color: THEME.titleText,
    fontSize: 26,
    fontWeight: "800",
    marginBottom: 16,
    textAlign: "center",
  },

  input: {
    backgroundColor: THEME.inputBg,
    width: "100%",
    height: 48,
    borderRadius: 10,
    paddingHorizontal: 14,
    marginBottom: 14,
    fontSize: 16,

    // RN-web: tydelig fokusramme i browseren
    outlineStyle: "auto" as any,
  },

  button: {
    backgroundColor: THEME.btnBg,
    borderRadius: 12,
    width: "100%",
    height: 52,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 6,
    cursor: "pointer",
  },
  buttonText: {
    color: THEME.btnText,
    fontSize: 16,
    fontWeight: "800",
    letterSpacing: 0.5,
  },
});