'use client'

import { useEffect, useState, useCallback, type CSSProperties } from 'react'

interface SnipData {
  id: string
  content: string
  language: string | null
  expiresAt: string | null
  burnOnRead: boolean
  burnedAt: string | null
  createdAt: string
}

type SnipViewState =
  | { status: 'loading' }
  | { status: 'success'; snip: SnipData }
  | { status: 'error'; code: 404 | 410 | 500; message: string }

interface SnipViewProps {
  id: string
  apiBase?: string
  className?: string
  variant?: 'base' | 'tailwind'
}

let highlighterPromise: ReturnType<typeof import('shiki').createHighlighter> | null = null

function getHighlighter() {
  if (!highlighterPromise) {
    highlighterPromise = import('shiki').then(({ createHighlighter }) =>
      createHighlighter({
        themes: ['github-light'],
        langs: [],
      }),
    )
  }
  return highlighterPromise
}

function Countdown({ expiresAt }: { expiresAt: string }) {
  const [label, setLabel] = useState(() => computeLabel(expiresAt))

  useEffect(() => {
    const interval = setInterval(() => {
      setLabel(computeLabel(expiresAt))
    }, 1000)
    return () => clearInterval(interval)
  }, [expiresAt])

  return <span>{label}</span>
}

function computeLabel(expiresAt: string): string {
  const diff = new Date(expiresAt).getTime() - Date.now()
  if (diff <= 0) return 'Expired'

  const minutes = Math.floor(diff / 60000)
  const hours = Math.floor(diff / 3600000)
  const days = Math.floor(diff / 86400000)

  if (days > 0) return `Expires in ${days}d ${hours % 24}h`
  if (hours > 0) return `Expires in ${hours}h ${minutes % 60}m`
  return `Expires in ${minutes}m`
}

