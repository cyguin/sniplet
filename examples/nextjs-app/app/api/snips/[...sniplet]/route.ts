import { createSnipletHandler } from '@cyguin/sniplet/next'
import { PostgresAdapter } from '@cyguin/sniplet/adapters/postgres'
import { NextRequest } from 'next/server'

const dbUrl = process.env.DATABASE_URL

const adapter = dbUrl ? new PostgresAdapter(dbUrl) : null

const baseHandler = adapter
  ? createSnipletHandler({ adapter })
  : null

async function handler(
  request: NextRequest,
  context: { params?: { sniplet?: string[] } },
) {
  console.log('[sniplet] handler called:', request.method, JSON.stringify(context.params))
  if (!baseHandler) {
    return Response.json({ error: 'DATABASE_URL not configured' }, { status: 500 })
  }
  return baseHandler(request, context)
}

export { handler as GET, handler as POST, handler as DELETE }
