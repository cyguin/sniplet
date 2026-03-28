/**
 * A stored snippet.
 * @see https://sniplet.cyguin.com/docs
 */
export interface Snip {
  id: string
  content: string
  language: string | null
  expiresAt: Date | null
  burnOnRead: boolean
  burnedAt: Date | null
  createdAt: Date
}

/**
 * Input for creating a new snip.
 *
 * @example
 * ```typescript
 * await adapter.create({
 *   content: 'console.log("hello")',
 *   language: 'typescript',
 *   burnOnRead: true,
 *   expiresAt: new Date(Date.now() + 3600_000), // 1 hour
 * })
 * ```
 */
export interface CreateSnipInput {
  content: string
  language?: string
  expiresAt?: Date | null
  burnOnRead?: boolean
}

/**
 * Interface for snip storage backends.
 *
 * @example
 * ```typescript
 * import { SQLiteAdapter } from '@cyguin/sniplet/adapters/sqlite'
 *
 * const adapter = new SQLiteAdapter('./snips.db')
 * const snip = await adapter.create({ content: 'hello world' })
 * const retrieved = await adapter.get(snip.id)
 * ```
 */
export interface SnipletAdapter {
  create(input: CreateSnipInput): Promise<Snip>
  get(id: string): Promise<Snip>
  delete(id: string): Promise<void>
  sweep(): Promise<number>
}
