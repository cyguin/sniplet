'use client'

import { createContext, useContext, useState, useEffect, useMemo, type ReactNode } from 'react'
import type { Flag, FlagEvaluationContext } from '../types'
import { evaluateFlag } from '../lib/flags'

export interface FlagContextValue {
  flags: Map<string, Flag>
  isEnabled: (name: string, context?: FlagEvaluationContext) => boolean
  isLoading: boolean
}

const FlagContext = createContext<FlagContextValue | null>(null)

export interface FlagProviderProps {
  children: ReactNode
  initialFlags?: Flag[]
  pollingInterval?: number
  apiEndpoint?: string
}

async function fetchFlagsFromApi(endpoint: string): Promise<Flag[]> {
  const response = await fetch(endpoint)
  if (!response.ok) {
    throw new Error(`Failed to fetch flags: ${response.statusText}`)
  }
  return response.json()
}

export function FlagProvider({
  children,
  initialFlags = [],
  pollingInterval = 0,
  apiEndpoint = '/api/flags',
}: FlagProviderProps) {
  const [flags, setFlags] = useState<Map<string, Flag>>(() => {
    const map = new Map<string, Flag>()
    initialFlags.forEach((f) => map.set(f.name, f))
    return map
  })
  const [isLoading, setIsLoading] = useState(initialFlags.length === 0)

  useEffect(() => {
    async function loadFlags() {
      try {
        const freshFlags = await fetchFlagsFromApi(apiEndpoint)
        const map = new Map<string, Flag>()
        freshFlags.forEach((f) => map.set(f.name, f))
        setFlags(map)
      } catch (error) {
        console.error('[FlagProvider] Failed to load flags:', error)
      } finally {
        setIsLoading(false)
      }
    }

    loadFlags()

    if (pollingInterval > 0) {
      const interval = setInterval(loadFlags, pollingInterval)
      return () => clearInterval(interval)
    }
  }, [apiEndpoint, pollingInterval])

  const isEnabled = useMemo(() => {
    return (name: string, context: FlagEvaluationContext = {}): boolean => {
      const flag = flags.get(name)

      if (!flag) {
        return false
      }

      return evaluateFlag(flag, context).enabled
    }
  }, [flags])

  const value = useMemo(
    () => ({
      flags,
      isEnabled,
      isLoading,
    }),
    [flags, isEnabled, isLoading]
  )

  return <FlagContext.Provider value={value}>{children}</FlagContext.Provider>
}

export function useFlagContext(): FlagContextValue {
  const context = useContext(FlagContext)
  if (!context) {
    throw new Error('useFlagContext must be used within a FlagProvider')
  }
  return context
}

export { FlagContext }