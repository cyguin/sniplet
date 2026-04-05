export interface Flag {
  name: string
  enabled: boolean
  rolloutPercentage: number
  userIds: string[]
  createdAt?: string
  updatedAt?: string
}

export interface FlagConfig {
  enabled?: boolean
  rolloutPercentage?: number
  userIds?: string[]
}

export interface FlagEvaluationContext {
  userId?: string
}

export interface EvaluationResult {
  enabled: boolean
  reason: 'boolean' | 'user-targeting' | 'percentage-rollout' | 'default'
}

export type DatabaseAdapter = 'sqlite' | 'postgresql'

export interface AdapterConfig {
  adapter: DatabaseAdapter
  connectionString?: string
  authToken?: string
}
