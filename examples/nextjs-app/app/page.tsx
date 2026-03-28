import Link from 'next/link'

export default function Home() {
  return (
    <main style={{ maxWidth: '640px', margin: '0 auto', padding: '4rem 1rem', fontFamily: 'system-ui, sans-serif' }}>
      <h1 style={{ fontSize: '2rem', fontWeight: 800, marginBottom: '0.5rem' }}>sniplet</h1>
      <p style={{ fontSize: '1.125rem', color: '#6b7280', marginBottom: '2rem' }}>
        Share code snippets from your Next.js app. No external service, no separate deployment.
      </p>
      <Link
        href="/snips"
        style={{
          display: 'inline-block',
          padding: '0.625rem 1.25rem',
          backgroundColor: '#2563eb',
          color: '#fff',
          borderRadius: '0.375rem',
          textDecoration: 'none',
          fontWeight: 500,
        }}
      >
        Share a snippet &rarr;
      </Link>
    </main>
  )
}
