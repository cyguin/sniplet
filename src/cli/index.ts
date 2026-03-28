#!/usr/bin/env node
import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'
import { spawnSync } from 'child_process'

interface CliArgs {
  command: string
  targetDir: string
  force: boolean
}

function parseArgs(argv: string[]): CliArgs {
  const command = argv[2] ?? 'init'
  const force = argv.includes('--force') || argv.includes('-f')
  const targetDir = command === 'init' && argv[3] && !argv[3].startsWith('-')
    ? argv[3]
    : process.cwd()
  return { command, targetDir, force }
}

function info(msg: string) {
  console.log(`  ${msg}`)
}

function success(msg: string) {
  console.log(`  ✓ ${msg}`)
}

function warn(msg: string) {
  console.error(`  ! ${msg}`)
}

function error(msg: string) {
  console.error(`  ✗ ${msg}`)
}

function section(label: string) {
  console.log(`\n${label}`)
}

function detectNextJs(rootDir: string): { hasNext: boolean; hasAppRouter: boolean } {
  const pkgPath = join(rootDir, 'package.json')
  if (!existsSync(pkgPath)) {
    return { hasNext: false, hasAppRouter: false }
  }
  try {
    const pkg = JSON.parse(readFileSync(pkgPath, 'utf-8'))
    const hasNext = !!(pkg.dependencies?.next || pkg.devDependencies?.next)
    const hasAppRouter = hasNext && existsSync(join(rootDir, 'app'))
    return { hasNext, hasAppRouter }
  } catch {
    return { hasNext: false, hasAppRouter: false }
  }
}

function ensureDir(filePath: string): void {
  mkdirSync(dirname(filePath), { recursive: true })
}

const ROUTE_SHARED = `import { createSnipletHandler } from '@cyguin/sniplet/next'
import { SQLiteAdapter } from '@cyguin/sniplet/adapters/sqlite'

const adapter = new SQLiteAdapter(process.env.SNIPLET_DB_PATH ?? './data/sniplet.db')
const handler = createSnipletHandler({ adapter })

export { handler as GET, handler as POST, handler as DELETE }
`

const SNIPS_PAGE = `'use client'

import { SnipCreate } from '@cyguin/sniplet/react'
import { useRouter } from 'next/navigation'

export default function SnipsPage() {
  const router = useRouter()

  return (
    <main style={{ maxWidth: '640px', margin: '0 auto', padding: '2rem 1rem' }}>
      <h1 style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: '1.5rem' }}>
        Share a Snippet
      </h1>
      <SnipCreate
        onSuccess={(id, url) => {
          router.push(\`/snips/\${id}\`)
        }}
        variant="tailwind"
      />
    </main>
  )
}
`

const SNIP_PAGE = `'use client'

import { SnipView } from '@cyguin/sniplet/react'

export default function SnipPage({ params }: { params: { id: string } }) {
  return (
    <main style={{ maxWidth: '800px', margin: '0 auto', padding: '2rem 1rem' }}>
      <SnipView id={params.id} variant="tailwind" />
    </main>
  )
}
`

const ENV_SNIPPET = `# Environment variables for @cyguin/sniplet
# Required for SQLite adapter — path to your SQLite database file
SNIPLET_DB_PATH=./data/sniplet.db
`

const NEXT_STEPS = `
Next steps:

  1. Create the data directory:
     mkdir -p data

  2. Start your dev server:
     npm run dev

  3. Visit http://localhost:3000/snips
`

function writeFile(dest: string, content: string, force: boolean): boolean {
  if (existsSync(dest)) {
    if (!force) {
      warn(`${dest} already exists — skipping (use --force to overwrite)`)
      return false
    }
  }
  ensureDir(dest)
  writeFileSync(dest, content, 'utf-8')
  return true
}

function runInit(args: CliArgs): void {
  const { targetDir, force } = args
  const absTarget = targetDir.startsWith('/') ? targetDir : join(process.cwd(), targetDir)

  section('Checking project...')
  const { hasNext, hasAppRouter } = detectNextJs(absTarget)

  if (!hasNext) {
    error('No Next.js project found. Run this command inside a Next.js project.')
    error(`Expected package.json with "next" dependency in ${absTarget}`)
    process.exit(1)
  }

  if (!hasAppRouter) {
    warn('No App Router detected. @cyguin/sniplet requires Next.js App Router.')
    info('If you are using Pages Router, the scaffolder may not work correctly.')
  }

  success('Next.js App Router detected')

  section('Installing @cyguin/sniplet...')
  const installResult = spawnSync('npm', ['install', '@cyguin/sniplet'], {
    cwd: absTarget,
    stdio: 'pipe',
    shell: true,
  })

  if (installResult.status !== 0) {
    error('Failed to install @cyguin/sniplet')
    if (installResult.stderr) {
      console.error(installResult.stderr.toString())
    }
    process.exit(1)
  }
  success('@cyguin/sniplet installed')

  section('Generating files...')
  const apiDir = join(absTarget, 'app/api/snips/[...sniplet]')
  const snipsDir = join(absTarget, 'app/snips')
  const snipDir = join(absTarget, 'app/snips/[id]')

  let filesWritten = 0
  if (writeFile(join(apiDir, 'route.ts'), ROUTE_SHARED, force)) filesWritten++
  if (writeFile(join(absTarget, 'app/api/snips/route.ts'), ROUTE_SHARED, force)) filesWritten++
  if (writeFile(join(snipsDir, 'page.tsx'), SNIPS_PAGE, force)) filesWritten++
  if (writeFile(join(snipDir, 'page.tsx'), SNIP_PAGE, force)) filesWritten++

  if (filesWritten > 0) {
    success(`${filesWritten} file(s) written`)
  }

  section('.env file:')
  info('Add this to your .env (or .env.local):')
  console.log('')
  console.log(ENV_SNIPPET.split('\n').map(l => `  ${l}`).join('\n'))

  section('Done!')
  console.log(NEXT_STEPS)
}

function runHelp(): void {
  console.log(`
@cyguin/sniplet CLI

Usage:
  npx @cyguin/sniplet init [targetDir] [--force]

Options:
  targetDir   Directory to initialize in. Defaults to current directory.
  --force, -f  Overwrite existing files.

Examples:
  npx @cyguin/sniplet init
  npx @cyguin/sniplet init ./my-app --force
`)
}

async function main() {
  const args = parseArgs(process.argv)

  if (args.command === 'help' || args.command === '--help' || args.command === '-h') {
    runHelp()
    return
  }

  if (args.command === 'init') {
    runInit(args)
    return
  }

  error(`Unknown command: ${args.command}`)
  runHelp()
  process.exit(1)
}

main().catch((err) => {
  console.error('Unexpected error:', err)
  process.exit(1)
})
