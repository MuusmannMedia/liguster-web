// app/components/WebHeader.tsx
import { Link, router } from "expo-router";
import React, { useState } from "react";
import { Text } from "react-native";
import { useSession } from "../hooks/useSession";
import { supabase } from "../utils/supabase";

export default function WebHeader() {
  const { session, loading } = useSession();
  const isAuthed = !!session;
  const [open, setOpen] = useState(false);

  const goHome = () => router.push(isAuthed ? "/(protected)/Nabolag" : "/");
  const signOut = async () => {
    try {
      await supabase.auth.signOut();
    } finally {
      router.replace("/LoginScreen");
    }
  };

  return (
    <header className="liguster-header">
      {/* brand */}
      <div className="brand" onClick={goHome} role="button" aria-label="Liguster">
        <img
          src="/Liguster-logo-website-clean.png"
          alt="LIGUSTER"
          height={28}
          style={{ display: "block" }}
          onError={(e) => {
            // fallback hvis nogen dag filnavn skifter case
            const el = e.currentTarget as HTMLImageElement;
            if (!el.dataset.fallbackTried) {
              el.dataset.fallbackTried = "1";
              el.src = "/liguster-logo-website-clean.png";
            }
          }}
        />
      </div>

      {/* DESKTOP: kun links, ingen burger */}
      <nav className="only-desktop nav-links" aria-label="Hovedmenu">
        {!loading && (
          isAuthed ? (
            <>
              <Link href="/(protected)/Nabolag" className="nav-link">Nabolag</Link>
              <Link href="/(protected)/ForeningerScreen" className="nav-link">Forening</Link>
              <Link href="/(protected)/Beskeder" className="nav-link">Beskeder</Link>
              <Link href="/(protected)/MineOpslag" className="nav-link">Mine Opslag</Link>
              <Link href="/(protected)/MigScreen" className="nav-link">Mig</Link>
              <button className="btn" onClick={signOut}><Text style={{ fontWeight: "700" }}>Log ud</Text></button>
            </>
          ) : (
            <button className="btn" onClick={() => router.push("/LoginScreen")}>
              <Text style={{ fontWeight: "700" }}>Log ind</Text>
            </button>
          )
        )}
      </nav>

      {/* MOBIL: kun burger (ingen links synlige) */}
      <div className="only-mobile mobile-wrap">
        <button
          className="burger"
          aria-label={open ? "Luk menu" : "Åbn menu"}
          onClick={() => setOpen(v => !v)}
        >
          ☰
        </button>

        {open && (
          <div className="mobile-menu" role="menu">
            {!loading && (
              isAuthed ? (
                <>
                  <Link href="/(protected)/Nabolag" className="menu-item" onClick={() => setOpen(false)}>Nabolag</Link>
                  <Link href="/(protected)/ForeningerScreen" className="menu-item" onClick={() => setOpen(false)}>Forening</Link>
                  <Link href="/(protected)/Beskeder" className="menu-item" onClick={() => setOpen(false)}>Beskeder</Link>
                  <Link href="/(protected)/MineOpslag" className="menu-item" onClick={() => setOpen(false)}>Mine Opslag</Link>
                  <Link href="/(protected)/MigScreen" className="menu-item" onClick={() => setOpen(false)}>Mig</Link>
                  <button className="menu-cta" onClick={() => { setOpen(false); signOut(); }}>Log ud</button>
                </>
              ) : (
                <button className="menu-cta" onClick={() => { setOpen(false); router.push("/LoginScreen"); }}>
                  Log ind
                </button>
              )
            )}
          </div>
        )}
      </div>

      {/* CSS kun for web */}
      <style>{`
        .liguster-header{
          height:64px; background:#0b1220; border-bottom:1px solid #1e293b;
          padding:0 16px; display:flex; align-items:center; justify-content:space-between; position:relative; z-index:100;
        }
        .brand{ height:28px; display:flex; align-items:center; cursor:pointer; }
        .nav-links{ display:flex; align-items:center; gap:18px; }
        .nav-link{ color:#e2e8f0; text-decoration:none; font-size:14px; opacity:.9 }
        .nav-link:hover{ opacity:1 }
        .btn{ padding:8px 12px; border:1px solid #334155; border-radius:10px; background:#0f172a; color:#e2e8f0; cursor:pointer }
        .mobile-wrap{ position:relative; display:flex; align-items:center; }
        .burger{ border:1px solid #334155; border-radius:10px; padding:6px 10px; background:#0f172a; color:#e2e8f0; font-weight:900; font-size:16px; cursor:pointer }
        .mobile-menu{
          position:absolute; right:0; top:52px; min-width:220px; background:#0b1220; border:1px solid #1e293b;
          border-radius:12px; padding:8px; box-shadow:0 8px 20px rgba(0,0,0,.35);
        }
        .menu-item{ display:block; padding:10px 12px; color:#e2e8f0; text-decoration:none; font-size:14px }
        .menu-item:hover{ background:#0f172a }
        .menu-cta{ margin-top:6px; width:100%; padding:10px 12px; border-radius:10px; background:#fff; color:#0b1220; font-weight:900; border:0; cursor:pointer }
        /* RESPONSIVE: vælg præcis én af dem på skærmen */
        .only-mobile{ display:none; }
        .only-desktop{ display:flex; }
        @media (max-width: 719px){
          .only-mobile{ display:block; }
          .only-desktop{ display:none !important; }
        }
      `}</style>
    </header>
  );
}