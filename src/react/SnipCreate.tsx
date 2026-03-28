'use client'

import { useState, type FormEvent, type ChangeEvent } from 'react'
import type { ExpiryOption } from '../next/types.js'

interface SnipCreateProps {
  apiBase?: string
  onSuccess?: (id: string, url: string) => void
  className?: string
  variant?: 'base' | 'tailwind'
}

const EXPIRY_OPTIONS: { value: ExpiryOption; label: string }[] = [
  { value: '1h', label: '1 hour' },
  { value: '24h', label: '24 hours' },
  { value: '7d', label: '7 days' },
  { value: 'never', label: 'Never' },
]

export function SnipCreate({
  apiBase = '/api/snips',
  onSuccess,
  className = '',
  variant = 'base',
}: SnipCreateProps) {
  const [content, setContent] = useState('')
  const [language, setLanguage] = useState('')
  const [expiry, setExpiry] = useState<ExpiryOption>('7d')
  const [burnOnRead, setBurnOnRead] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const baseClasses = 'sniplet-create'
  const tailwindClasses = variant === 'tailwind'
    ? 'flex flex-col gap-3 max-w-xl'
    : ''
  const rootClass = `${baseClasses} ${tailwindClasses} ${className}`.trim()

  const textareaClasses = variant === 'tailwind'
    ? 'w-full p-3 border border-gray-300 rounded font-mono text-sm'
    : ''
  const inputClasses = variant === 'tailwind'
    ? 'w-full p-2 border border-gray-300 rounded text-sm'
    : ''
  const selectClasses = variant === 'tailwind'
    ? 'p-2 border border-gray-300 rounded text-sm'
    : ''
  const checkboxClasses = variant === 'tailwind'
    ? 'w-4 h-4'
    : ''
  const labelClasses = variant === 'tailwind'
    ? 'flex items-center gap-2 text-sm text-gray-700'
    : ''
  const buttonClasses = variant === 'tailwind'
    ? 'px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50'
    : ''

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setSubmitting(true)
    setError(null)

    try {
      const res = await fetch(apiBase, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content,
          language: language || undefined,
          expiry,
          burnOnRead,
        }),
      })

      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error((data as { error?: string }).error ?? 'failed to create snip')
      }

      const data = (await res.json()) as { id: string; url: string }
      setContent('')
      setLanguage('')
      setExpiry('7d')
      setBurnOnRead(false)
      onSuccess?.(data.id, data.url)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'unknown error')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className={rootClass}>
      <textarea
        value={content}
        onChange={(e: ChangeEvent<HTMLTextAreaElement>) => setContent(e.target.value)}
        placeholder="Paste your snippet here..."
        rows={10}
        required
        className={textareaClasses || undefined}
        style={!variant ? {
          width: '100%',
          padding: '0.75rem',
          fontFamily: 'monospace',
          fontSize: '0.875rem',
          border: '1px solid #ccc',
          borderRadius: '0.25rem',
        } : undefined}
      />

      <input
        type="text"
        value={language}
        onChange={(e: ChangeEvent<HTMLInputElement>) => setLanguage(e.target.value)}
        placeholder="Language (e.g. typescript, python)"
        className={inputClasses || undefined}
        style={!variant ? {
          width: '100%',
          padding: '0.5rem',
          fontSize: '0.875rem',
          border: '1px solid #ccc',
          borderRadius: '0.25rem',
        } : undefined}
      />

      <select
        value={expiry}
        onChange={(e: ChangeEvent<HTMLSelectElement>) => setExpiry(e.target.value as ExpiryOption)}
        className={selectClasses || undefined}
        style={!variant ? {
          padding: '0.5rem',
          fontSize: '0.875rem',
          border: '1px solid #ccc',
          borderRadius: '0.25rem',
        } : undefined}
      >
        {EXPIRY_OPTIONS.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>

      <label className={labelClasses || undefined}>
        <input
          type="checkbox"
          checked={burnOnRead}
          onChange={(e: ChangeEvent<HTMLInputElement>) => setBurnOnRead(e.target.checked)}
          className={checkboxClasses || undefined}
        />
        Burn after reading
      </label>

      {error && (
        <p
          style={!variant ? { color: '#dc2626', fontSize: '0.875rem' } : undefined}
          className={variant === 'tailwind' ? 'text-red-600 text-sm' : ''}
        >
          {error}
        </p>
      )}

      <button
        type="submit"
        disabled={submitting || !content}
        className={buttonClasses || undefined}
        style={!variant ? {
          padding: '0.5rem 1rem',
          backgroundColor: '#2563eb',
          color: '#fff',
          border: 'none',
          borderRadius: '0.25rem',
          cursor: 'pointer',
        } : undefined}
      >
        {submitting ? 'Creating...' : 'Create Snip'}
      </button>
    </form>
  )
}
