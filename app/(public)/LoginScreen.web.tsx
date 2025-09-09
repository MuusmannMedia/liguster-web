// app/(public)/LoginScreen.web.tsx
import { useRouter } from "expo-router";
import React, { useRef, useState } from "react";
import { Alert, StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";
import { supabase } from "../../utils/supabase";

/**
 * HELT MINIMAL WEB-LOGIN
 * - Ingen ScrollView
 * - Ingen Link/Touchable udenfor kortet
 * - Ingen fixed/absolute/sticky elementer
 * - Intet KeyboardDismiss
 * - Fokus venligt (outline synlig)
 *
 * Farver kan ændres her i THEME.
 */
const THEME = {
  pageBg: "#7C8996",   // ← baggrund
  cardBg: "#0b1220",
  cardBorder: "#1f2937",
  titleText: "#e5e7eb",
  inputBg: "#ffffff",
  placeholder: "#6b7280",
  btnBg: "#ffffff",
  btnText: "#0b1220",
  link: "#e5e7eb",
};

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
    <View style={styles.page} /* INGEN pointerEvents her */>
      <View style={styles.card} /* INGEN absolute/fixed her */>
        <Text style={styles.title}>Log ind</Text>

        <TextInput
          style={styles.input}
          placeholder="Email"
          placeholderTextColor={THEME.placeholder}
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
          placeholderTextColor={THEME.placeholder}
          secureTextEntry
          textContentType="password"
          value={password}
          onChangeText={setPassword}
          returnKeyType="go"
          onSubmitEditing={onLogin}
        />

        <TouchableOpacity style={styles.button} onPress={onLogin} disabled={loading}>
          <Text style={styles.buttonText}>{loading ? "Logger ind…" : "LOG IND"}</Text>
        </TouchableOpacity>

        <TouchableOpacity onPress={() => router.replace("/")} style={{ marginTop: 14 }}>
          <Text style={styles.backLink}>‹ Til forsiden</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  page: {
    flex: 1,
    backgroundColor: THEME.pageBg,
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
  },
  card: {
    width: "100%",
    maxWidth: 420,
    backgroundColor: THEME.cardBg,
    borderWidth: 1,
    borderColor: THEME.cardBorder,
    borderRadius: 16,
    padding: 20,

    // let skygge
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

    // VIGTIGT PÅ WEB: lad browseren vise focus-ring
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
  backLink: {
    color: THEME.link,
    textAlign: "center",
    textDecorationLine: "none",
    opacity: 0.9,
    fontSize: 14,
  },
});