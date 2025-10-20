'use client';

import { useState } from 'react';
import { supabase } from '@/lib/supabase-browser';
import { useRouter } from 'next/navigation';

export default function LoginPage() {
  const r = useRouter();
  const [email, setEmail] = useState('');
  const [pw, setPw] = useState('');
  const [busy, setBusy] = useState(false);

  async function onLogin(e: React.FormEvent) {
    e.preventDefault();
    if (!email || !pw) return;

    setBusy(true);
    const { error } = await supabase.auth.signInWithPassword({ email: email.trim().toLowerCase(), password: pw });
    setBusy(false);
    if (error) return alert(error.message);
    r.replace('/(protected)/opslag');
  }

  async function onForgot() {
    const addr = prompt('Skriv din e-mail for nulstilling:', email);
    if (!addr) return;
    const { error } = await supabase.auth.resetPasswordForEmail(addr.trim().toLowerCase(), {
      // Web flow: vi bliver her på web (ingen deep link nødvendig)
      redirectTo: `${location.origin}/(public)/reset`
    });
    if (error) console.log(error.message);
    alert('Hvis adressen findes, har vi sendt et link til at nulstille adgangskoden.');
  }

  return (
    <main style={{ minHeight: '100vh', display: 'grid', placeItems: 'center', padding: 24 }}>
      <form onSubmit={onLogin} style={{ background: '#0f172a', borderRadius: 12, padding: 20, width: 340 }}>
        <h2 style={{ marginTop: 0 }}>Log ind</h2>
        <input placeholder="E-mail" value={email} onChange={e=>setEmail(e.target.value)}
          style={{ width: '100%', height: 44, borderRadius: 8, marginBottom: 10, padding: '0 12px' }} />
        <input placeholder="Adgangskode" type="password" value={pw} onChange={e=>setPw(e.target.value)}
          style={{ width: '100%', height: 44, borderRadius: 8, marginBottom: 14, padding: '0 12px' }} />
        <button disabled={busy} style={{ width: '100%', height: 44, borderRadius: 999, fontWeight: 700 }}>
          {busy ? 'Logger ind…' : 'Log ind'}
        </button>
        <p style={{ marginTop: 12 }}>
          <button type="button" onClick={onForgot} style={{ background: 'none', color: '#cfe2ff', border: 0, padding: 0, fontWeight: 700, cursor: 'pointer' }}>
            Glemt adgangskode?
          </button>
        </p>
      </form>
    </main>
  );
}