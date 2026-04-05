// Core exports
export type { Flag as FlagData, FlagConfig, FlagEvaluationContext, EvaluationResult } from './types'
export { evaluateFlag, isEnabled, murmurhash3, hashToPercentile } from './lib/flags'
export { getAdapterConfig, createDatabaseClient } from './lib/adapter'
export { flagsSqlite, flagsPg, type FlagDb } from './db'

// DB operations
export { getDb, getAllFlagsDb, setFlagDb, deleteFlagDb } from './lib/db-client'

// React components
export {
  FlagProvider,
  useFlagContext,
  FlagContext,
  type FlagProviderProps,
} from './components/FlagProvider'
export { Flag, type FlagProps } from './components/Flag'
export { useFlag, type UseFlagOptions, type UseFlagResult } from './components/useFlag'
