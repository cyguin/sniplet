import type { SnipletAdapter } from '../core/types.js'

/** Supported expiry durations for snips. */
export type ExpiryOption = '1h' | '24h' | '7d' | 'never'

/**
 * Configuration options for the sniplet handler.
 */
export interface SnipletOptions {
  maxLength?: number
  defaultExpiry?: ExpiryOption
  allowAnonymous?: boolean
  rateLimit?: {
    window: string
    max: number
  }
}

/**
 * Configuration passed to createSnipletHandler.
 */
export interface SnipletConfig {
  adapter: SnipletAdapter
  options?: SnipletOptions
}
