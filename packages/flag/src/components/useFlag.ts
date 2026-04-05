'use client'

import { useMemo, useCallback, useState } from 'react'
import { useFlagContext } from './FlagProvider'
import type { FlagEvaluationContext } from '../types'

export interface UseFlagOptions {
  defaultValue?: boolean
}

export interface UseFlagResult {
  enabled: boolean
  isLoading: boolean
  refresh: () => Promise<void>
}

export function useFlag(flagName: string, options: UseFlagOptions = {}): UseFlagResult {
  const { isEnabled, isLoading, flags } = useFlagContext()
  const [refreshing, setRefreshing] = useState(false)

  const enabled = useMemo(() => {
    const result = isEnabled(flagName)
    if (!result && flags.size === 0 && !isLoading) {
      return options.defaultValue ?? false
    }
    return result
  }, [flagName, isEnabled, flags, isLoading, options.defaultValue])

  const refresh = useCallback(async () => {
    setRefreshing(true)
    setTimeout(() => setRefreshing(false), 100)
  }, [])

  return {
    enabled,
    isLoading: isLoading || refreshing,
    refresh,
  }
}