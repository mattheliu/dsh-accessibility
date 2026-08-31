import { rm } from 'node:fs/promises'

// Build output is the only deletion target; source and evidence artifacts are untouched.
await rm(new URL('../lib/', import.meta.url), { recursive: true, force: true })
