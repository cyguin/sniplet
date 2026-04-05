import type { SnipletAdapter } from '../types'
import type { Snip } from '../types'

export interface PostgresAdapterOptions {
  connectionString: string
}

export function PostgresAdapter(options: PostgresAdapterOptions): SnipletAdapter {
  let pool: any
  try {
    const { Pool } = require('pg')
    pool = new Pool({ connectionString: options.connectionString })
  } catch {
    throw new Error('pg is required. Install with: npm install pg')
  }

  return {
    async create(input: Snip): Promise<Snip> {
      const result = await pool.query(
        `INSERT INTO snips (id, title, language, content, burn_on_read, expires_at, view_count, created_at)
         VALUES ($1, $2, $3, $4, $5, $6, 0, $7)
         RETURNING *`,
        [
          input.id,
          input.title,
          input.language,
          input.content,
          input.burn_on_read,
          input.expires_at,
          input.created_at,
        ]
      )
      const row = result.rows[0]
      return { ...row, burn_on_read: Boolean(row.burn_on_read) }
    },

    async findById(id: string): Promise<Snip | null> {
      const result = await pool.query('SELECT * FROM snips WHERE id = $1', [id])
      if (!result.rows[0]) return null
      const row = result.rows[0]
      return { ...row, burn_on_read: Boolean(row.burn_on_read) }
    },

    async incrementViews(id: string): Promise<void> {
      await pool.query('UPDATE snips SET view_count = view_count + 1 WHERE id = $1', [id])
    },

    async delete(id: string): Promise<void> {
      await pool.query('DELETE FROM snips WHERE id = $1', [id])
    },

    async listByIp(ip: string, windowMs: number, limit: number): Promise<number> {
      const cutoff = Date.now() - windowMs
      const result = await pool.query(
        'SELECT COUNT(*) as count FROM snip_access WHERE ip = $1 AND timestamp > $2',
        [ip, cutoff]
      )
      return parseInt(result.rows[0]?.count ?? 0)
    },

    async recordAccess(ip: string, windowMs: number): Promise<void> {
      const cutoff = Date.now() - windowMs
      await pool.query('DELETE FROM snip_access WHERE ip = $1 AND timestamp < $2', [ip, cutoff])
      await pool.query('INSERT INTO snip_access (ip, timestamp) VALUES ($1, $2)', [ip, Date.now()])
    },
  }
}
