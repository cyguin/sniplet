'use client'

import { SnipCreate } from '@cyguin/sniplet/react'
import { useRouter } from 'next/navigation'

export default function SnipsPage() {
  const router = useRouter()

  return (
    <main className="min-h-screen bg-gray-950 flex flex-col items-center px-4 py-12">
      <div className="w-full max-w-3xl">
        <div className="mb-8 text-center">
          <div className="flex items-center justify-center gap-4 mb-3">
            <a
              href="https://github.com/cyguin/sniplet"
              target="_blank"
              rel="noopener noreferrer"
              className="text-gray-500 hover:text-gray-300 transition-colors"
              aria-label="GitHub"
            >
              <svg height="22" width="22" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" />
              </svg>
            </a>
            <a
              href="https://npmjs.com/package/@cyguin/sniplet"
              target="_blank"
              rel="noopener noreferrer"
              className="text-gray-500 hover:text-gray-300 transition-colors"
              aria-label="npm"
            >
              <svg height="22" width="22" viewBox="0 0 24 24" fill="currentColor">
                <path d="M0 7.334v8h6v1.333h-6v8h24v-8h-6V7.334H0zm6 1.333h12v1.334H6V8.667zm0 3.999h12v1.334H6v-1.334zm0 3.999h12v1.334H6v-1.334z" />
              </svg>
            </a>
          </div>
          <h1 className="text-3xl font-bold text-white mb-1 tracking-tight">
            sniplet
          </h1>
          <p className="text-gray-500 text-sm">
            Share code snippets instantly
          </p>
        </div>
        <div className="bg-gray-900 rounded-xl border border-gray-800 p-1">
          <SnipCreate
            onSuccess={(id) => {
              router.push(`/snips/${id}`)
            }}
            variant="tailwind"
          />
        </div>
      </div>
    </main>
  )
}
