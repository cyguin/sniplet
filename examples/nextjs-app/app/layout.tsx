import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'sniplet — share code snippets',
  description: 'Drop-in snippet sharing for your Next.js app.',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}
