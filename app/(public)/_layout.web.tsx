// app/(public)/_layout.web.tsx
import { Slot } from "expo-router";
import React, { useState } from "react";

/**
 * Web-only layout for public routes.
 * Same responsive header behavior as protected, but with "Log ind".
 */
export default function PublicWebLayout() {
  const [open, setOpen] = useState(false);

  return (
    <div style={styles.page}>
      <style>{css}</style>

      <nav className="nav">
        <a className="brand" href="/">
          <img
            src="/liguster-logo-website-clean.png"
            alt="Liguster"
            height={28}
            onError={(e) => {
              const el = e.currentTarget as HTMLImageElement;
              if (!el.dataset.triedfallback) {
                el.dataset.triedfallback = "1";
                el.src = "/Liguster-logo-website-clean.png";
              }
            }}
          />
        </a>

        {/* Desktop: show "Log ind" */}
        <div className="desktop-only right">
          <a className="btn" href="/LoginScreen">Log ind</a>
        </div>

        {/* Mobile: burger -> only "Log ind" */}
        <div className="mobile-only burger-wrap">
          <button className="burger" aria-label="Åbn menu" onClick={() => setOpen(v => !v)}>
            ☰
          </button>

          {open && (
            <div className="menu" onClick={() => setOpen(false)}>
              <a className="logout" href="/LoginScreen">Log ind</a>
            </div>
          )}
        </div>
      </nav>

      <Slot />
    </div>
  );
}

const css = `
  .nav {
    height: 64px;
    background:#0b1220;
    border-bottom:1px solid #1e293b;
    padding:0 24px;
    display:flex;
    align-items:center;
    justify-content:space-between;
    position:sticky; top:0; z-index:100;
  }
  .brand { display:flex; align-items:center; gap:10px; text-decoration:none; }
  .right { display:flex; align-items:center; gap:16px; }
  .btn { padding:8px 12px; border:1px solid #334155; border-radius:10px; color:#e2e8f0; text-decoration:none; font-weight:700; }
  .burger-wrap { position:relative; }
  .burger { padding:6px 10px; border:1px solid #334155; border-radius:10px; background:#0f172a; color:#e2e8f0; font-weight:900; }
  .menu {
    position:absolute; right:0; top:44px; min-width:220px;
    background:#0b1220; border:1px solid #1e293b; border-radius:12px; padding:8px;
    box-shadow:0 6px 16px rgba(0,0,0,.25);
  }
  .logout { display:block; margin:2px 8px; text-align:center; padding:10px 12px; border-radius:10px; background:#fff; color:#0b1220; font-weight:900; text-decoration:none; }

  .desktop-only { display:flex; }
  .mobile-only { display:none; }
  @media (max-width: 719px) {
    .desktop-only { display:none; }
    .mobile-only { display:block; }
  }
`;

const styles = {
  page: { flex: 1, backgroundColor: "#7C8996", minHeight: "100vh" } as React.CSSProperties,
};