import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { join } from 'path'
import { unlinkSync, existsSync } from 'fs'
import { randomUUID } from 'crypto'
import { SQLiteAdapter } from '../src/adapters/sqlite.js'
import { createSnipletHandler } from '../src/next/handler.js'

function makeTempDb(): string {
  return join('/tmp', `sniplet-test-${randomUUID()}.db`)
}

function cleanupDb(path: string): void {
  for (const suffix of ['', '-wal', '-shm']) {
    try {
      const f = path + suffix
      if (existsSync(f)) unlinkSync(f)
    } catch { /* ignore */ }
  }
}

class MockNextRequest {
  private body: Record<string, unknown>
  public method: string
  public url: string
  public headers: Map<string, string | null>

  constructor(init: {
    method?: string
    url?: string
    body?: Record<string, unknown>
    headers?: Map<string, string | null>
  }) {
    this.method = init.method ?? 'GET'
    this.url = init.url ?? 'http://localhost/api/snips'
    this.body = init.body ?? {}
    this.headers = init.headers ?? new Map()
  }

  async json(): Promise<Record<string, unknown>> {
    return this.body
  }

  get(name: string): string | null {
    return this.headers.get(name) ?? null
  }
}

function createMockContext(sniplet?: string[]): { params: { sniplet?: string[] } } {
  return { params: { sniplet } }
}

function mockRequest(
  overrides: Partial<{
    method: string
    url: string
    body: Record<string, unknown>
    headers: Map<string, string | null>
  }> = {},
): MockNextRequest {
  return new MockNextRequest({
    method: 'GET',
    url: 'http://localhost/api/snips',
    headers: new Map(),
    ...overrides,
  })
}

function mockResponse(response: { status: number; body: unknown }): {
  status: number
  body: unknown
} {
  return response
}

function createHandler(overrides?: {
  maxLength?: number
  defaultExpiry?: '1h' | '24h' | '7d' | 'never'
  rateLimit?: { window: string; max: number }
}) {
  const adapter = new SQLiteAdapter(makeTempDb())
  const handler = createSnipletHandler({
    adapter,
    options: overrides,
  })
  return { handler, adapter }
}

