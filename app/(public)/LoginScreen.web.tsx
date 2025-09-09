// app/(public)/LoginScreen.web.tsx
import { Link, useRouter } from "expo-router";
import React, { useCallback, useState } from "react";
import { Platform, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { supabase } from "../../utils/supabase";

// ───────────────────────────────────────────────────────────────
// WEB-FIRST LOGIN (no fixed overlays, no full-screen touchables)
// - Uses real <form> and <input> on web to guarantee focus
// - Pressing Enter submits the form
// - No positioned elements above the inputs
// ───────────────────────────────────────────────────────────────

export const options = { headerShown: false };

export default function LoginScreenWeb() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const onSubmit = useCallback(async (e?: React.FormEvent) => {
    e?.preventDefault();
    setErr(null);

    if (!email || !password) {
      setErr("Udfyld både email og password.");
      return;
    }

    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);

    if (error) {
      setErr(error.message || "Login fejlede.");
      return;
    }
    router.replace("/(protected)/Nabolag");
  }, [email, password, router]);

  return (
    <View style={styles.page}>
      <View style={styles.container}>
        <Link href="/" style={styles.backLink} accessibilityRole="link">‹ Tilbage</Link>

        <View style={styles.card}>

          <Text style={styles.title}>Log ind</Text>
          {err ? <Text style={styles.error}>{err}</Text> : null}

          {/* ── WEB: use native inputs for bullet-proof focus ───────────────── */}
          {Platform.OS === "web" ? (
            <form
              onSubmit={onSubmit}
              // make absolutely sure pointer events are not blocked
              style={{ width: "100%" }}
            >
              <input
                type="email"
                inputMode="email"
                autoCapitalize="none"
                autoCorrect="off"
                autoComplete="username email"
                placeholder="Email"
                value={email}
                onChange={(ev) => setEmail(ev.currentTarget.value)}
                autoFocus
                style={inputCss}
              />

              <input
                type="password"
                autoComplete="current-password"
                placeholder="Password"
                value={password}
                onChange={(ev) => setPassword(ev.currentTarget.value)}
                style={inputCss}
              />

              <button type="submit" disabled={loading} style={buttonCss}>
                {loading ? "Logger ind…" : "LOG IND"}
              </button>
            </form>
          ) : (
            // Native fallback (won't be used on web but keeps file valid for native)
            <TouchableOpacity onPress={onSubmit} style={styles.nativeOnlyBtn}>
              <Text style={{ color: "#171C22", fontWeight: "700" }}>
                {loading ? "Logger ind…" : "LOG IND"}
              </Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    </View>
  );
}

/* ─────────────────────────  Styles  ───────────────────────── */

const styles = StyleSheet.create({
  page: {
    // keep it scrollable and click-through
    minHeight: "100vh" as any,
    backgroundColor: "#0f1623",
    alignItems: "center",
    justifyContent: "center",
    padding: 16,
  },
  container: {
    width: "100%",
    maxWidth: 420,
  },
  backLink: {
    color: "#cbd5e1",
    textDecorationLine: "none",
    marginBottom: 10,
    display: "inline-flex",
  },
  card: {
    width: "100%",
    backgroundColor: "#0b1220",
    borderRadius: 14,
    padding: 22,
    borderWidth: 1,
    borderColor: "#1e293b",
    boxShadow: "0 6px 24px rgba(0,0,0,0.25)" as any,
  },
  title: { color: "#fff", fontSize: 26, fontWeight: "800", textAlign: "center", marginBottom: 14 },
  error: {
    backgroundColor: "#fee2e2",
    color: "#991b1b",
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 8,
    marginBottom: 12,
    fontSize: 14,
  },
  // Native placeholder button to satisfy RN compiler; not used on web.
  nativeOnlyBtn: {
    backgroundColor: "#fff",
    height: 48,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 8,
  },
});

/* ─────────────────────────  Inline CSS for <input>/<button>  ─────────────────────────
   Using inline CSS objects keeps everything in this file and avoids odd global styles.
   These are web-only (applied to real DOM elements).
*/

const inputCss: React.CSSProperties = {
  width: "100%",
  height: 48,
  borderRadius: 10,
  border: "1px solid #334155",
  background: "#ffffff",
  color: "#0b1220",
  padding: "0 14px",
  fontSize: 16,
  outline: "none",
  marginBottom: 12,
  boxSizing: "border-box",
};

const buttonCss: React.CSSProperties = {
  width: "100%",
  height: 50,
  borderRadius: 12,
  border: "none",
  background: "#ffffff",
  color: "#171C22",
  fontSize: 16,
  fontWeight: 800,
  letterSpacing: 1,
  cursor: "pointer",
  marginTop: 4,
};