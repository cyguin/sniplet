import { defineConfig } from 'tsup'

export default defineConfig({
  entry: {
    'index':              'src/index.ts',
    'next/index':         'src/next/index.ts',
    'react/index':        'src/react/index.tsx',
    'adapters/sqlite':    'src/adapters/sqlite.ts',
    'adapters/postgres':  'src/adapters/postgres.ts',
  },
  format: ['esm', 'cjs'],
  dts: true,
  sourcemap: true,
  clean: true,
  external: ['react', 'react-dom', 'next', 'better-sqlite3', 'postgres'],
})
