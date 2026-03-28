import postgres from 'postgres'
import { nanoid } from 'nanoid'
import type { SnipletAdapter, Snip, CreateSnipInput } from '../core/types.js'
import { SnipNotFoundError, SnipAlreadyBurnedError, SnipExpiredError } from '../core/errors.js'

interface DbSnip {
  id: string
  content: string
  language: string | null
  expires_at: Date | null
  burn_on_read: boolean
  burned_at: Date | null
  created_at: Date
}

function rowToSnip(row: DbSnip): Snip {
  return {
    id: row.id,
    content: row.content,
    language: row.language,
    expiresAt: row.expires_at,
    burnOnRead: row.burn_on_read,
    burnedAt: row.burned_at,
    createdAt: row.created_at,
  }
}

/**
 * Postgres adapter using porsager/postgres. Atomic burn-on-read via
 * UPDATE ... RETURNING. Idempotent migration runs on first use.
 */
export class PostgresAdapter implements SnipletAdapter {
  private sql: ReturnType<typeof postgres>

  constructor(connectionString: string) {
    this.sql = postgres(connectionString)
    this.migrate()
  }

  private async migrate(): Promise<void> {
    await this.sql`
      CREATE TABLE IF NOT EXISTS sniplet_snips (
        id            TEXT PRIMARY KEY,
        content       TEXT NOT NULL,
        language      TEXT,
        expires_at    TIMESTAMPTZ,
        burn_on_read  BOOLEAN DEFAULT FALSE,
        burned_at     TIMESTAMPTZ,
        created_at    TIMESTAMPTZ DEFAULT NOW()
      );
    `
    await this.sql`
      CREATE INDEX IF NOT EXISTS sniplet_expires_idx
        ON sniplet_snips(expires_at)
        WHERE expires_at IS NOT NULL;
    `
  }

  async create(input: CreateSnipInput): Promise<Snip> {
    const id = nanoid(12)

    const [row] = await this.sql<[DbSnip]>`
      INSERT INTO sniplet_snips (id, content, language, expires_at, burn_on_read)
      VALUES (
        ${id},
        ${input.content},
        ${input.language ?? null},
        ${input.expiresAt ?? null},
        ${input.burnOnRead ?? false}
      )
      RETURNING *
    `

    return rowToSnip(row)
  }

  async get(id: string): Promise<Snip> {
    const [row] = await this.sql<[DbSnip | undefined]>`
      SELECT * FROM sniplet_snips WHERE id = ${id}
    `

    if (!row) {
      throw new SnipNotFoundError(id)
    }

    if (row.burned_at !== null) {
      throw new SnipAlreadyBurnedError(id)
    }

    if (row.burn_on_read) {
      const [burned] = await this.sql<[DbSnip | undefined]>`
        UPDATE sniplet_snips
        SET burned_at = NOW()
        WHERE id = ${id}
          AND burn_on_read = TRUE
          AND burned_at IS NULL
        RETURNING *
      `

      if (!burned) {
        throw new SnipAlreadyBurnedError(id)
      }

      return rowToSnip(burned)
    }

    if (row.expires_at !== null && row.expires_at < new Date()) {
      throw new SnipExpiredError(id)
    }

    return rowToSnip(row)
  }

  async delete(id: string): Promise<void> {
    await this.sql`DELETE FROM sniplet_snips WHERE id = ${id}`
  }

  async sweep(): Promise<number> {
    const result = await this.sql`
      DELETE FROM sniplet_snips
      WHERE expires_at IS NOT NULL AND expires_at < NOW()
    `
    return result.count ?? 0
  }

  async close(): Promise<void> {
    await this.sql.end()
  }
}
