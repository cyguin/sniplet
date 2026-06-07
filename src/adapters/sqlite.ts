import type { Database as DatabaseType } from 'better-sqlite3'
import type { SnipletAdapter } from '../types'
import type { Snip } from '../types'

export interface SQLiteAdapterOptions {
  path?: string
}

export function SQLiteAdapter(options: SQLiteAdapterOptions = {}): SnipletAdapter {
  let db: DatabaseType
  try {
    const Database = require('better-sqlite3') as new (path: string) => DatabaseType
    const dbPath = options.path ?? './data/sniplet.db'
    db = new Database(dbPath)
    db.pragma('journal_mode = WAL')
  } catch {
    throw new Error('better-sqlite3 is required. Install with: npm install better-sqlite3')
  }

  db.exec(`
    CREATE TABLE IF NOT EXISTS snips (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      language TEXT NOT NULL,
      content TEXT NOT NULL,
      burn_on_read INTEGER NOT NULL DEFAULT 0,
      expires_at INTEGER,
      view_count INTEGER NOT NULL DEFAULT 0,
      created_at INTEGER NOT NULL
    )
  `)
  db.exec(`
    CREATE TABLE IF NOT EXISTS snip_access (
      ip TEXT NOT NULL,
      timestamp INTEGER NOT NULL
    )
  `)

  return {
    async create(input: Snip): Promise<Snip> {
      const stmt = db.prepare(`
        INSERT INTO snips (id, title, language, content, burn_on_read, expires_at, view_count, created_at)
        VALUES (?, ?, ?, ?, ?, ?, 0, ?)
      `)
      stmt.run(
        input.id,
        input.title,
        input.language,
        input.content,
        input.burn_on_read ? 1 : 0,
        input.expires_at,
        input.created_at
      )
      return { ...input, view_count: 0 }
    },

    async findById(id: string): Promise<Snip | null> {
      const stmt = db.prepare('SELECT * FROM snips WHERE id = ?')
      const row = stmt.get(id) as Record<string, unknown> | undefined
      if (!row) return null
      return {
        id: row.id as string,
        title: row.title as string,
        language: row.language as string,
        content: row.content as string,
        burn_on_read: Boolean(row.burn_on_read),
        expires_at: row.expires_at as number | null,
        view_count: row.view_count as number,
        created_at: row.created_at as number,
      }
    },

    async incrementViews(id: string): Promise<void> {
      const stmt = db.prepare('UPDATE snips SET view_count = view_count + 1 WHERE id = ?')
      stmt.run(id)
    },

    async delete(id: string): Promise<void> {
      const stmt = db.prepare('DELETE FROM snips WHERE id = ?')
      stmt.run(id)
    },

    async listByIp(ip: string, windowMs: number, limit: number): Promise<number> {
      const cutoff = Date.now() - windowMs
      const stmt = db.prepare(
        'SELECT COUNT(*) as count FROM snip_access WHERE ip = ? AND timestamp > ?'
      )
      const row = stmt.get(ip, cutoff) as { count: number } | undefined
      return row?.count ?? 0
    },

    async recordAccess(ip: string, windowMs: number): Promise<void> {
      const cutoff = Date.now() - windowMs
      db.prepare('DELETE FROM snip_access WHERE ip = ? AND timestamp < ?').run(ip, cutoff)
      db.prepare('INSERT INTO snip_access (ip, timestamp) VALUES (?, ?)').run(ip, Date.now())
    },
  }
}
