import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'
import configs from '../tsdown.config.ts'

describe('browser bundle registration', () => {
  it('registers the scoped npm package id expected by the DSH module loader', () => {
    const outputOptions = configs[1]?.outputOptions as { banner?: string } | undefined

    expect(outputOptions?.banner).toContain('id: "@oh-my-dsh/dsh-accessibility"')
  })

  it('ships the versioned CLI accessibility protocol and disposable launchers', () => {
    const manifestPath = fileURLToPath(new URL('../package.json', import.meta.url))
    const manifest = JSON.parse(readFileSync(manifestPath, 'utf8')) as {
      files?: string[]
      scripts?: Record<string, string>
    }

    expect(manifest.files).toEqual(
      expect.arrayContaining([
        'CLI-ACCESSIBILITY.md',
        'CLI-ACCESSIBILITY.zh.md',
        'scripts/run-cli-conformance.mjs',
        'scripts/cli-conformance.template.ts',
      ]),
    )
    expect(manifest.scripts?.['lab:cli']).toBe('node scripts/run-cli-conformance.mjs')
  })
})
