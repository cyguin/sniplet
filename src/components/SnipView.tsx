'use client'

import { useState, useEffect } from 'react'
import type { Snip } from '../types'

export interface SnipViewProps {
  id: string
  apiBase?: string
  variant?: 'base' | 'tailwind'
  className?: string
  theme?: 'light' | 'dark'
}

export function SnipView({
  id,
  apiBase = '/api/snips',
  variant = 'base',
  className = '',
  theme = 'light',
}: SnipViewProps) {
  const [snip, setSnip] = useState<Snip | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<{ code: string; message: string } | null>(null)

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch(`${apiBase}/${id}`)
        if (!res.ok) {
          const data = await res.json()
          setError({ code: res.status.toString(), message: data.error ?? 'Not found' })
          return
        }
        const data = await res.json()
        setSnip(data)
      } catch {
        setError({ code: 'NET', message: 'Network error' })
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [id, apiBase])

  const styles = getStyles(theme)

  if (loading) {
    return (
      <div style={styles.container} className={className}>
        <div style={styles.loading}>Loading...</div>
      </div>
    )
  }

  if (error) {
    const isExpired = error.code === '410'
    const isBurned = error.code === '410' && error.message.includes('burned')
    const isNotFound = error.code === '404'

    return (
      <div style={styles.container} className={className}>
        <div style={styles.errorBox}>
          <h2 style={styles.errorTitle}>
            {isExpired ? 'Snippet Expired' : isBurned ? 'Snippet Burned' : 'Not Found'}
          </h2>
          <p style={styles.errorMsg}>
            {isExpired
              ? 'This snippet has passed its expiry date and has been deleted.'
              : isBurned
              ? 'This snippet was set to burn on read and has already been viewed.'
              : 'This snippet does not exist.'}
          </p>
        </div>
      </div>
    )
  }

  if (!snip) return null

  const expiryLabel = snip.expires_at
    ? `Expires ${new Date(snip.expires_at).toLocaleString()}`
    : snip.burn_on_read
    ? 'Burn on read'
    : 'Never expires'

  return (
    <div style={styles.container} className={className}>
      <div style={styles.header}>
        <div style={styles.meta}>
          <span style={styles.lang}>{snip.language}</span>
          <span style={styles.metaText}>{expiryLabel}</span>
          <span style={styles.metaText}>{snip.view_count} views</span>
        </div>
        <h1 style={styles.title}>{snip.title}</h1>
      </div>

      <div style={styles.codeWrapper}>
        <pre style={styles.code}>
          <code>{snip.content}</code>
        </pre>
      </div>

      <div style={styles.copyRow}>
        <button
          onClick={() => navigator.clipboard.writeText(snip.content)}
          style={styles.copyBtn}
        >
          Copy
        </button>
      </div>
    </div>
  )
}

function getStyles(theme: 'light' | 'dark') {
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
    container: {
      padding: '20px',
      background: bg,
      border: `1px solid ${border}`,
      borderRadius: radius,
      boxShadow: shadow,
      maxWidth: '900px',
      margin: '0 auto',
    },
    header: {
      marginBottom: '16px',
    },
    meta: {
      display: 'flex',
      gap: '12px',
      alignItems: 'center',
      marginBottom: '8px',
    },
    lang: {
      padding: '2px 8px',
      fontSize: '12px',
      fontWeight: 600,
      background: accent,
      color: accentFg,
      borderRadius: '4px',
      textTransform: 'uppercase',
    },
    metaText: {
      fontSize: '12px',
      color: fgMuted,
    },
    title: {
      fontSize: '18px',
      fontWeight: 700,
      color: fg,
      margin: 0,
    },
    codeWrapper: {
      background: bgSubtle,
      border: `1px solid ${border}`,
      borderRadius: radius,
      overflow: 'auto',
      maxHeight: '600px',
    },
    code: {
      margin: 0,
      padding: '16px',
      fontSize: '13px',
      fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace',
      color: fg,
      whiteSpace: 'pre' as const,
      overflowX: 'auto' as const,
    },
    copyRow: {
      display: 'flex',
      justifyContent: 'flex-end',
      marginTop: '12px',
    },
    copyBtn: {
      padding: '6px 16px',
      fontSize: '13px',
      fontWeight: 600,
      background: accent,
      color: accentFg,
      border: 'none',
      borderRadius: radius,
      cursor: 'pointer',
    },
    loading: {
      padding: '40px',
      textAlign: 'center' as const,
      color: fgMuted,
    },
    errorBox: {
      padding: '40px',
      textAlign: 'center' as const,
    },
    errorTitle: {
      fontSize: '18px',
      fontWeight: 700,
      color: fg,
      marginBottom: '8px',
    },
    errorMsg: {
      fontSize: '14px',
      color: fgMuted,
      margin: 0,
    },
  }
}
