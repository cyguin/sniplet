import type { AdapterConfig, DatabaseAdapter } from '../types'

export function getAdapterConfig(): AdapterConfig {
  const adapter = (process.env.FLAG_DB_ADAPTER || 'sqlite') as DatabaseAdapter
  
  return {
    adapter,
    connectionString: process.env.DATABASE_URL || process.env.TURSO_DB_URL,
    authToken: process.env.TURSO_DB_AUTH_TOKEN,
  }
}

export function createDatabaseClient() {
  const config = getAdapterConfig()
  
  if (config.adapter === 'postgresql') {
    const { createClient } = require('@libsql/client')
    return createClient({
      url: config.connectionString || 'file:local.db',
      authToken: config.authToken,
    })
  }
  
  // Default: SQLite via libSQL (Turso-compatible)
  const { createClient } = require('@libsql/client')
  return createClient({
    url: config.connectionString || 'file:local.db',
    authToken: config.authToken,
  })
}
