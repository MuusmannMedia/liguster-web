'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase-browser';
import { useRouter, usePathname } from 'next/navigation';

export default function ProtectedLayout({ children }: { children: React.ReactNode }) {
  const r = useRouter();
  const pathname = usePathname();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (!data.user) r.replace('/(public)/login');
      else setReady(true);
    });
  }, [r]);

  if (!ready) return null;

  const Tab = ({ href, label }: { href: string; label: string }) => {
    const active = pathname === href;
    return (
      <Link
        href={href}
        style={{
          padding: '10px 14px',
          borderRadius: 999,
          textDecoration: 'none',
          fontWeight: 700,
          color: active ? '#171C22' : '#cfe2ff',
          background: active ? '#fff' : 'transparent',
        }}
      >
        {label}
      </Link>
    );
  };

  return (
    <div style={{ minHeight: '100vh', background: '#171C22', color: '#fff' }}>
      <header
        style={{
          position: 'sticky',
          top: 0,
          backdropFilter: 'blur(6px)',
          background: 'rgba(23,28,34,0.7)',
          borderBottom: '1px solid rgba(255,255,255,0.06)',
          zIndex: 10,
        }}
      >
        <nav
          style={{
            maxWidth: 1100,
            margin: '0 auto',
            padding: '12px 16px',
            display: 'flex',
            gap: 8,
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <div style={{ display: 'flex', gap: 8 }}>
            <Tab href="/(protected)/opslag" label="Opslag" />
            <Tab href="/(protected)/mine-opslag" label="Mine opslag" />
            <Tab href="/(protected)/foreninger" label="Foreninger" />
            <Tab href="/(protected)/beskeder" label="Beskeder" />
            <Tab href="/(protected)/mig" label="Mig" />
          </div>
          <button
            onClick={async () => {
              await supabase.auth.signOut();
              r.replace('/(public)/login');
            }}
            style={{ background: '#fff', color: '#171C22', padding: '8px 14px', borderRadius: 999, fontWeight: 700 }}
          >
            Log ud
          </button>
        </nav>
      </header>

      <main style={{ maxWidth: 1100, margin: '0 auto', padding: 16 }}>{children}</main>
    </div>
  );
}