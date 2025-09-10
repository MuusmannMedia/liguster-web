// app/(public)/_layout.web.tsx
import { Slot } from "expo-router";
import React, { useEffect, useMemo, useState } from "react";

export default function PublicWebLayout() {
  const [isMobile, setIsMobile] = useState<boolean>(() => {
    if (typeof window === "undefined") return false;
    return window.innerWidth <= 719;
  });

  useEffect(() => {
    if (typeof window === "undefined") return;
    const mq = window.matchMedia("(max-width: 719px)");
    const handler = (e: MediaQueryListEvent | MediaQueryList) =>
      setIsMobile("matches" in e ? e.matches : (e as MediaQueryList).matches);
    handler(mq);
    mq.addEventListener?.("change", handler as (e: MediaQueryListEvent) => void);
    return () => mq.removeEventListener?.("change", handler as (e: MediaQueryListEvent) => void);
  }, []);

  const [menuOpen, setMenuOpen] = useState(false);

  const Logo = useMemo(
    () => (
      <a className="brand" href="/">
        <img
          src="/liguster-logo-website-clean.png"
          alt="Liguster"
          height={28}
          onError={(e) => {
            const el = e.currentTarget as HTMLImageElement;
            if (!el.dataset.triedFallback) {
              el.dataset.triedFallback = "1";
              el.src = "/Liguster-logo-website-clean.png";
            } else {
              el.style.display = "none";
              const txt = el.nextElementSibling as HTMLSpanElement | null;
              if (txt) txt.style.display = "inline-block";
            }
          }}
        />
        <span style={{ display: "none", color: "#e2e8f0", fontWeight: 800, letterSpacing: 1 }}>
          LIGUSTER
        </span>
      </a>
    ),
    []
  );

  return (
    <div style={styles.page}>
      <style>{baseCss}</style>

      <nav className="nav">
        {Logo}

        {!isMobile ? (
          <div className="right">
            <a className="btn" href="/LoginScreen">Log ind</a>
          </div>
        ) : (
          <div className="burgerWrap">
            <button className="burger" aria-label="Åbn menu" onClick={() => setMenuOpen((v) => !v)}>
              ☰
            </button>
            {menuOpen && (
              <div className="menu" onClick={() => setMenuOpen(false)}>
                <a className="logout" href="/LoginScreen">Log ind</a>
              </div>
            )}
          </div>
        )}
      </nav>

      <Slot />
    </div>
  );
}

const baseCss = `
  .nav { height:64px; background:#0b1220; border-bottom:1px solid #1e293b;
         padding:0 24px; display:flex; align-items:center; justify-content:space-between;
         position:sticky; top:0; z-index:100; }
  .brand { display:flex; align-items:center; gap:10px; text-decoration:none; }
  .right { display:flex; align-items:center; gap:16px; }
  .btn  { padding:8px 12px; border:1px solid #334155; border-radius:10px;
          color:#e2e8f0; text-decoration:none; font-weight:700; }
  .burgerWrap { position:relative; }
  .burger { padding:6px 10px; border:1px solid #334155; border-radius:10px;
            background:#0f172a; color:#e2e8f0; font-weight:900; }
  .menu { position:absolute; right:0; top:44px; min-width:220px; background:#0b1220;
          border:1px solid #1e293b; border-radius:12px; padding:8px; box-shadow:0 6px 16px rgba(0,0,0,.25); }
  .logout { display:block; margin:6px 8px 2px; text-align:center; padding:10px 12px;
            border-radius:10px; background:#fff; color:#0b1220; font-weight:900; text-decoration:none; }
`;

const styles = {
  page: { flex: 1, backgroundColor: "#7C8996", minHeight: "100vh" } as React.CSSProperties,
};