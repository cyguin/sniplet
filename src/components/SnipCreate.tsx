'use client'

import React, { useState, useCallback } from 'react'

export interface SnipCreateProps {
  apiBase?: string
  onSuccess?: (id: string, url: string) => void
  variant?: 'base' | 'tailwind'
  className?: string
  defaultLanguage?: string
  maxLength?: number
  theme?: 'light' | 'dark'
}

export function SnipCreate({
  apiBase = '/api/snips',
  onSuccess,
  variant = 'base',
  className = '',
  defaultLanguage = 'javascript',
  maxLength = 100000,
  theme = 'light',
}: SnipCreateProps) {
  const [title, setTitle] = useState('')
  const [language, setLanguage] = useState(defaultLanguage)
  const [content, setContent] = useState('')
  const [burn, setBurn] = useState(false)
  const [expiresIn, setExpiresIn] = useState('7d')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault()
      setLoading(true)
      setError('')

      try {
        const res = await fetch(apiBase, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ title, language, content, burn_on_read: burn, expires_in: expiresIn }),
        })

        if (!res.ok) {
          const data = await res.json()
          setError(data.error ?? 'Failed to create snip')
          return
        }

        const snip = await res.json()
        const url = `${window.location.origin}/snips/${snip.id}`
        onSuccess?.(snip.id, url)
      } catch (err) {
        setError('Network error')
      } finally {
        setLoading(false)
      }
    },
    [title, language, content, burn, expiresIn, apiBase, onSuccess]
  )

  const styles = getStyles(theme, loading)

  return (
    <form onSubmit={handleSubmit} style={styles.form} className={className}>
      <input
        type="text"
        placeholder="Title"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        required
        style={styles.input}
        maxLength={200}
      />

      <div style={styles.row}>
        <select value={language} onChange={(e) => setLanguage(e.target.value)} style={styles.select}>
          <option value="javascript">JavaScript</option>
          <option value="typescript">TypeScript</option>
          <option value="python">Python</option>
          <option value="rust">Rust</option>
          <option value="go">Go</option>
          <option value="bash">Bash</option>
          <option value="json">JSON</option>
          <option value="html">HTML</option>
          <option value="css">CSS</option>
          <option value="sql">SQL</option>
          <option value="markdown">Markdown</option>
        </select>

        <select value={expiresIn} onChange={(e) => setExpiresIn(e.target.value)} style={styles.select}>
          <option value="">Never</option>
          <option value="1h">1 hour</option>
          <option value="1d">1 day</option>
          <option value="7d">7 days</option>
          <option value="burn">Burn on read</option>
        </select>
      </div>

      <textarea
        placeholder="Paste your code here..."
        value={content}
        onChange={(e) => setContent(e.target.value)}
        required
        style={styles.textarea}
        rows={12}
        maxLength={maxLength}
      />

      <div style={styles.footer}>
        <label style={styles.checkLabel}>
          <input
            type="checkbox"
            checked={burn}
            onChange={(e) => setBurn(e.target.checked)}
            style={styles.checkbox}
          />
          <span style={styles.checkText}>Burn on read</span>
        </label>

        <span style={styles.charCount}>
          {content.length.toLocaleString()} / {maxLength.toLocaleString()}
        </span>
      </div>

      {error && <p style={styles.error}>{error}</p>}

      <button type="submit" disabled={loading} style={styles.button}>
        {loading ? 'Creating...' : 'Create Snippet'}
      </button>
    </form>
  )
}

function getStyles(theme: 'light' | 'dark', loading: boolean): Record<string, React.CSSProperties> {
  const isDark = theme === 'dark'
  const bg = isDark ? 'var(--cyguin-bg, #0a0a0a)' : 'var(--cyguin-bg, #ffffff)'
  const bgSubtle = isDark ? 'var(--cyguin-bg-subtle, #1a1a1a)' : 'var(--cyguin-bg-subtle, #f5f5f5)'
  const border = isDark ? 'var(--cyguin-border, #2a2a2a)' : 'var(--cyguin-border, #e5e5e5)'
  const fg = isDark ? 'var(--cyguin-fg, #f5f5f5)' : 'var(--cyguin-fg, #0a0a0a)'
  const fgMuted = 'var(--cyguin-fg-muted, #888888)'
  const accent = 'var(--cyguin-accent, #f5a800)'
  const accentFg = 'var(--cyguin-accent-fg, #0a0a0a)'
  const radius = 'var(--cyguin-radius, 6px)'
  const shadow = isDark ? 'var(--cyguin-shadow, 0 1px 4px rgba(0,0,0,0.4))' : 'var(--cyguin-shadow, 0 1px 4px rgba(0,0,0,0.08))'

  return {
    form: {
      display: 'flex',
      flexDirection: 'column' as const,
      gap: '12px',
      padding: '20px',
      background: bg,
      border: `1px solid ${border}`,
      borderRadius: radius,
      boxShadow: shadow,
    },
    input: {
      padding: '10px 12px',
      fontSize: '14px',
      border: `1px solid ${border}`,
      borderRadius: radius,
      background: bgSubtle,
      color: fg,
      outline: 'none',
      width: '100%',
      boxSizing: 'border-box' as const,
    },
    row: {
      display: 'flex',
      gap: '8px',
    },
    select: {
      flex: 1,
      padding: '10px 12px',
      fontSize: '14px',
      border: `1px solid ${border}`,
      borderRadius: radius,
      background: bgSubtle,
      color: fg,
      outline: 'none',
      cursor: 'pointer',
    },
    textarea: {
      padding: '10px 12px',
      fontSize: '13px',
      fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace',
      border: `1px solid ${border}`,
      borderRadius: radius,
      background: bgSubtle,
      color: fg,
      outline: 'none',
      resize: 'vertical' as const,
      width: '100%',
      boxSizing: 'border-box' as const,
      minHeight: '200px',
    },
    footer: {
      display: 'flex',
      justifyContent: 'space-between' as const,
      alignItems: 'center' as const,
    },
    checkLabel: {
      display: 'flex',
      alignItems: 'center' as const,
      gap: '6px',
      cursor: 'pointer',
    },
    checkbox: {
      accentColor: accent,
      cursor: 'pointer',
    },
    checkText: {
      fontSize: '13px',
      color: fgMuted,
    },
    charCount: {
      fontSize: '12px',
      color: fgMuted,
    },
    error: {
      color: '#ef4444',
      fontSize: '13px',
      margin: 0,
    },
    button: {
      padding: '10px 20px',
      fontSize: '14px',
      fontWeight: 600,
      background: accent,
      color: accentFg,
      border: 'none',
      borderRadius: radius,
      cursor: loading ? 'not-allowed' : 'pointer',
      opacity: loading ? 0.7 : 1,
    },
  }
}
