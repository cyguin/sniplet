'use client'

import { FlagProvider } from '@cyguin/flag'
import type { Flag } from '@cyguin/flag'
import { type ReactNode } from 'react'

interface FlagProvidersProps {
  children: ReactNode
}

const initialFlags: Flag[] = [
  {
    name: 'new-checkout',
    enabled: true,
    rolloutPercentage: 100,
    userIds: [],
  },
  {
    name: 'beta-dashboard',
    enabled: false,
    rolloutPercentage: 10,
    userIds: [],
  },
  {
    name: 'dark-mode',
    enabled: true,
    rolloutPercentage: 100,
    userIds: ['user-123', 'user-456'],
  },
]

export function FlagProviders({ children }: FlagProvidersProps) {
  return (
    <FlagProvider initialFlags={initialFlags} pollingInterval={30000}>
      {children}
    </FlagProvider>
  )
}