import type { SnipletAdapter } from '../core/types.js'

export type ExpiryOption = '1h' | '24h' | '7d' | 'never'

export interface SnipletOptions {
  maxLength?: number
  defaultExpiry?: ExpiryOption
  allowAnonymous?: boolean
  rateLimit?: {
    window: string
    max: number
  }
}

export interface SnipletConfig {
  adapter: SnipletAdapter
  options?: SnipletOptions
}
