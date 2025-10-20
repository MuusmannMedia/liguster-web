'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase-browser';
import { useRouter } from 'next/navigation';

export default function OpslagPage() {
  const r = useRouter();
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (!data.user) r.replace('/(public)/login');
      else setUser(data.user);
    });
  }, [r]);

  if (!user) return null;

  return (
    <main style={{ minHeight: '100vh', padding: 24 }}>
      <h2>Opslag (beskyttet)</h2>
      <p style={{ color: '#cbd6e2' }}>Hej, {user.email}</p>

      {/* Her bygger vi videre: hent opslag fra Supabase, lav CRUD, billeder via Storage osv. */}

      <button
        onClick={async () => { await supabase.auth.signOut(); r.replace('/(public)/login'); }}
        style={{ marginTop: 16, background: '#fff', color: '#171C22', padding: '8px 14px', borderRadius: 999, fontWeight: 700 }}
      >
        Log ud
      </button>
    </main>
  );
}