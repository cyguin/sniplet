export class SnipletError extends Error {
  constructor(message: string, public readonly code: string) {
    super(message)
    this.name = 'SnipletError'
  }
}

export class SnipNotFoundError extends SnipletError {
  constructor(id: string) {
    super(`Snip not found: ${id}`, 'SNIP_NOT_FOUND')
  }
}

export class SnipAlreadyBurnedError extends SnipletError {
  constructor(id: string) {
    super(`Snip already burned: ${id}`, 'SNIP_ALREADY_BURNED')
  }
}

export class SnipExpiredError extends SnipletError {
  constructor(id: string) {
    super(`Snip expired: ${id}`, 'SNIP_EXPIRED')
  }
}
