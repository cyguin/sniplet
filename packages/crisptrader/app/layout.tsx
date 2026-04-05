import { ClerkProvider } from '@clerk/nextjs';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'CrispTrader',
  description: 'Precious metals price alerts',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ClerkProvider>
      <html lang="en">
        <body>{children}</body>
      </html>
    </ClerkProvider>
  );
}
