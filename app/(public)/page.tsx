'use client';

import React from 'react';

export default function LandingPage() {
  return (
    <main
      style={{
        backgroundColor: '#0f172a',
        color: 'white',
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        textAlign: 'center',
        padding: 24,
      }}
    >
      <h1 style={{ fontSize: 32, fontWeight: 700, marginBottom: 16 }}>
        Nabolaget – samlet ét sted
      </h1>
      <p style={{ maxWidth: 500, color: '#cbd6e2', marginBottom: 40 }}>
        Hjælp hinanden, lån ting, del arrangementer og hold styr på foreningen.
        Liguster samler hverdagen i dit nabolag.
      </p>

      <div
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          justifyContent: 'center',
          gap: 20,
          marginBottom: 40,
        }}
      >
        <Card title="Opslag & hjælp" text="Efterlys hjælp, tilbyd din hånd eller del ting væk. Alt samlet i nabolaget." />
        <Card title="Foreninger" text="Medlemslister, kalender, opslag og beskeder – nemt for bestyrelsen." />
        <Card title="Beskeder" text="Hold samtalen i appen – både 1:1 og i grupper." />
      </div>

      <p style={{ color: '#94a3b8', fontSize: 14 }}>
        Webudgaven er under udvikling. Har du allerede en konto, kan du logge ind nedenfor.
      </p>
      <p style={{ marginTop: 10 }}>
        <a href="/login" style={{ color: '#60a5fa', textDecoration: 'underline' }}>
          Log ind
        </a>{' '}
        ·{' '}
        <a href="/privacy" style={{ color: '#60a5fa', textDecoration: 'underline' }}>
          Privacy Policy
        </a>
      </p>

      <footer style={{ marginTop: 60, fontSize: 12, color: '#64748b' }}>
        © {new Date().getFullYear()} Liguster
      </footer>
    </main>
  );
}

function Card({ title, text }: { title: string; text: string }) {
  return (
    <div
      style={{
        background: '#1e293b',
        padding: 16,
        borderRadius: 12,
        width: 260,
        textAlign: 'left',
      }}
    >
      <h3 style={{ marginBottom: 8, fontSize: 18, fontWeight: 600 }}>{title}</h3>
      <p style={{ fontSize: 14, color: '#cbd5e1' }}>{text}</p>
    </div>
  );
}