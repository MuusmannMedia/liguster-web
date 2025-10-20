'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase-browser';
import dayjs from 'dayjs';

type Post = {
  id: string;
  user_id: string;
  title: string | null;
  content: string | null;
  created_at: string;
};

export default function MineOpslagPage() {
  const [items, setItems] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    (async () => {
      const { data: userData } = await supabase.auth.getUser();
      const user = userData?.user;
      if (!user) return;

      // TODO: ret kolonner/tabelnavn hvis det afviger
      const { data, error } = await supabase
        .from('posts')
        .select('id,user_id,title,content,created_at')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (!mounted) return;
      if (error) console.log(error.message);
      setItems(data || []);
      setLoading(false);
    })();

    return () => { mounted = false; };
  }, []);

  return (
    <section>
      <h2 style={{ marginTop: 12 }}>Mine opslag</h2>
      {loading ? (
        <p style={{ color: '#cbd6e2' }}>Henter…</p>
      ) : items.length === 0 ? (
        <p style={{ color: '#cbd6e2' }}>Du har ikke oprettet nogen opslag endnu.</p>
      ) : (
        <ul style={{ listStyle: 'none', padding: 0, display: 'grid', gap: 12 }}>
          {items.map((p) => (
            <li key={p.id} style={{ background: '#0f172a', borderRadius: 12, padding: 14 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12 }}>
                <strong>{p.title || '(Uden titel)'}</strong>
                <span style={{ color: '#8fa3b7', fontSize: 12 }}>
                  {dayjs(p.created_at).format('DD.MM.YYYY HH:mm')}
                </span>
              </div>
              {p.content && <p style={{ marginTop: 6, color: '#e2e8f0' }}>{p.content}</p>}
              {/* Slet/Redigér kan tilføjes her */}
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}