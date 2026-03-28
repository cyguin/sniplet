'use client'

import { SnipView } from '@cyguin/sniplet/react'

export default function SnipPage({ params }: { params: { id: string } }) {
  return (
    <main style={{ maxWidth: '800px', margin: '0 auto', padding: '2rem 1rem' }}>
      <SnipView id={params.id} variant="tailwind" />
    </main>
  )
}
