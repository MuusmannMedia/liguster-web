// app/(public)/LoginScreen.web.tsx
import { Link, useRouter } from "expo-router";
import Head from "expo-router/head";
import React, { useCallback, useEffect, useState } from "react";
import { Platform, StyleSheet, Text, View } from "react-native";
import { supabase } from "../../utils/supabase";

/**
 * 🔥 RADICAL DEBUG WEB LOGIN
 *  - Huge visual changes to confirm the file is used.
 *  - Pure <form>/<input>/<button> on web to guarantee caret/focus.
 *  - Forces high z-index + pointer-events so nothing blocks clicks.
 *  - Temporarily hides footer on this route (via CSS) to avoid overlap.
 *  - Keep file valid for native by wrapping with RN <View>.
 */

export const options = { headerShown: false };

export default function LoginScreenWeb() {
  console.log("⚠️ LoginScreen.web.tsx mounted (should be lime green)");
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [err, setErr] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Make sure page can scroll and nothing disables pointer events.
    if (typeof document !== "undefined") {
      document.body.style.overflow = "auto";
      document.body.style.pointerEvents = "auto";
    }
  }, []);

  const submit = useCallback(
    async (e?: React.FormEvent) => {
      e?.preventDefault?.();
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
    },
    [email, password, router]
  );

  return (
    <>
      {/* Massive visual and CSS reset */}
      <Head>
        <title>DEBUG: NEW LOGIN</title>
        <style>{`
          html, body, #root { height: 100%; }
          body { margin: 0; background: #a3ff3c; } /* LIME GREEN BACKGROUND */
          *, *::before, *::after { box-sizing: border-box; }
          button, input { font: inherit; }
          /* Make sure nothing above blocks clicks */
          #login-root { position: relative; z-index: 9999; pointer-events: auto !important; }
          /* Try to hide the footer on this page (footer container has border-top, dark bg) */
          /* If your footer has a specific id/class, target it here instead */
          body:has(#login-root) div[style*="borderTopWidth: 1px"] { display: none !important; }
        `}</style>
      </Head>

      <View style={styles.page} id="login-root">
        <div style={debugBannerCss}>DEBUG: NEW LOGIN</div>

        <View style={styles.wrap}>
          <Link href="/" style={styles.back}>‹ Tilbage</Link>

          <View style={styles.card}>
            <Text style={styles.title}>Log ind</Text>
            {err ? <Text style={styles.error}>{err}</Text> : null}

            {Platform.OS === "web" ? (
              <form onSubmit={submit} style={{ width: "100%" }}>
                <input
                  type="email"
                  inputMode="email"
                  autoCapitalize="none"
                  autoCorrect="off"
                  autoComplete="username email"
                  placeholder="Email"
                  value={email}
                  onChange={(e) => setEmail(e.currentTarget.value)}
                  autoFocus
                  style={inputCss}
                />
                <input
                  type="password"
                  autoComplete="current-password"
                  placeholder="Password"
                  value={password}
                  onChange={(e) => setPassword(e.currentTarget.value)}
                  style={inputCss}
                />
                <button type="submit" disabled={loading} style={buttonCss}>
                  {loading ? "Logger ind…" : "LOG IND"}
                </button>
              </form>
            ) : (
              <Text style={{ color: "#111" }}>
                (Native fallback – åbnes ikke på web)
              </Text>
            )}
          </View>
        </View>
      </View>
    </>
  );
}

/* ---------- RN styles (safe for native) ---------- */
const styles = StyleSheet.create({
  page: {
    minHeight: "100vh" as any,
    // NOTE: body has lime green; card sits on white to stand out
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
  },
  wrap: {
    width: "100%",
    maxWidth: 420,
  },
  back: {
    color: "#0b1220",
    textDecorationLine: "none",
    marginBottom: 10,
    display: "inline-flex",
    fontWeight: "700",
  },
  card: {
    width: "100%",
    backgroundColor: "#ffffff",
    borderRadius: 16,
    padding: 22,
    borderWidth: 2,
    borderColor: "#0b1220",
    boxShadow: "0 10px 30px rgba(0,0,0,0.25)" as any,
  },
  title: { color: "#0b1220", fontSize: 28, fontWeight: "900", textAlign: "center", marginBottom: 16 },
  error: {
    backgroundColor: "#fee2e2",
    color: "#991b1b",
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 8,
    marginBottom: 12,
    fontSize: 14,
    borderWidth: 1,
    borderColor: "#fecaca",
  },
});

/* ---------- Inline CSS objects for the real HTML inputs ---------- */
const inputCss: React.CSSProperties = {
  width: "100%",
  height: 50,
  borderRadius: 12,
  border: "2px solid #0b1220",
  background: "#f8fafc",
  color: "#0b1220",
  padding: "0 14px",
  fontSize: 16,
  outline: "none",
  marginBottom: 12,
  boxSizing: "border-box",
};

const buttonCss: React.CSSProperties = {
  width: "100%",
  height: 52,
  borderRadius: 12,
  border: "2px solid #0b1220",
  background: "#0b1220",
  color: "#ffffff",
  fontSize: 16,
  fontWeight: 900,
  letterSpacing: 1,
  cursor: "pointer",
  marginTop: 4,
};

const debugBannerCss: React.CSSProperties = {
  position: "fixed",
  top: 10,
  left: 10,
  background: "#111",
  color: "#fff",
  padding: "6px 10px",
  borderRadius: 8,
  fontWeight: 900,
  zIndex: 10000,
};