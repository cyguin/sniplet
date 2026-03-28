import { createSnipletHandler } from '@cyguin/sniplet/next'
import { SQLiteAdapter } from '@cyguin/sniplet/adapters/sqlite'

const adapter = new SQLiteAdapter(process.env.SNIPLET_DB_PATH ?? './data/sniplet.db')

const handler = createSnipletHandler({ adapter })

export { handler as GET, handler as POST, handler as DELETE }
