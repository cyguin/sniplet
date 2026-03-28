import { NextRequest, NextResponse } from 'next/server.js'
import type { SnipletAdapter, Snip } from '../core/types.js'
import {
  SnipNotFoundError,
  SnipAlreadyBurnedError,
  SnipExpiredError,
} from '../core/errors.js'
import type { SnipletConfig, ExpiryOption } from './types.js'
import { checkRateLimit } from './middleware.js'

const DEFAULT_MAX_LENGTH = 100_000
const DEFAULT_EXPIRY: ExpiryOption = '7d'

function parseExpiryString(
  option: ExpiryOption | undefined,
  defaultExpiry: ExpiryOption,
): Date | null {
  const value = option ?? defaultExpiry
  switch (value) {
    case '1h': return new Date(Date.now() + 60 * 60 * 1000)
    case '24h': return new Date(Date.now() + 24 * 60 * 60 * 1000)
    case '7d': return new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
    case 'never': return null
  }
}

function buildUrl(base: string, id: string): string {
  const baseUrl = base.endsWith('/') ? base.slice(0, -1) : base
  return `${baseUrl}/${id}`
}

function snipToJson(snip: Snip): Record<string, unknown> {
  return {
    id: snip.id,
    content: snip.content,
    language: snip.language,
    expiresAt: snip.expiresAt?.toISOString() ?? null,
    burnOnRead: snip.burnOnRead,
    burnedAt: snip.burnedAt?.toISOString() ?? null,
    createdAt: snip.createdAt.toISOString(),
  }
}

export function createSnipletHandler(config: SnipletConfig) {
  const adapter = config.adapter
  const opts = config.options ?? {}
  const maxLength = opts.maxLength ?? DEFAULT_MAX_LENGTH
  const defaultExpiry = opts.defaultExpiry ?? DEFAULT_EXPIRY
  const rateLimit = opts.rateLimit

  return async function handler(
    request: NextRequest,
    context: { params?: { sniplet?: string[] } },
  ): Promise<NextResponse> {
    const segments = context.params?.sniplet ?? []
    const method = request.method

    if (method === 'POST' && segments.length === 0) {
      if (rateLimit) {
        const result = checkRateLimit(request, rateLimit.window, rateLimit.max)
        if (result === 'rate_limited') {
          return NextResponse.json(
            { error: 'too many requests' },
            { status: 429 },
          )
        }
      }
      return handleCreate(request, { adapter, maxLength, defaultExpiry })
    }

    if (method === 'GET' && segments.length === 1) {
      return handleGet(segments[0], adapter)
    }

    if (method === 'DELETE' && segments.length === 1) {
      return handleDelete(segments[0], adapter)
    }

    return NextResponse.json({ error: 'not found' }, { status: 404 })
  }
}

async function handleCreate(
  request: NextRequest,
  config: { adapter: SnipletAdapter; maxLength: number; defaultExpiry: ExpiryOption },
): Promise<NextResponse> {
  let body: Record<string, unknown>
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'invalid request body' }, { status: 400 })
  }

  const content = body.content
  if (typeof content !== 'string' || content.length === 0) {
    return NextResponse.json({ error: 'content is required' }, { status: 400 })
  }
  if (content.length > config.maxLength) {
    return NextResponse.json(
      { error: `content exceeds maximum length of ${config.maxLength}` },
      { status: 400 },
    )
  }

  const expiryOption = body.expiry as ExpiryOption | undefined
  const expiresAt = parseExpiryString(expiryOption, config.defaultExpiry)

  const snip = await config.adapter.create({
    content,
    language: typeof body.language === 'string' ? body.language : undefined,
    expiresAt: expiresAt ?? undefined,
    burnOnRead: body.burnOnRead === true,
  })

  const url = buildUrl('/api/snips', snip.id)
  return NextResponse.json({ id: snip.id, url }, { status: 201 })
}

async function handleGet(
  id: string,
  adapter: SnipletAdapter,
): Promise<NextResponse> {
  try {
    const snip = await adapter.get(id)
    return NextResponse.json(snipToJson(snip), { status: 200 })
  } catch (err) {
    if (err instanceof SnipNotFoundError) {
      return NextResponse.json({ error: 'not found' }, { status: 404 })
    }
    if (err instanceof SnipAlreadyBurnedError) {
      return NextResponse.json({ error: 'gone' }, { status: 410 })
    }
    if (err instanceof SnipExpiredError) {
      return NextResponse.json({ error: 'gone' }, { status: 410 })
    }
    console.error('[sniplet] unexpected error:', err)
    return NextResponse.json(
      { error: 'internal server error' },
      { status: 500 },
    )
  }
}

async function handleDelete(
  id: string,
  adapter: SnipletAdapter,
): Promise<NextResponse> {
  try {
    await adapter.get(id)
    await adapter.delete(id)
    return new NextResponse(null, { status: 204 })
  } catch (err) {
    if (err instanceof SnipNotFoundError) {
      return NextResponse.json({ error: 'not found' }, { status: 404 })
    }
    console.error('[sniplet] unexpected error:', err)
    return NextResponse.json(
      { error: 'internal server error' },
      { status: 500 },
    )
  }
}

export { handleCreate, handleGet, handleDelete }
