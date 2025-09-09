// app/(public)/LoginScreen.web.tsx
import { Link, router } from "expo-router";
import React, { useState } from "react";
import { supabase } from "../../utils/supabase";

/* 🎨 Farver du kan ændre */
const C = {
  pageBg: "#7C8996",
  cardBg: "#0f1623",
  border: "#223",
  text: "#ffffff",
  inputBg: "#ffffff",
  inputText: "#111827",
  buttonBg: "#ffffff",
  buttonText: "#171C22",
};

export const options = { headerShown: false };

export default function LoginScreenWeb() {
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setErr(null);
    const form = new FormData(e.currentTarget);
    const email = String(form.get("email") || "").trim();
    const password = String(form.get("password") || "");
    if (!email || !password) {
      setErr("Udfyld både email og password.");
      return;
    }
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);
    if (error) {
      setErr(error.message);
      return;
    }
    router.replace("/(protected)/Nabolag");
  }

  return (
    <div style={s.page}>
      <div style={s.card}>
        <h1 style={s.title}>Log ind</h1>

        <form onSubmit={onSubmit} style={s.form} autoComplete="on">
          <label style={s.label}>
            Email
            <input
              name="email"
              type="email"
              inputMode="email"
              autoCapitalize="none"
              autoCorrect="off"
              autoComplete="email"
              required
              style={s.input}
            />
          </label>

          <label style={s.label}>
            Password
            <input
              name="password"
              type="password"
              autoComplete="current-password"
              required
              style={s.input}
            />
          </label>

          {err && <div style={s.error}>{err}</div>}

          <button type="submit" style={s.button} disabled={loading}>
            {loading ? "Logger ind…" : "LOG IND"}
          </button>
        </form>

        <div style={{ marginTop: 12 }}>
          <Link href="/" style={{ color: "#cbd5e1", textDecorationLine: "none" }}>
            ‹ Til forsiden
          </Link>
        </div>
      </div>
    </div>
  );
}

/* Ren CSS-in-JS så vi ikke rammer RNW-quirks */
const s: Record<string, React.CSSProperties> = {
  page: {
    minHeight: "calc(100vh - 64px - 60px)", // 64 topbar + 60 footer
    display: "grid",
    placeItems: "center",
    padding: 16,
    background: C.pageBg,
  },
  card: {
    width: 340,
    background: C.cardBg,
    borderRadius: 14,
    padding: 20,
    border: `1px solid ${C.border}`,
    color: C.text,
    boxShadow: "0 10px 25px rgba(0,0,0,.25)",
  },
  title: { margin: 0, marginBottom: 16, fontSize: 26, fontWeight: 800 },
  form: { display: "grid", gap: 12 },
  label: { display: "grid", gap: 6, fontSize: 13, color: "#cbd5e1" },
  input: {
    height: 46,
    borderRadius: 10,
    border: "1px solid #e5e7eb",
    padding: "0 12px",
    background: C.inputBg,
    color: C.inputText,
    fontSize: 16,
  },
  button: {
    height: 50,
    borderRadius: 12,
    border: 0,
    background: C.buttonBg,
    color: C.buttonText,
    fontWeight: 800,
    letterSpacing: 1,
    cursor: "pointer",
  },
  error: {
    color: "#fecaca",
    background: "#7f1d1d",
    border: "1px solid #ef4444",
    borderRadius: 8,
    padding: "8px 10px",
    fontSize: 13,
  },
};