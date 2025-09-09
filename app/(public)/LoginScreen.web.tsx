// app/(public)/LoginScreen.web.tsx
import Head from "expo-router/head";
import { useRouter, Link } from "expo-router";
import React, { useCallback, useEffect, useRef, useState } from "react";
import { supabase } from "../../utils/supabase";

// ⚠️ BIG VISIBLE VERSION TAG so we can verify this file is actually live:
const BUILD_TAG = "WEB-LOGIN v7 (pure HTML form)";

export const options = { headerShown: false };

export default function LoginScreenWeb() {
  const router = useRouter();
  const emailRef = useRef<HTMLInputElement>(null);
  const passRef  = useRef<HTMLInputElement>(null);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    // Ensure page can scroll and that no parent disables pointer events.
    document.documentElement.style.overflow = "auto";
    document.body.style.overflow = "auto";
    document.body.style.pointerEvents = "auto";

    // If *anything* tries to overlay, we still want our form clickable:
    const root = document.getElementById("__next") || document.body;
    (root as HTMLElement).style.pointerEvents = "auto";

    // Focus email on mount
    emailRef.current?.focus();
  }, []);

  const submit = useCallback(async (e?: React.FormEvent) => {
    e?.preventDefault();
    setErr(null);

    if (!email || !password) {
      setErr("Udfyld både email og password.");
      return;
    }

    try {
      setLoading(true);
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;
      router.replace("/(protected)/Nabolag");
    } catch (ex: any) {
      setErr(ex?.message ?? "Kunne ikke logge ind.");
    } finally {
      setLoading(false);
    }
  }, [email, password, router]);

  return (
    <div style={styles.page}>
      <Head>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        {/* Cache-buster to avoid stale bundles while we debug */}
        <meta httpEquiv="Cache-Control" content="no-store" />
      </Head>

      {/* Debug banner so we *see* that this file is being used */}
      <div style={styles.debugBanner}>
        <span>{BUILD_TAG}</span>
        <a href="/" style={styles.backLink}>‹ Til forsiden</a>
      </div>

      <form
        onSubmit={submit}
        // High z-index + explicit pointer events guarantees clicks reach inputs
        style={styles.card}
      >
        <h1 style={styles.title}>Log ind</h1>

        {err ? <div style={styles.error}>{err}</div> : null}

        <label htmlFor="email" style={styles.label}>Email</label>
        <input
          id="email"
          ref={emailRef}
          type="email"
          inputMode="email"
          autoComplete="username"
          placeholder="you@email.dk"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          style={styles.input}
        />

        <label htmlFor="password" style={styles.label}>Password</label>
        <input
          id="password"
          ref={passRef}
          type="password"
          autoComplete="current-password"
          placeholder="••••••••"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          style={styles.input}
        />

        <button type="submit" disabled={loading} style={styles.button}>
          {loading ? "Logger ind…" : "LOG IND"}
        </button>

        <div style={styles.footerRow}>
          <Link href="/" style={styles.footerLink}>‹ Tilbage</Link>
        </div>
      </form>
    </div>
  );
}

/* Inline CSS-in-JS: dead simple, web-native, with defensive z-index/pointerEvents.
   Change colors here while debugging so it’s obvious which build is live. */
const styles: Record<string, React.CSSProperties> = {
  page: {
    minHeight: "100vh",
    background: "#0f1623",        // page bg
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
  },
  debugBanner: {
    position: "fixed",
    top: 72,
    left: 24,
    background: "#22c55e",
    color: "#0b1220",
    fontWeight: 900,
    padding: "6px 10px",
    borderRadius: 10,
    zIndex: 9999,
    display: "flex",
    gap: 12,
    alignItems: "center",
    boxShadow: "0 6px 18px rgba(0,0,0,0.25)",
    pointerEvents: "auto", // clickable
  },
  backLink: {
    color: "#0b1220",
    textDecoration: "underline",
    fontWeight: 800,
  },
  card: {
    width: 360,
    maxWidth: "90vw",
    background: "#0b1220",
    border: "1px solid #223",
    borderRadius: 16,
    padding: 20,
    boxShadow: "0 12px 40px rgba(0,0,0,0.35)",
    zIndex: 1000,
    pointerEvents: "auto",
  },
  title: {
    color: "#fff",
    textAlign: "center" as const,
    fontSize: 26,
    fontWeight: 800,
    margin: "2px 0 14px",
  },
  label: {
    color: "#cbd5e1",
    fontSize: 12,
    fontWeight: 700,
    marginBottom: 6,
    display: "block",
  },
  input: {
    width: "100%",
    height: 48,
    borderRadius: 12,
    border: "1px solid #e5e8ec",
    background: "#fff",
    color: "#0b1220",
    padding: "0 14px",
    marginBottom: 14,
    fontSize: 16,
    outline: "none",
    WebkitAppearance: "none",
    appearance: "none",
    boxShadow: "inset 0 0 0 1px transparent",
  },
  button: {
    width: "100%",
    height: 52,
    borderRadius: 14,
    border: "0",
    background: "#fff",
    color: "#0b1220",
    fontWeight: 900,
    letterSpacing: 1,
    cursor: "pointer",
    marginTop: 2,
  },
  error: {
    background: "#fecaca",
    color: "#7f1d1d",
    border: "1px solid #ef4444",
    padding: "8px 10px",
    borderRadius: 10,
    marginBottom: 12,
    fontSize: 13,
    fontWeight: 700,
  },
  footerRow: {
    marginTop: 10,
    display: "flex",
    justifyContent: "center",
  },
  footerLink: {
    color: "#9fb3ff",
    textDecoration: "underline",
    fontWeight: 700,
    fontSize: 13,
  },
};