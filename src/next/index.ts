/**
 * Creates a Next.js App Router route handler for snip CRUD operations.
 *
 * @example
 * ```typescript
 * // app/api/snips/[...sniplet]/route.ts
 * import { createSnipletHandler } from '@cyguin/sniplet/next'
 * import { SQLiteAdapter } from '@cyguin/sniplet/adapters/sqlite'
 *
 * const handler = createSnipletHandler(new SQLiteAdapter('./data/snips.db'))
 *
 * export { GET, POST, DELETE } = handler
 * ```
 */
export { createSnipletHandler } from './handler.js'
export type { SnipletConfig, SnipletOptions, ExpiryOption } from './types.js'
