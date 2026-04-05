'use client'

import { type ReactNode, useMemo } from 'react'
import { useFlag, type UseFlagOptions } from './useFlag'

export interface FlagProps {
  name: string
  children: ReactNode
  fallback?: ReactNode
  loading?: ReactNode
  userId?: string
  options?: UseFlagOptions
}

export function Flag({
  name,
  children,
  fallback = null,
  loading = null,
  userId,
  options = {},
}: FlagProps) {
  const finalOptions = useMemo(() => {
    if (userId) {
      return { ...options, defaultValue: options.defaultValue ?? false }
    }
    return options
  }, [userId, options])

  const { enabled, isLoading } = useFlag(name, finalOptions)

  if (isLoading) {
    return loading as ReactNode
  }

  return enabled ? children : fallback
}