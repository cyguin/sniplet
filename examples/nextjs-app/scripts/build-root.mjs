#!/usr/bin/env node
import { spawnSync } from 'node:child_process'
import { resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = resolve(fileURLToPath(import.meta.url), '..', '..')
const tsup = resolve(root, 'node_modules', '.bin', 'tsup')

spawnSync(tsup, ['--no-dts'], { cwd: root, stdio: 'inherit' })
