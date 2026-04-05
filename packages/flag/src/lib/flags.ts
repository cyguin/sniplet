import type { Flag, FlagEvaluationContext, EvaluationResult } from '../types'

// MurmurHash3 for consistent bucketing
function murmurhash3(key: string, seed: number = 0): number {
  const data = new TextEncoder().encode(key)
  const len = data.length
  let h1 = seed
  
  const c1 = 0xcc9e2d51
  const c2 = 0x1b873593
  
  const numBlocks = Math.floor(len / 4)
  const blockSize = 4 * numBlocks
  
  for (let i = 0; i < numBlocks; i++) {
    let k1 = 
      (data[i * 4]) |
      (data[i * 4 + 1] << 8) |
      (data[i * 4 + 2] << 16) |
      (data[i * 4 + 3] << 24)
    
    k1 = Math.imul(k1, c1)
    k1 = (k1 << 15) | (k1 >>> 17)
    h1 = Math.imul(h1 ^ k1, c2)
  }
  
  const tail = len % 4
  let k1 = 0
  
  if (tail >= 3) k1 ^= data[blockSize + 2] << 16
  if (tail >= 2) k1 ^= data[blockSize + 1] << 8
  if (tail >= 1) {
    k1 ^= data[blockSize]
    k1 = Math.imul(k1, c1)
    k1 = (k1 << 15) | (k1 >>> 17)
    h1 ^= k1
  }
  
  h1 ^= len
  h1 ^= h1 >>> 16
  h1 = Math.imul(h1, 0x85ebca6b)
  h1 ^= h1 >>> 13
  h1 = Math.imul(h1, 0xc2b2ae35)
  h1 ^= h1 >>> 16
  
  return h1 >>> 0
}

function hashToPercentile(key: string): number {
  const hash = murmurhash3(key, 0)
  return (hash % 10000) / 100
}

export function evaluateFlag(
  flag: Flag,
  context: FlagEvaluationContext = {}
): EvaluationResult {
  const { userId } = context
  
  if (userId && flag.userIds && flag.userIds.length > 0) {
    if (flag.userIds.includes(userId)) {
      return { enabled: true, reason: 'user-targeting' }
    }
  }
  
  if (flag.rolloutPercentage < 100 && userId) {
    const bucket = hashToPercentile(userId)
    const enabled = bucket < flag.rolloutPercentage
    return { 
      enabled, 
      reason: enabled ? 'percentage-rollout' : 'default' 
    }
  }
  
  return { 
    enabled: flag.enabled, 
    reason: flag.enabled ? 'boolean' : 'default' 
  }
}

export function isEnabled(
  flag: Flag,
  context: FlagEvaluationContext = {}
): boolean {
  return evaluateFlag(flag, context).enabled
}

export { murmurhash3, hashToPercentile }
