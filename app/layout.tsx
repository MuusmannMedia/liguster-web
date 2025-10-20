export const metadata = { title: 'Liguster', description: 'Liguster Web' };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="da">
      <body style={{ margin: 0, background: '#171C22', color: '#fff', fontFamily: 'system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial, sans-serif' }}>
        {children}
      </body>
    </html>
  );
}