// app/LoginScreen.web.tsx
import { Link, useRouter } from "expo-router";
import React, { useRef, useState } from "react";
import { Alert, StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";
import { supabase } from "../utils/supabase";

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
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);

    if (error) {
      Alert.alert("Login fejlede", error.message);
      return;
    }
    router.replace("/Nabolag");
  };

  return (
    <View style={styles.page}>
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
          placeholderTextColor="#999"
          autoCapitalize="none"
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
          placeholderTextColor="#999"
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
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  page: {
    // brug web-venligt centreringslayout uden HTML <form> og uden special-CSS
    minHeight: "100vh" as any, // RNW accepterer string-værdier på web
    backgroundColor: "#171C22",
    alignItems: "center",
    justifyContent: "center",
    padding: 16,
  },
  backRow: { position: "fixed", top: 12, left: 12 },
  backLink: { color: "#fff", fontSize: 16, textDecorationLine: "none", opacity: 0.9 },

  card: {
    width: 320,
    backgroundColor: "#0f1623",
    borderRadius: 14,
    padding: 20,
    borderWidth: 1,
    borderColor: "#223",
  },
  title: { color: "#fff", fontSize: 26, fontWeight: "700", marginBottom: 16, textAlign: "center" },
  input: {
    backgroundColor: "#fff",
    width: "100%",
    height: 48,
    borderRadius: 10,
    paddingHorizontal: 14,
    marginBottom: 14,
    fontSize: 16,
    outlineStyle: "none",
  },
  button: {
    backgroundColor: "#fff",
    borderRadius: 12,
    width: "100%",
    height: 52,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 6,
    cursor: "pointer",
  },
  buttonText: { color: "#171C22", fontSize: 16, fontWeight: "700", letterSpacing: 1 },
});