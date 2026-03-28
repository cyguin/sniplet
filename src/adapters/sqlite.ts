import Database from 'better-sqlite3'
import { nanoid } from 'nanoid'
import type { SnipletAdapter, Snip, CreateSnipInput } from '../core/types'
import { SnipNotFoundError, SnipAlreadyBurnedError, SnipExpiredError } from '../core/errors'

interface DbRow {
  id: string
  content: string
  language: string | null
  expires_at: string | null
  burn_on_read: number
  burned_at: string | null
  created_at: string
}

function rowToSnip(row: DbRow): Snip {
  return {
    id: row.id,
    content: row.content,
    language: row.language,
    expiresAt: row.expires_at ? new Date(row.expires_at) : null,
    burnOnRead: Boolean(row.burn_on_read),
    burnedAt: row.burned_at ? new Date(row.burned_at) : null,
    createdAt: new Date(row.created_at),
  }
}

/**
 * SQLite adapter using better-sqlite3. Thread-safe, WAL mode enabled.
 * Idempotent migration runs on first use.
 *
 * @example
 * ```typescript
 * import { SQLiteAdapter } from '@cyguin/sniplet/adapters/sqlite'
 * const adapter = new SQLiteAdapter('./data/snips.db')
 * ```
 */
export class SQLiteAdapter implements SnipletAdapter {
  private db: Database.Database

  /**
   * Creates a new SQLiteAdapter.
   *
   * @param filename - Path to the SQLite database file. Use `:memory:` for an
   *   in-memory database (useful for tests).
   */
  constructor(filename: string) {
    this.db = new Database(filename)
    this.db.pragma('journal_mode = WAL')
    this.migrate()
  }

  private migrate(): void {
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS sniplet_snips (
        id            TEXT PRIMARY KEY,
        content       TEXT NOT NULL,
        language      TEXT,
        expires_at    TEXT,
        burn_on_read  INTEGER DEFAULT 0,
        burned_at     TEXT,
        created_at    TEXT DEFAULT (datetime('now'))
      );

      CREATE INDEX IF NOT EXISTS sniplet_expires_idx
        ON sniplet_snips(expires_at)
        WHERE expires_at IS NOT NULL;
    `)
  }

  async create(input: CreateSnipInput): Promise<Snip> {
    const id = nanoid(12)
    const now = new Date().toISOString()

    this.db.prepare(`
      INSERT INTO sniplet_snips (id, content, language, expires_at, burn_on_read, created_at)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(
      id,
      input.content,
      input.language ?? null,
      input.expiresAt?.toISOString() ?? null,
      input.burnOnRead ? 1 : 0,
      now
    )

    const row = this.db.prepare('SELECT * FROM sniplet_snips WHERE id = ?').get(id) as DbRow
    return rowToSnip(row)
  }

  async get(id: string): Promise<Snip> {
    const row = this.db.prepare('SELECT * FROM sniplet_snips WHERE id = ?').get(id) as DbRow | undefined

    if (!row) {
      throw new SnipNotFoundError(id)
    }

    if (row.burned_at !== null) {
      throw new SnipAlreadyBurnedError(id)
    }

    if (row.burn_on_read) {
      const tx = this.db.transaction((txId: string, now: string) => {
        const result = this.db.prepare(`
          UPDATE sniplet_snips
          SET burned_at = ?
          WHERE id = ? AND burn_on_read = 1 AND burned_at IS NULL
        `).run(now, txId)
        return result.changes > 0
      })

      const wasBurned = tx(id, new Date().toISOString())
      if (!wasBurned) {
        throw new SnipAlreadyBurnedError(id)
      }
      return rowToSnip(row)
    }

    if (row.expires_at !== null && new Date(row.expires_at) < new Date()) {
      throw new SnipExpiredError(id)
    }

    return rowToSnip(row)
  }

  async delete(id: string): Promise<void> {
    this.db.prepare('DELETE FROM sniplet_snips WHERE id = ?').run(id)
  }

  async sweep(): Promise<number> {
    const now = new Date().toISOString()
    const result = this.db.prepare(`
      DELETE FROM sniplet_snips WHERE expires_at IS NOT NULL AND expires_at < ?
    `).run(now)
    return result.changes
  }

  close(): void {
    this.db.close()
  }
}
