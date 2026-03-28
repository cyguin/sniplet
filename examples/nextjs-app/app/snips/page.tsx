'use client'

import { SnipCreate } from '@cyguin/sniplet/react'
import { useRouter } from 'next/navigation'

export default function SnipsPage() {
  const router = useRouter()

  return (
    <main style={{ maxWidth: '640px', margin: '0 auto', padding: '2rem 1rem' }}>
      <h1 style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: '1.5rem' }}>
        Share a Snippet
      </h1>
      <SnipCreate
        onSuccess={(id) => {
          router.push(`/snips/${id}`)
        }}
        variant="tailwind"
      />
    </main>
  )
}