export function SnipView({ id, apiBase = '/api/snips', className = '', variant = 'base' }: SnipViewProps) {
  const [state, setState] = useState<SnipViewState>({ status: 'loading' })
  const [highlightedHtml, setHighlightedHtml] = useState<string>('')
  const [highlighterLoading, setHighlighterLoading] = useState(true)

  const fetchSnip = useCallback(async () => {
    setState({ status: 'loading' })
    try {
      const res = await fetch(`${apiBase}/${id}`)
      if (res.status === 404) {
        setState({ status: 'error', code: 404, message: 'This snip does not exist.' })
        return
      }
      if (res.status === 410) {
        setState({ status: 'error', code: 410, message: 'This snip has already been burned.' })
        return
      }
      if (!res.ok) {
        setState({ status: 'error', code: 500, message: 'Something went wrong.' })
        return
      }
      const snip = (await res.json()) as SnipData
      setState({ status: 'success', snip })
    } catch {
      setState({ status: 'error', code: 500, message: 'Failed to load snip.' })
    }
  }, [id, apiBase])

  useEffect(() => {
    fetchSnip()
  }, [fetchSnip])

  const highlightTrigger = state.status === 'success' ? state.snip.content : null

  useEffect(() => {
    if (state.status !== 'success') return
    setHighlighterLoading(true)
    const snip = state.snip
    const content = snip.content
    getHighlighter()
      .then(async (highlighter) => {
        const lang = snip.language ?? 'text'
        const loadedLangs = highlighter.getLoadedLanguages()
        const finalLang = loadedLangs.includes(lang as Parameters<typeof highlighter.getLoadedLanguages>[number]) ? lang : 'text'
        const html = highlighter.codeToHtml(content, {
          lang: finalLang,
          theme: 'github-light',
        })
        setHighlightedHtml(html)
      })
      .catch(() => {
        setHighlightedHtml(
          `<pre><code>${content.replace(/</g, '&lt;').replace(/>/g, '&gt;')}</code></pre>`,
        )
      })
      .finally(() => setHighlighterLoading(false))
  }, [highlightTrigger])

  const baseClasses = 'sniplet-view'
  const tailwindClasses = variant === 'tailwind' ? 'max-w-2xl' : ''
  const rootClass = `${baseClasses} ${tailwindClasses} ${className}`.trim()

  const containerStyle: CSSProperties | undefined = !variant ? {
    border: '1px solid #e5e7eb',
    borderRadius: '0.5rem',
    overflow: 'hidden',
  } : undefined

  const headerStyle: CSSProperties | undefined = !variant ? {
    padding: '0.75rem 1rem',
    backgroundColor: '#f9fafb',
    borderBottom: '1px solid #e5e7eb',
    fontSize: '0.75rem',
    color: '#6b7280',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  } : undefined

  const codeStyle: CSSProperties | undefined = !variant ? {
    padding: '1rem',
    fontFamily: 'monospace',
    fontSize: '0.875rem',
    lineHeight: '1.5',
    overflowX: 'auto',
  } : undefined

  if (state.status === 'loading') {
    return (
      <div className={rootClass}>
        <div
          style={!variant ? {
            padding: '2rem',
            textAlign: 'center',
            color: '#6b7280',
            fontFamily: 'monospace',
            fontSize: '0.875rem',
          } : undefined}
          className={variant === 'tailwind' ? 'p-8 text-center text-gray-500 font-mono' : ''}
        >
          Loading...
        </div>
      </div>
    )
  }

  if (state.status === 'error') {
    return (
      <div className={rootClass}>
        <div
          style={!variant ? {
            padding: '2rem',
            textAlign: 'center',
            color: '#dc2626',
            border: '1px solid #fca5a5',
            borderRadius: '0.5rem',
            backgroundColor: '#fef2f2',
            fontFamily: 'monospace',
            fontSize: '0.875rem',
          } : undefined}
          className={
            variant === 'tailwind'
              ? 'p-8 text-center text-red-600 border border-red-200 rounded bg-red-50'
              : ''
          }
        >
          <div style={{ fontWeight: 600, marginBottom: '0.5rem' }}>
            {state.code === 404 ? '404 — Not Found' : '410 — Gone'}
          </div>
          <div>{state.message}</div>
        </div>
      </div>
    )
  }

  const { snip } = state

  return (
    <div className={rootClass}>
      <div style={containerStyle} className={variant === 'tailwind' ? 'border rounded-lg overflow-hidden' : ''}>
        <div
          style={headerStyle}
          className={
            variant === 'tailwind'
              ? 'px-4 py-3 bg-gray-50 border-b border-gray-200 text-xs text-gray-500 flex justify-between items-center'
              : ''
          }
        >
          <div>
            {snip.language ? (
              <span
                className={variant === 'tailwind' ? 'bg-gray-200 px-2 py-0.5 rounded text-xs' : ''}
                style={!variant ? { backgroundColor: '#e5e7eb', padding: '0.125rem 0.5rem', borderRadius: '0.25rem' } : undefined}
              >
                {snip.language}
              </span>
            ) : null}
            {snip.burnOnRead && (
              <span
                className={variant === 'tailwind' ? 'ml-2 text-orange-500' : ''}
                style={!variant ? { color: '#ea580c', marginLeft: '0.5rem' } : undefined}
              >
                🔥 burn on read
              </span>
            )}
          </div>
          <div>
            {snip.expiresAt && <Countdown expiresAt={snip.expiresAt} />}
          </div>
        </div>

        <div
          style={codeStyle}
          className={variant === 'tailwind' ? 'p-4 font-mono text-sm leading-relaxed overflow-x-auto' : ''}
        >
          {highlighterLoading ? (
            <pre
              style={
                !variant
                  ? { color: '#374151', whiteSpace: 'pre-wrap', wordBreak: 'break-word' }
                  : undefined
              }
              className={variant === 'tailwind' ? 'text-gray-700 whitespace-pre-wrap break-words' : ''}
            >
              {snip.content}
            </pre>
          ) : (
            <div
              dangerouslySetInnerHTML={{ __html: highlightedHtml }}
              style={
                !variant
                  ? {
                      backgroundColor: '#ffffff',
                    }
                  : undefined
              }
              className={variant === 'tailwind' ? 'bg-white' : ''}
            />
          )}
        </div>
      </div>
    </div>
  )
}