describe('createSnipletHandler', () => {
  let adapter: SQLiteAdapter
  let dbPath: string
  let handler: ReturnType<typeof createSnipletHandler>

  beforeEach(() => {
    dbPath = makeTempDb()
    adapter = new SQLiteAdapter(dbPath)
    handler = createSnipletHandler({ adapter })
  })

  afterEach(() => {
    adapter.close()
    cleanupDb(dbPath)
  })

  describe('POST /api/snips', () => {
    it('TRUTH-2: creates a snip and returns 201 with id and url', async () => {
      const req = mockRequest({
        method: 'POST',
        url: 'http://localhost/api/snips',
        body: { content: 'hello world' },
      })
      const res = await handler(req, createMockContext())
      expect(res.status).toBe(201)
      const json = await res.json()
      expect(json).toHaveProperty('id')
      expect((json as { id: string }).id).toHaveLength(12)
      expect(json).toHaveProperty('url')
      expect((json as { url: string }).url).toBe('/api/snips/' + (json as { id: string }).id)
    })

    it('creates snip with language, expiry, burnOnRead', async () => {
      const req = mockRequest({
        method: 'POST',
        url: 'http://localhost/api/snips',
        body: {
          content: 'const x = 1',
          language: 'typescript',
          expiry: '24h',
          burnOnRead: true,
        },
      })
      const res = await handler(req, createMockContext())
      expect(res.status).toBe(201)
    })

    it('TRUTH-8: returns 400 if content is missing', async () => {
      const req = mockRequest({ method: 'POST', body: {} })
      const res = await handler(req, createMockContext())
      expect(res.status).toBe(400)
      const json = await res.json()
      expect((json as { error: string }).error).toContain('required')
    })

    it('TRUTH-9: returns 400 if content exceeds maxLength', async () => {
      const { handler: limitedHandler, adapter: a2, dbPath: dp2 } = createHandler({ maxLength: 10 })
      try {
        const req = mockRequest({ method: 'POST', body: { content: 'a'.repeat(11) } })
        const res = await limitedHandler(req, createMockContext())
        expect(res.status).toBe(400)
        const json = await res.json()
        expect((json as { error: string }).error).toContain('maximum length')
      } finally {
        a2.close()
        cleanupDb(dp2)
      }
    })

    it('TRUTH-10: returns 429 when rate limit exceeded', async () => {
      const { handler: limitedHandler, adapter: a2, dbPath: dp2 } = createHandler({
        rateLimit: { window: '1m', max: 2 },
      })
      try {
        for (let i = 0; i < 2; i++) {
          const req = mockRequest({
            method: 'POST',
            body: { content: 'test' },
            headers: new Map([['x-forwarded-for', '192.168.1.1']]),
          })
          const res = await limitedHandler(req, createMockContext())
          expect(res.status).toBe(201)
        }
        const req = mockRequest({
          method: 'POST',
          body: { content: 'test' },
          headers: new Map([['x-forwarded-for', '192.168.1.1']]),
        })
        const res = await limitedHandler(req, createMockContext())
        expect(res.status).toBe(429)
        const json = await res.json()
        expect((json as { error: string }).error).toContain('too many')
      } finally {
        a2.close()
        cleanupDb(dp2)
      }
    })

    it('rate limit fails open when IP cannot be determined', async () => {
      const { handler: limitedHandler, adapter: a2, dbPath: dp2 } = createHandler({
        rateLimit: { window: '1m', max: 1 },
      })
      try {
        const req = mockRequest({
          method: 'POST',
          body: { content: 'test' },
          headers: new Map([['x-forwarded-for', '']]),
        })
        for (let i = 0; i < 5; i++) {
          const res = await limitedHandler(req, createMockContext())
          expect(res.status).toBe(201)
        }
      } finally {
        a2.close()
        cleanupDb(dp2)
      }
    })

    it('uses defaultExpiry when expiry not provided', async () => {
      const { handler: handler2, adapter: a2, dbPath: dp2 } = createHandler({
        defaultExpiry: '24h',
      })
      try {
        const req = mockRequest({
          method: 'POST',
          body: { content: 'test' },
        })
        const res = await handler2(req, createMockContext())
        expect(res.status).toBe(201)
      } finally {
        a2.close()
        cleanupDb(dp2)
      }
    })

    it('returns 400 for invalid JSON body', async () => {
      const badReq = new MockNextRequest({
        method: 'POST',
        url: 'http://localhost/api/snips',
        body: {},
      })
      badReq.json = async () => { throw new Error('parse error') }
      const res = await handler(badReq as never, createMockContext())
      expect(res.status).toBe(400)
    })
  })

  describe('GET /api/snips/[id]', () => {
    it('TRUTH-3: returns snip JSON on 200', async () => {
      const createReq = mockRequest({ method: 'POST', body: { content: 'find me' } })
      const createRes = await handler(createReq, createMockContext())
      const { id } = await createRes.json() as { id: string }

      const getReq = mockRequest({ method: 'GET', url: `http://localhost/api/snips/${id}` })
      const getRes = await handler(getReq, createMockContext([id]))
      expect(getRes.status).toBe(200)
      const json = await getRes.json()
      expect((json as { content: string }).content).toBe('find me')
      expect(json).toHaveProperty('id')
      expect(json).toHaveProperty('language')
      expect(json).toHaveProperty('expiresAt')
      expect(json).toHaveProperty('burnOnRead')
      expect(json).toHaveProperty('createdAt')
    })

    it('TRUTH-4: returns 404 for unknown id', async () => {
      const req = mockRequest({ method: 'GET', url: 'http://localhost/api/snips/notfound12' })
      const res = await handler(req, createMockContext(['notfound12']))
      expect(res.status).toBe(404)
      const json = await res.json()
      expect((json as { error: string }).error).toBe('not found')
    })

    it('TRUTH-5: returns 410 for burned snip', async () => {
      const createReq = mockRequest({
        method: 'POST',
        body: { content: 'secret', burnOnRead: true },
      })
      const createRes = await handler(createReq, createMockContext())
      const { id } = await createRes.json() as { id: string }

      const getReq1 = mockRequest({ method: 'GET', url: `http://localhost/api/snips/${id}` })
      await handler(getReq1, createMockContext([id]))

      const getReq2 = mockRequest({ method: 'GET', url: `http://localhost/api/snips/${id}` })
      const res = await handler(getReq2, createMockContext([id]))
      expect(res.status).toBe(410)
      const json = await res.json()
      expect((json as { error: string }).error).toBe('gone')
    })

    it('TRUTH-6: returns 410 for expired snip', async () => {
      const createReq = mockRequest({
        method: 'POST',
        body: {
          content: 'expired content',
          expiry: '1h',
        },
      })
      const createRes = await handler(createReq, createMockContext())
      const { id } = await createRes.json() as { id: string }

      const expiredAdapter = new SQLiteAdapter(dbPath)
      const pastDate = new Date(Date.now() - 60_000)
      expiredAdapter as unknown as { db: { prepare: (sql: string) => { run: (date: string) => void } } }
      ;(expiredAdapter as unknown as { db: { prepare: (sql: string) => { run: (date: string) => void } } }).db
        .prepare('UPDATE sniplet_snips SET expires_at = ? WHERE id = ?')
        .run(pastDate.toISOString(), id)
      expiredAdapter.close()

      const getReq = mockRequest({ method: 'GET', url: `http://localhost/api/snips/${id}` })
      const res = await handler(getReq, createMockContext([id]))
      expect(res.status).toBe(410)
      const json = await res.json()
      expect((json as { error: string }).error).toBe('gone')
    })

    it('TRUTH-11: error internals never leak to response body', async () => {
      const req = mockRequest({ method: 'GET', url: 'http://localhost/api/snips/notfound12' })
      const res = await handler(req, createMockContext(['notfound12']))
      const json = await res.json()
      expect((json as { error: string }).error).not.toContain('stack')
      expect((json as { error: string }).error).not.toContain('SnipNotFoundError')
    })
  })

  describe('DELETE /api/snips/[id]', () => {
    it('TRUTH-7: returns 204 and snip is gone', async () => {
      const createReq = mockRequest({ method: 'POST', body: { content: 'to delete' } })
      const createRes = await handler(createReq, createMockContext())
      const { id } = await createRes.json() as { id: string }

      const delReq = mockRequest({ method: 'DELETE', url: `http://localhost/api/snips/${id}` })
      const delRes = await handler(delReq, createMockContext([id]))
      expect(delRes.status).toBe(204)

      const getReq = mockRequest({ method: 'GET', url: `http://localhost/api/snips/${id}` })
      const getRes = await handler(getReq, createMockContext([id]))
      expect(getRes.status).toBe(404)
    })

    it('returns 404 when deleting non-existent snip', async () => {
      const req = mockRequest({ method: 'DELETE', url: 'http://localhost/api/snips/notfound12' })
      const res = await handler(req, createMockContext(['notfound12']))
      expect(res.status).toBe(404)
    })
  })

  describe('miscellaneous', () => {
    it('returns 404 for unknown route', async () => {
      const req = mockRequest({ method: 'GET' })
      const res = await handler(req, createMockContext(['a', 'b']))
      expect(res.status).toBe(404)
    })

    it('returns 404 for PUT method', async () => {
      const req = mockRequest({ method: 'PUT' })
      const res = await handler(req, createMockContext())
      expect(res.status).toBe(404)
    })
  })
})
