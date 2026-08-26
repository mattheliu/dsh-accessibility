import { describe, expect, it } from 'vitest'
import configs from '../tsdown.config.ts'

describe('browser bundle registration', () => {
  it('registers the scoped npm package id expected by the DSH module loader', () => {
    const outputOptions = configs[1]?.outputOptions as { banner?: string } | undefined

    expect(outputOptions?.banner).toContain('id: "@oh-my-dsh/dsh-accessibility"')
  })
})
