import type { SnipletAdapter } from '../core/types.js'

/** Supported expiry durations for snips. */
export type ExpiryOption = '1h' | '24h' | '7d' | 'never'

/**
 * Configuration options for the sniplet handler.
 *
 * @example
 * ```typescript
 * const handler = createSnipletHandler(adapter, {
 *   maxLength: 100_000,
 *   defaultExpiry: '24h',
 *   allowAnonymous: true,
 *   rateLimit: { window: '1m', max: 10 },
 * })
 * ```
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
 *
 * @example
 * ```typescript
 * const handler = createSnipletHandler({
 *   adapter: new SQLiteAdapter('./snips.db'),
 *   options: { defaultExpiry: '7d', maxLength: 50_000 },
 * })
 * ```
 */
export interface SnipletConfig {
  adapter: SnipletAdapter
  options?: SnipletOptions
}
