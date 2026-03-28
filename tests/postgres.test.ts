import { describe, it, expect, beforeAll, afterAll, beforeEach, afterEach } from 'vitest'
import { execSync } from 'child_process'
import { randomUUID } from 'crypto'
import postgres from 'postgres'
import { PostgresAdapter } from '../src/adapters/postgres.js'
import { SnipNotFoundError, SnipAlreadyBurnedError, SnipExpiredError } from '../src/core/errors.js'

let containerId = ''
let dbUrl = ''

async function startPostgres(): Promise<string> {
  const name = `sniplet-pg-test-${randomUUID().slice(0, 8)}`
  const password = 'testpass'
  const port = 5432

  execSync(
    `docker run -d --name ${name} -e POSTGRES_PASSWORD=${password} -p ${port}:5432 postgres:16-alpine`,
    { stdio: 'pipe' }
  )

  const url = `postgres://postgres:${password}@localhost:${port}/testdb`

  for (let i = 0; i < 30; i++) {
    try {
      await new Promise((r) => setTimeout(r, 1000))
      execSync(`docker exec ${name} psql -U postgres -c "CREATE DATABASE testdb;" || true`, { stdio: 'pipe' })
      return url
    } catch {
      // wait for postgres to start
    }
  }

  throw new Error('Could not start Postgres')
}

async function stopPostgres(name: string): Promise<void> {
  try {
    execSync(`docker stop ${name} && docker rm ${name}`, { stdio: 'pipe' })
  } catch { /* ignore */ }
}

beforeAll(async () => {
  try {
    dbUrl = await startPostgres()
  } catch (e) {
    console.warn('Docker not available, skipping Postgres tests:', e)
  }
}, 120_000)

afterAll(async () => {
  const name = containerId || `sniplet-pg-test-${randomUUID().slice(0, 8)}`
  await stopPostgres(name)
})

const describePostgres = dbUrl ? describe : describe.skip

describePostgres('PostgresAdapter', () => {
  let adapter: PostgresAdapter

  beforeEach(() => {
    adapter = new PostgresAdapter(dbUrl)
  })

  afterEach(async () => {
    await adapter.close()
    try {
      const sql = postgres(dbUrl)
      await sql`DROP TABLE IF EXISTS sniplet_snips`
      await sql.end()
    } catch { /* ignore */ }
  })

  describe('create', () => {
    it('creates a snip with minimal input', async () => {
      const snip = await adapter.create({ content: 'hello world' })
      expect(snip.id).toHaveLength(12)
      expect(snip.content).toBe('hello world')
      expect(snip.language).toBeNull()
      expect(snip.burnOnRead).toBe(false)
      expect(snip.burnedAt).toBeNull()
      expect(snip.createdAt).toBeInstanceOf(Date)
    })

    it('creates a snip with all options', async () => {
      const expiresAt = new Date(Date.now() + 60_000)
      const snip = await adapter.create({
        content: 'code',
        language: 'typescript',
        expiresAt,
        burnOnRead: true,
      })
      expect(snip.content).toBe('code')
      expect(snip.language).toBe('typescript')
      expect(snip.burnOnRead).toBe(true)
    })

    it('creates two snips with unique ids', async () => {
      const a = await adapter.create({ content: 'a' })
      const b = await adapter.create({ content: 'b' })
      expect(a.id).not.toBe(b.id)
    })
  })

  describe('get', () => {
    it('returns created snip', async () => {
      const created = await adapter.create({ content: 'find me' })
      const fetched = await adapter.get(created.id)
      expect(fetched.id).toBe(created.id)
      expect(fetched.content).toBe('find me')
    })

    it('throws SnipNotFoundError for missing id', async () => {
      await expect(adapter.get('doesnotexist12')).rejects.toThrow(SnipNotFoundError)
    })

    it('throws SnipAlreadyBurnedError for already-burned snip', async () => {
      const created = await adapter.create({ content: 'burn', burnOnRead: true })
      await adapter.get(created.id)
      await expect(adapter.get(created.id)).rejects.toThrow(SnipAlreadyBurnedError)
    })

    it('throws SnipExpiredError for expired snip', async () => {
      const created = await adapter.create({
        content: 'expired',
        expiresAt: new Date(Date.now() - 1_000),
      })
      await expect(adapter.get(created.id)).rejects.toThrow(SnipExpiredError)
    })

    it('checks burned before expired (expiry check order)', async () => {
      const created = await adapter.create({
        content: 'burned-then-expired',
        burnOnRead: true,
        expiresAt: new Date(Date.now() - 1_000),
      })
      await adapter.get(created.id)
      await expect(adapter.get(created.id)).rejects.toThrow(SnipAlreadyBurnedError)
    })

    it('burn-on-read: first read succeeds', async () => {
      const created = await adapter.create({ content: 'secret', burnOnRead: true })
      const fetched = await adapter.get(created.id)
      expect(fetched.content).toBe('secret')
    })

    it('burn-on-read: second read throws SnipAlreadyBurnedError', async () => {
      const created = await adapter.create({ content: 'secret', burnOnRead: true })
      await adapter.get(created.id)
      await expect(adapter.get(created.id)).rejects.toThrow(SnipAlreadyBurnedError)
    })
  })

  describe('delete', () => {
    it('removes existing snip', async () => {
      const created = await adapter.create({ content: 'to delete' })
      await adapter.delete(created.id)
      await expect(adapter.get(created.id)).rejects.toThrow(SnipNotFoundError)
    })

    it('delete is idempotent', async () => {
      await adapter.delete('nonexistent')
    })
  })

  describe('sweep', () => {
    it('returns 0 when no expired snips exist', async () => {
      await adapter.create({ content: 'not expired' })
      const count = await adapter.sweep()
      expect(count).toBe(0)
    })

    it('removes expired snips and returns count', async () => {
      await adapter.create({ content: 'a', expiresAt: new Date(Date.now() - 60_000) })
      await adapter.create({ content: 'b', expiresAt: new Date(Date.now() - 60_000) })
      await adapter.create({ content: 'c' })
      const count = await adapter.sweep()
      expect(count).toBe(2)
    })

    it('does not remove non-expired snips', async () => {
      const created = await adapter.create({
        content: 'keep',
        expiresAt: new Date(Date.now() + 60_000),
      })
      await adapter.sweep()
      const fetched = await adapter.get(created.id)
      expect(fetched.content).toBe('keep')
    })
  })
})
