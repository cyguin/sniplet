import type { NextRequest } from 'next/server.js'

interface RateLimitEntry {
  count: number
  resetAt: number
}

const store = new Map<string, RateLimitEntry>()

function parseWindow(window: string): number {
  const match = window.match(/^(\d+)([mhd])$/)
  if (!match) throw new Error(`Invalid rate limit window: ${window}`)
  const value = parseInt(match[1], 10)
  switch (match[2]) {
    case 'm': return value * 60 * 1000
    case 'h': return value * 60 * 60 * 1000
    case 'd': return value * 24 * 60 * 60 * 1000
    default: throw new Error(`Invalid rate limit window unit: ${match[2]}`)
  }
}

function getClientIp(request: NextRequest): string | null {
  const forwarded = request.headers.get('x-forwarded-for')
  if (forwarded) {
    return forwarded.split(',')[0].trim()
  }
  const realIp = request.headers.get('x-real-ip')
  if (realIp) return realIp.trim()
  return null
}

export function checkRateLimit(
  request: NextRequest,
  windowStr: string,
  max: number,
): 'allowed' | 'rate_limited' {
  const ip = getClientIp(request)
  if (!ip) return 'allowed'

  const windowMs = parseWindow(windowStr)
  const now = Date.now()
  const key = ip

  const entry = store.get(key)
  if (!entry || now >= entry.resetAt) {
    store.set(key, { count: 1, resetAt: now + windowMs })
    return 'allowed'
  }

  if (entry.count >= max) {
    return 'rate_limited'
  }

  entry.count++
  return 'allowed'
}
