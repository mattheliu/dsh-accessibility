import { execFileSync } from 'node:child_process'
import { mkdtempSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { afterEach, describe, expect, it } from 'vitest'
import { exactGitRevision } from '../scripts/lab-source-state.mjs'

const temporaryRoots = []

function git(root, ...args) {
  return execFileSync('git', args, { cwd: root, encoding: 'utf8' }).trim()
}

function cleanCheckout() {
  const root = mkdtempSync(join(tmpdir(), 'dsh-accessibility-source-state-'))
  temporaryRoots.push(root)
  git(root, 'init')
  git(root, 'config', 'user.email', 'accessibility-lab@example.invalid')
  git(root, 'config', 'user.name', 'Accessibility Lab Test')
  writeFileSync(join(root, 'tracked.txt'), 'committed\n')
  git(root, 'add', 'tracked.txt')
  git(root, 'commit', '-m', 'fixture')
  return root
}

afterEach(() => {
  for (const root of temporaryRoots.splice(0)) rmSync(root, { recursive: true, force: true })
})

describe('exactGitRevision', () => {
  it('returns the full commit only for a clean checkout', () => {
    const root = cleanCheckout()
    expect(exactGitRevision(root, 'fixture')).toBe(git(root, 'rev-parse', 'HEAD'))
    expect(exactGitRevision(root, 'fixture')).toMatch(/^[0-9a-f]{40}$/u)
  })

  it('rejects tracked and untracked changes that the commit cannot identify', () => {
    const tracked = cleanCheckout()
    writeFileSync(join(tracked, 'tracked.txt'), 'modified\n')
    expect(() => exactGitRevision(tracked, 'tracked fixture')).toThrow(/working tree must be clean/u)

    const untracked = cleanCheckout()
    writeFileSync(join(untracked, 'untracked.txt'), 'new\n')
    expect(() => exactGitRevision(untracked, 'untracked fixture')).toThrow(/working tree must be clean/u)
  })

  it('rejects a directory without authoritative Git state', () => {
    const root = mkdtempSync(join(tmpdir(), 'dsh-accessibility-non-git-'))
    temporaryRoots.push(root)
    expect(() => exactGitRevision(root, 'plain directory')).toThrow(/Git checkout/u)
  })
})
