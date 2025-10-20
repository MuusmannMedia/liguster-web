'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase-browser';

export default function MigPage() {
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setUser(data.user));
  }, []);

  if (!user) return null;

  return (
    <section>
      <h2 style={{ marginTop: 12 }}>Min profil</h2>
      <div style={{ marginTop: 12, background: '#0f172a', borderRadius: 12, padding: 14 }}>
        <div><strong>E-mail:</strong> {user.email}</div>
        <div style={{ marginTop: 6, color: '#cbd6e2' }}>
          {user.user_metadata?.email_verified ? 'E-mail er bekræftet' : 'E-mail ikke bekræftet endnu'}
        </div>

        <div style={{ display: 'flex', gap: 8, marginTop: 14 }}>
          <button
            onClick={async () => {
              await supabase.auth.signOut();
              location.href = '/(public)/login';
            }}
            style={{ background: '#fff', color: '#171C22', padding: '8px 14px', borderRadius: 999, fontWeight: 700 }}
          >
            Log ud
          </button>
        </div>
      </div>
    </section>
  );
}