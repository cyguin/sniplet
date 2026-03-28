import { createSnipletHandler } from '@cyguin/sniplet/next'
import { PostgresAdapter } from '@cyguin/sniplet/adapters/postgres'

const adapter = new PostgresAdapter(process.env.DATABASE_URL ?? '')

const handler = createSnipletHandler({ adapter })

export { handler as GET, handler as POST, handler as DELETE }
