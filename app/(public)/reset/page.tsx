'use client';

import { useEffect, useRef, useState } from 'react';
import { supabase } from '@/lib/supabase-browser';
import { useRouter, useSearchParams } from 'next/navigation';

export default function ResetPage() {
  const r = useRouter();
  const sp = useSearchParams();
  const [ready, setReady] = useState(false);
  const [pw1, setPw1] = useState('');
  const [pw2, setPw2] = useState('');
  const [busy, setBusy] = useState(false);
  const didSet = useRef(false);

  // Tokens kan ligge i query eller hash (Next eksponerer kun query; hash håndteres med window.location nedenfor)
  useEffect(() => {
    async function run() {
      if (didSet.current) return;

      // 1) prøv query
      let access_token = sp.get('access_token') || '';
      let refresh_token = sp.get('refresh_token') || '';
      let type = sp.get('type') || '';

      // 2) ellers parse hash (#a=1&b=2)
      if (!access_token || !refresh_token) {
        const h = typeof window !== 'undefined' ? window.location.hash : '';
        if (h && h.length > 1) {
          const raw = h.slice(1);
          const params = Object.fromEntries(raw.split('&').map(kv => {
            const [k,v=''] = kv.split('=');
            return [decodeURIComponent(k), decodeURIComponent(v)];
          })) as Record<string,string>;
          access_token = params['access_token'] || '';
          refresh_token = params['refresh_token'] || '';
          type = params['type'] || type;
        }
      }

      if (type === 'recovery' && access_token && refresh_token) {
        const { error } = await supabase.auth.setSession({ access_token, refresh_token });
        if (error) alert('Ugyldigt eller udløbet link. Prøv igen.');
        else didSet.current = true;
      }
      setReady(true);
    }
    run();
  }, [sp]);

  async function onSave(e: React.FormEvent) {
    e.preventDefault();
    if (pw1.length < 8) return alert('Adgangskoden skal være mindst 8 tegn.');
    if (pw1 !== pw2) return alert('Adgangskoderne er ikke ens.');
    setBusy(true);
    const { error } = await supabase.auth.updateUser({ password: pw1 });
    setBusy(false);
    if (error) return alert(error.message);
    alert('Din adgangskode er opdateret.');
    r.replace('/(protected)/opslag');
  }

  if (!ready) return <main style={{ minHeight: '100vh' }} />;

  return (
    <main style={{ minHeight: '100vh', display: 'grid', placeItems: 'center', padding: 24 }}>
      <form onSubmit={onSave} style={{ background: '#0f172a', borderRadius: 12, padding: 20, width: 360 }}>
        <h2 style={{ marginTop: 0 }}>Vælg ny adgangskode</h2>
        <input placeholder="Ny adgangskode" type="password" value={pw1} onChange={e=>setPw1(e.target.value)}
          style={{ width: '100%', height: 44, borderRadius: 8, marginBottom: 10, padding: '0 12px' }} />
        <input placeholder="Gentag adgangskode" type="password" value={pw2} onChange={e=>setPw2(e.target.value)}
          style={{ width: '100%', height: 44, borderRadius: 8, marginBottom: 14, padding: '0 12px' }} />
        <button disabled={busy} style={{ width: '100%', height: 44, borderRadius: 999, fontWeight: 700 }}>
          {busy ? 'Opdaterer…' : 'Gem ny adgangskode'}
        </button>
      </form>
    </main>
  );
}