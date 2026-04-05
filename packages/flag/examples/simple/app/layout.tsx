import type { Metadata } from 'next'
import './globals.css'
import { FlagProviders } from './providers'

export const metadata: Metadata = {
  title: '@cyguin/flag Example',
  description: 'Demo of feature flags for Next.js',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body>
        <FlagProviders>{children}</FlagProviders>
      </body>
    </html>
  )
}