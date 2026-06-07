import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import Database from 'better-sqlite3'
import { SQLiteAdapter } from '../src/adapters/sqlite'

describe('Sniplet SQLiteAdapter', () => {
  const adapter = SQLiteAdapter({ path: ':memory:' })

  it('creates a snip', async () => {
    const snip = await adapter.create({
      id: 'test-1',
      title: 'Hello',
      language: 'typescript',
      content: 'console.log("hi")',
      burn_on_read: false,
      expires_at: null,
      created_at: Date.now(),
    })
    expect(snip.id).toBe('test-1')
    expect(snip.title).toBe('Hello')
    expect(snip.view_count).toBe(0)
  })

  it('finds a snip by id', async () => {
    const snip = await adapter.findById('test-1')
    expect(snip).not.toBeNull()
    expect(snip!.title).toBe('Hello')
    expect(snip!.burn_on_read).toBe(false)
  })

  it('returns null for missing snip', async () => {
    const snip = await adapter.findById('nonexistent')
    expect(snip).toBeNull()
  })

  it('increments view count', async () => {
    await adapter.incrementViews('test-1')
    const snip = await adapter.findById('test-1')
    expect(snip!.view_count).toBe(1)
  })

  it('deletes a snip', async () => {
    await adapter.create({
      id: 'test-delete',
      title: 'Delete me',
      language: 'text',
      content: 'gone',
      burn_on_read: false,
      expires_at: null,
      created_at: Date.now(),
    })
    await adapter.delete('test-delete')
    const snip = await adapter.findById('test-delete')
    expect(snip).toBeNull()
  })

  it('tracks access for rate limiting', async () => {
    const count = await adapter.listByIp!('1.2.3.4', 60000, 10)
    expect(count).toBe(0)
    await adapter.recordAccess!('1.2.3.4', 60000)
    const after = await adapter.listByIp!('1.2.3.4', 60000, 10)
    expect(after).toBe(1)
  })

  it('marks burn_on_read snips', async () => {
    const snip = await adapter.create({
      id: 'test-burn',
      title: 'Burn',
      language: 'text',
      content: 'secret',
      burn_on_read: true,
      expires_at: null,
      created_at: Date.now(),
    })
    expect(snip.burn_on_read).toBe(true)
    const found = await adapter.findById('test-burn')
    expect(found!.burn_on_read).toBe(true)
  })
})
