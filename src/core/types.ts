export interface Snip {
  id: string
  content: string
  language: string | null
  expiresAt: Date | null
  burnOnRead: boolean
  burnedAt: Date | null
  createdAt: Date
}

export interface CreateSnipInput {
  content: string
  language?: string
  expiresAt?: Date | null
  burnOnRead?: boolean
}

export interface SnipletAdapter {
  create(input: CreateSnipInput): Promise<Snip>
  get(id: string): Promise<Snip>
  delete(id: string): Promise<void>
  sweep(): Promise<number>
}
