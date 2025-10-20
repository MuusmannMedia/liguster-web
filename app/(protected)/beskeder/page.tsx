'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase-browser';

type Thread = {
  id: string;
  title: string | null;
  updated_at: string;
  last_message_preview?: string | null;
};

export default function BeskederPage() {
  const [threads, setThreads] = useState<Thread[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    (async () => {
      const { data: userData } = await supabase.auth.getUser();
      const user = userData?.user;
      if (!user) return;

      // TODO: ret til dine tabeller/kolonner. Eksempel på view eller join:
      // her antager vi en view "v_threads_overview" med brugerfiltrering via RLS
      const { data, error } = await supabase
        .from('v_threads_overview')
        .select('id,title,updated_at,last_message_preview')
        .order('updated_at', { ascending: false });

      if (!mounted) return;
      if (error) console.log(error.message);
      setThreads(data || []);
      setLoading(false);
    })();

    return () => { mounted = false; };
  }, []);

  return (
    <section>
      <h2 style={{ marginTop: 12 }}>Beskeder</h2>
      {loading ? (
        <p style={{ color: '#cbd6e2' }}>Henter…</p>
      ) : threads.length === 0 ? (
        <p style={{ color: '#cbd6e2' }}>Ingen beskeder endnu.</p>
      ) : (
        <ul style={{ listStyle: 'none', padding: 0, display: 'grid', gap: 12 }}>
          {threads.map((t) => (
            <li key={t.id} style={{ background: '#0f172a', borderRadius: 12, padding: 14 }}>
              <strong>{t.title || 'Samtale'}</strong>
              {t.last_message_preview && (
                <p style={{ marginTop: 6, color: '#e2e8f0' }}>{t.last_message_preview}</p>
              )}
              <div style={{ marginTop: 6, fontSize: 12, color: '#8fa3b7' }}>
                Senest opdateret: {new Date(t.updated_at).toLocaleString('da-DK')}
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}