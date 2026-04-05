import { auth } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { userId } = await auth();
  
  if (!userId) {
    redirect('/sign-in');
  }

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#f5f5f5' }}>
      <header style={{
        backgroundColor: '#1a1a1a',
        color: 'white',
        padding: '16px 24px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center'
      }}>
        <h1 style={{ fontSize: '20px', fontWeight: 600 }}>CrispTrader</h1>
        <nav style={{ display: 'flex', gap: '24px' }}>
          <a href="/dashboard" style={{ color: 'white', textDecoration: 'none', fontSize: '14px' }}>Dashboard</a>
          <a href="/account" style={{ color: 'white', textDecoration: 'none', fontSize: '14px' }}>Account</a>
        </nav>
      </header>
      <main style={{ padding: '24px', maxWidth: '1200px', margin: '0 auto' }}>
        {children}
      </main>
    </div>
  );
}
