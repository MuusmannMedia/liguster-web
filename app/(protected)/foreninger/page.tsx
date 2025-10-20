'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase-browser';

type Org = {
  id: string;
  name: string;
  description: string | null;
  city: string | null;
  logo_url: string | null;
};

export default function ForeningerPage() {
  const [orgs, setOrgs] = useState<Org[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    (async () => {
      // TODO: ret tabelnavn og felter hvis de hedder noget andet
      const { data, error } = await supabase
        .from('organizations')
        .select('id,name,description,city,logo_url')
        .order('name', { ascending: true });

      if (!mounted) return;
      if (error) console.log(error.message);
      setOrgs(data || []);
      setLoading(false);
    })();
    return () => { mounted = false; };
  }, []);

  return (
    <section>
      <h2 style={{ marginTop: 12 }}>Foreninger</h2>
      {loading ? (
        <p style={{ color: '#cbd6e2' }}>Henter…</p>
      ) : orgs.length === 0 ? (
        <p style={{ color: '#cbd6e2' }}>Ingen foreninger fundet.</p>
      ) : (
        <ul style={{ listStyle: 'none', padding: 0, display: 'grid', gap: 12 }}>
          {orgs.map((o) => (
            <li key={o.id} style={{ background: '#0f172a', borderRadius: 12, padding: 14, display: 'flex', gap: 12 }}>
              {o.logo_url && (
                <img
                  src={o.logo_url}
                  alt={o.name}
                  width={48}
                  height={48}
                  style={{ borderRadius: 8, objectFit: 'cover' }}
                />
              )}
              <div>
                <strong>{o.name}</strong>
                {o.city && <div style={{ color: '#8fa3b7', fontSize: 12 }}>{o.city}</div>}
                {o.description && <p style={{ marginTop: 6, color: '#e2e8f0' }}>{o.description}</p>}
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}