export interface Snip {
  id: string
  title: string
  language: string
  content: string
  burn_on_read: boolean
  expires_at: number | null
  view_count: number
  created_at: number
}

export interface CreateSnipInput {
  title: string
  language: string
  content: string
  burn_on_read?: boolean
  expires_in?: string // e.g. '1h', '1d', '7d'
}

export interface ExpiryOption {
  label: string
  value: string
}

export interface SnipletOptions {
  maxLength?: number
  defaultExpiry?: string
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

export abstract class SnipletError extends Error {
  constructor(message: string, public code: string) {
    super(message)
    this.name = 'SnipletError'
  }
}

export class SnipNotFoundError extends SnipletError {
  constructor(id: string) {
    super(`Snip ${id} not found`, 'NOT_FOUND')
  }
}

export class SnipExpiredError extends SnipletError {
  constructor(id: string) {
    super(`Snip ${id} has expired`, 'EXPIRED')
  }
}

export class SnipBurnedError extends SnipletError {
  constructor(id: string) {
    super(`Snip ${id} was burned and can no longer be viewed`, 'BURNED')
  }
}

export class RateLimitError extends SnipletError {
  constructor() {
    super('Rate limit exceeded', 'RATE_LIMITED')
  }
}

export interface SnipletAdapter {
  create(input: CreateSnipInput & { id: string; expires_at: number | null; created_at: number }): Promise<Snip>
  findById(id: string): Promise<Snip | null>
  incrementViews(id: string): Promise<void>
  delete(id: string): Promise<void>
  listByIp?(ip: string, windowMs: number, limit: number): Promise<number>
  recordAccess?(ip: string, windowMs: number): Promise<void>
}
