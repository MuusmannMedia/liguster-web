// app/(public)/LoginScreen.web.tsx
import { Link, useRouter } from "expo-router";
import Head from "expo-router/head";
import React, { useCallback, useEffect, useRef, useState } from "react";
import { supabase } from "../../utils/supabase";

export const options = { headerShown: false };

export default function LoginScreenWeb() {
  const router = useRouter();

  const emailRef = useRef<HTMLInputElement>(null);
  const passRef  = useRef<HTMLInputElement>(null);

  const [email, setEmail]       = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading]   = useState(false);
  const [err, setErr]           = useState<string | null>(null);
  const [showPw, setShowPw]     = useState(false);

  useEffect(() => {
    // Sikr at intet forhindrer scroll/klik
    document.documentElement.style.overflow = "auto";
    document.body.style.overflow = "auto";
    document.body.style.pointerEvents = "auto";
    // Fokus i email-felt ved load
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
        {/* lille cache-buster i udvikling */}
        <meta httpEquiv="Cache-Control" content="no-store" />
        <title>Log ind • Liguster</title>
      </Head>

      <form onSubmit={submit} style={styles.card}>
        <h1 style={styles.title}>Log ind</h1>

        {err ? <div style={styles.error}>{err}</div> : null}

        <label htmlFor="email" style={styles.label}>Email</label>
        <input
          id="email"
          ref={emailRef}
          type="email"
          inputMode="email"
          autoComplete="username"
          placeholder="dig@email.dk"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          style={styles.input}
        />

        <label htmlFor="password" style={styles.label}>Password</label>
        <div style={styles.pwRow}>
          <input
            id="password"
            ref={passRef}
            type={showPw ? "text" : "password"}
            autoComplete="current-password"
            placeholder="••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            style={{ ...styles.input, marginBottom: 0, flex: 1 }}
          />
          <button
            type="button"
            onClick={() => setShowPw(s => !s)}
            style={styles.togglePw}
            aria-label={showPw ? "Skjul password" : "Vis password"}
          >
            {showPw ? "Skjul" : "Vis"}
          </button>
        </div>

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

/* ───────────────────────── Tema & Styles ─────────────────────────
   Skift farver her – resten af styles læser fra THEME.
*/
const THEME = {
  // Baggrund (lækker lys blågrå som ønsket)
  pageBg: "#7C8996",

  // Kort (loginkortet)
  cardBg: "#0b1220",
  cardBorder: "#1D2A38",

  // Tekst
  text: "#FFFFFF",
  sub: "#cbd5e1",

  // Input
  inputBg: "#FFFFFF",
  inputBorder: "#e5e8ec",
  inputText: "#0b1220",
  inputPlaceholder: "#6b7280",

  // Knap
  btnBg: "#FFFFFF",
  btnText: "#0b1220",

  // Fejl
  errBg: "#FEE2E2",
  errText: "#7f1d1d",
  errBorder: "#ef4444",
};

const styles: Record<string, React.CSSProperties> = {
  page: {
    minHeight: "100vh",           // lader vinduet scrolle frit
    background: THEME.pageBg,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
    // en diskret “papir”-effekt
    backgroundImage:
      "radial-gradient(ellipse at top, rgba(255,255,255,0.14), transparent 60%)",
  },

  card: {
    width: 380,
    maxWidth: "92vw",
    background: THEME.cardBg,
    border: `1px solid ${THEME.cardBorder}`,
    borderRadius: 16,
    padding: 22,
    boxShadow: "0 14px 40px rgba(0,0,0,0.35)",
  },

  title: {
    color: THEME.text,
    textAlign: "center" as const,
    fontSize: 26,
    fontWeight: 800,
    margin: "4px 0 16px",
    letterSpacing: 0.2,
  },

  label: {
    color: THEME.sub,
    fontSize: 12,
    fontWeight: 700,
    marginBottom: 6,
    display: "block",
  },

  input: {
    width: "100%",
    height: 48,
    borderRadius: 12,
    border: `1px solid ${THEME.inputBorder}`,
    background: THEME.inputBg,
    color: THEME.inputText,
    padding: "0 14px",
    marginBottom: 14,
    fontSize: 16,
    outline: "none",
  },

  pwRow: {
    display: "flex",
    gap: 8,
    alignItems: "center",
    marginBottom: 14,
  },

  togglePw: {
    height: 48,
    padding: "0 12px",
    borderRadius: 12,
    border: `1px solid ${THEME.inputBorder}`,
    background: "#f3f4f6",
    color: "#111827",
    fontWeight: 800,
    cursor: "pointer",
  },

  button: {
    width: "100%",
    height: 52,
    borderRadius: 14,
    border: "0",
    background: THEME.btnBg,
    color: THEME.btnText,
    fontWeight: 900,
    letterSpacing: 1,
    cursor: "pointer",
    marginTop: 4,
  },

  error: {
    background: THEME.errBg,
    color: THEME.errText,
    border: `1px solid ${THEME.errBorder}`,
    padding: "8px 10px",
    borderRadius: 10,
    marginBottom: 12,
    fontSize: 13,
    fontWeight: 700,
  },

  footerRow: {
    marginTop: 12,
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