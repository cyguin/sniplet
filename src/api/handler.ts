import { nanoid } from 'nanoid'
import type {
  Snip,
  CreateSnipInput,
  SnipletAdapter,
  SnipletOptions,
  SnipletError,
  ExpiryOption,
  SnipletConfig,
} from '../types'
import {
  SnipNotFoundError,
  SnipExpiredError,
  SnipBurnedError,
  RateLimitError,
} from '../types'

export type { SnipletConfig, SnipletOptions, ExpiryOption }

const DEFAULT_EXPIRY_OPTIONS: ExpiryOption[] = [
  { label: 'Never', value: '' },
  { label: '1 hour', value: '1h' },
  { label: '1 day', value: '1d' },
  { label: '7 days', value: '7d' },
  { label: 'Burn on read', value: 'burn' },
]

function parseExpiry(value: string | undefined, defaultValue: string): number | null {
  if (!value || value === '' || value === 'burn') return null
  const match = value.match(/^(\d+)(h|d|m)$/)
  if (!match) return null
  const n = parseInt(match[1])
  const unit = match[2]
  const ms = unit === 'h' ? 3600000 : unit === 'd' ? 86400000 : 60000
  return Date.now() + n * ms
}

function getBurnExpiry(): null {
  return null
}

export function createSnipletHandler(config: SnipletConfig) {
  const { adapter, options = {} } = config
  const {
    maxLength = 100_000,
    defaultExpiry = '7d',
    allowAnonymous = true,
    rateLimit,
  } = options

  async function handleGet(
    req: Request,
    context: { params: Promise<{ cyguin: string[] }> }
  ): Promise<Response> {
    const { cyguin } = await context.params

    if (cyguin?.[0] === 'options') {
      return Response.json(DEFAULT_EXPIRY_OPTIONS)
    }

    const id = cyguin?.[0]
    if (!id) {
      return Response.json({ error: 'ID required' }, { status: 400 })
    }

    if (rateLimit && adapter.listByIp) {
      const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? 'unknown'
      const windowMs = parseWindow(rateLimit.window)
      const count = await adapter.listByIp(ip, windowMs, rateLimit.max)
      if (count >= rateLimit.max) {
        return Response.json(
          { error: 'Rate limit exceeded', code: 'RATE_LIMITED' },
          { status: 429 }
        )
      }
    }

    const snip = await adapter.findById(id)
    if (!snip) {
      const error: SnipletError = new SnipNotFoundError(id)
      return Response.json({ error: error.message, code: error.code }, { status: 404 })
    }

    if (snip.expires_at && Date.now() > snip.expires_at) {
      await adapter.delete(id)
      const error: SnipletError = new SnipExpiredError(id)
      return Response.json({ error: error.message, code: error.code }, { status: 410 })
    }

    if (snip.burn_on_read) {
      await adapter.delete(id)
      const error: SnipletError = new SnipBurnedError(id)
      return Response.json({ error: error.message, code: error.code }, { status: 410 })
    }

    await adapter.incrementViews(id)
    const updated = await adapter.findById(id)
    return Response.json(updated)
  }

  async function handlePost(
    req: Request,
    context: { params: Promise<{ cyguin: string[] }> }
  ): Promise<Response> {
    if (rateLimit && adapter.recordAccess) {
      const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? 'unknown'
      const windowMs = parseWindow(rateLimit.window)
      await adapter.recordAccess(ip, windowMs)
    }

    let body: Partial<CreateSnipInput & { expires_in?: string; burn_on_read?: boolean }>
    try {
      body = await req.json()
    } catch {
      return Response.json({ error: 'Invalid JSON' }, { status: 400 })
    }

    const { title, language, content, expires_in, burn_on_read } = body

    if (!title || typeof title !== 'string') {
      return Response.json({ error: 'title is required' }, { status: 400 })
    }
    if (!language || typeof language !== 'string') {
      return Response.json({ error: 'language is required' }, { status: 400 })
    }
    if (!content || typeof content !== 'string') {
      return Response.json({ error: 'content is required' }, { status: 400 })
    }
    if (content.length > maxLength) {
      return Response.json(
        { error: `Content exceeds max length of ${maxLength} bytes` },
        { status: 400 }
      )
    }

    const isBurn = burn_on_read || expires_in === 'burn'
    const expires_at = isBurn
      ? null
      : parseExpiry(expires_in ?? defaultExpiry, defaultExpiry)

    const id = nanoid(10)
    const created_at = Date.now()

    const snip = await adapter.create({
      id,
      title,
      language,
      content,
      burn_on_read: isBurn,
      expires_at,
      created_at,
    })

    return Response.json(snip, { status: 201 })
  }

  async function handleDelete(
    req: Request,
    context: { params: Promise<{ cyguin: string[] }> }
  ): Promise<Response> {
    const { cyguin } = await context.params
    const id = cyguin?.[0]
    if (!id) {
      return Response.json({ error: 'ID required' }, { status: 400 })
    }
    await adapter.delete(id)
    return new Response(null, { status: 204 })
  }

  return async function handler(req: Request, context: { params: Promise<{ cyguin: string[] }> }) {
    if (req.method === 'GET') return handleGet(req, context)
    if (req.method === 'POST') return handlePost(req, context)
    if (req.method === 'DELETE') return handleDelete(req, context)
    return Response.json({ error: 'Method not allowed' }, { status: 405 })
  }
}

function parseWindow(window: string): number {
  const match = window.match(/^(\d+)(m|h|d)$/)
  if (!match) return 60000
  const n = parseInt(match[1])
  const unit = match[2]
  return unit === 'm' ? n * 60000 : unit === 'h' ? n * 3600000 : n * 86400000
}
