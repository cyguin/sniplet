/**
 * Base error class for all sniplet errors. Errors are mapped to HTTP status codes
 * by the route handler.
 *
 * @example
 * ```typescript
 * import { SnipletError } from '@cyguin/sniplet'
 *
 * try {
 *   const snip = await adapter.get('abc123')
 * } catch (err) {
 *   if (err instanceof SnipletError) {
 *     console.error(err.code) // e.g. 'SNIP_NOT_FOUND'
 *   }
 * }
 * ```
 */
export class SnipletError extends Error {
  constructor(message: string, public readonly code: string) {
    super(message)
    this.name = 'SnipletError'
  }
}

/** Thrown when a snip does not exist. Maps to HTTP 404. */
export class SnipNotFoundError extends SnipletError {
  constructor(id: string) {
    super(`Snip not found: ${id}`, 'SNIP_NOT_FOUND')
  }
}

/** Thrown when a burn-on-read snip has already been consumed. Maps to HTTP 410. */
export class SnipAlreadyBurnedError extends SnipletError {
  constructor(id: string) {
    super(`Snip already burned: ${id}`, 'SNIP_ALREADY_BURNED')
  }
}

/** Thrown when a snip has passed its expiry date. Maps to HTTP 410. */
export class SnipExpiredError extends SnipletError {
  constructor(id: string) {
    super(`Snip expired: ${id}`, 'SNIP_EXPIRED')
  }
}
