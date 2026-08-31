import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'

const templates = [
  'at-lab.template.ts',
  'core-at-lab.template.ts',
  'live-at-lab.template.ts',
  'authoring-at-lab.template.ts',
]
const evidenceRunners = [
  'run-at-lab.mjs',
  'run-core-at-lab.mjs',
  'run-live-at-lab.mjs',
  'run-authoring-at-lab.mjs',
  'run-cli-conformance.mjs',
]

describe('human AT lab browser isolation', () => {
  it.each(templates)('%s launches Chrome with a disposable local-only profile', (template) => {
    const source = readFileSync(new URL(`../scripts/${template}`, import.meta.url), 'utf8')

    expect(source).toContain('/Applications/Google Chrome.app/Contents/MacOS/Google Chrome')
    expect(source).toMatch(
      /`--user-data-dir=\$\{(?:join\(temporaryRoot, 'chrome-profile'\)|profilePath)\}`/,
    )
    expect(source).toContain("'--disable-background-networking'")
    expect(source).toContain("'--disable-sync'")
    expect(source).toContain(
      "'--host-resolver-rules=MAP * 0.0.0.0, EXCLUDE 127.0.0.1, EXCLUDE localhost'",
    )
    expect(source).toContain("context: 'temporary-isolated-chrome-profile'")
    expect(source).toContain('browserContext: launchedBrowser.context')
  })

  it.each(templates)('%s closes isolated Chrome before deleting the temporary root', (template) => {
    const source = readFileSync(new URL(`../scripts/${template}`, import.meta.url), 'utf8')
    const closeBrowser = source.lastIndexOf('await closeBrowser(launchedBrowser)')
    const removeRoot = source.lastIndexOf('await rm(temporaryRoot, { recursive: true, force: true })')

    expect(closeBrowser).toBeGreaterThan(-1)
    expect(removeRoot).toBeGreaterThan(closeBrowser)
    expect(source).toContain("process.kill('SIGTERM')")
    expect(source).toContain("process.kill('SIGKILL')")
    expect(source).toContain("rejectClose(new Error('isolated Chrome did not exit within 5000 ms'))")
  })

  it.each(evidenceRunners)('%s rejects source that has no exact clean commit', (runner) => {
    const source = readFileSync(new URL(`../scripts/${runner}`, import.meta.url), 'utf8')
    expect(source).toContain("from './lab-source-state.mjs'")
    expect(source).toContain('exactGitRevision(')
  })

  it.each([
    'core-at-lab.template.ts',
    'live-at-lab.template.ts',
    'authoring-at-lab.template.ts',
    'cli-conformance.template.ts',
  ])('%s reports the exact lab implementation revision separately', (template) => {
    const source = readFileSync(new URL(`../scripts/${template}`, import.meta.url), 'utf8')
    expect(source).toContain("package: '@oh-my-dsh/dsh-accessibility'")
    expect(source).toContain('DSH_ACCESSIBILITY_LAB_VERSION')
    expect(source).toContain('DSH_ACCESSIBILITY_LAB_REVISION')
  })
})
