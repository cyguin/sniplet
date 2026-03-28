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
 */
export interface CreateSnipInput {
  content: string
  language?: string
  expiresAt?: Date | null
  burnOnRead?: boolean
}

/**
 * Storage adapter for snips. Implement this to add support for a new database.
 * @see SQLiteAdapter for an example implementation.
 */
export interface SnipletAdapter {
  create(input: CreateSnipInput): Promise<Snip>
  get(id: string): Promise<Snip>
  delete(id: string): Promise<void>
  sweep(): Promise<number>
}
