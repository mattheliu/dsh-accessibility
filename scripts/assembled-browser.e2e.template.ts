/** External-plugin assembled browser evidence. Copied temporarily into DSH's Web test lane. */
import { mkdir, mkdtemp, readFile, rm, symlink, writeFile } from 'node:fs/promises'
import { createRequire } from 'node:module'
import { tmpdir } from 'node:os'
import { dirname, join } from 'node:path'
import type { Browser, BrowserContext, Page } from 'playwright'
import { chromium } from 'playwright'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import {
  fixtureUserPrompts, launchWebScaffold, seedSession, type WebScaffold,
} from './scaffold.ts'

interface AxeResult {
  violations: Array<{ id: string; impact: string | null; nodes: unknown[] }>
}

const pluginRoot = process.env.DSH_ACCESSIBILITY_PLUGIN_ROOT
if (pluginRoot === undefined || pluginRoot === '') {
  throw new Error('DSH_ACCESSIBILITY_PLUGIN_ROOT is required')
}

const pluginManifest = JSON.parse(await readFile(join(pluginRoot, 'package.json'), 'utf8')) as {
  name?: string
  version?: string
}
if (pluginManifest.name !== '@oh-my-dsh/dsh-accessibility') throw new Error('external package identity mismatch')

const fixturePath = join(process.cwd(), 'apps/web/tests/snapshots/seeded-history/seed.jsonl')
const fixture = await readFile(fixturePath, 'utf8')
const [prompt] = fixtureUserPrompts(fixture)
if (prompt === undefined || prompt === '') throw new Error('assembled browser fixture has no user prompt')

describe('external dsh-accessibility Accessible View', () => {
  let temporaryRoot: string
  let scaffold: WebScaffold
  let browser: Browser
  let context: BrowserContext
  let page: Page
  const browserErrors: string[] = []

  beforeAll(async () => {
    temporaryRoot = await mkdtemp(join(tmpdir(), 'dsh-accessible-view-assembled-'))
    const harnessHome = join(temporaryRoot, 'dsh-home')
    const moduleLink = join(harnessHome, 'profiles', 'node_modules', '@oh-my-dsh', 'dsh-accessibility')
    const overlayPath = join(temporaryRoot, 'accessibility.overlay.yml')
    await mkdir(dirname(moduleLink), { recursive: true })
    await symlink(pluginRoot, moduleLink, 'dir')
    await writeFile(overlayPath, [
      '- insert:',
      '    - id: accessibility-external-e2e',
      "      name: '@oh-my-dsh/dsh-accessibility'",
      '',
    ].join('\n'))

    scaffold = await launchWebScaffold({ extraOverlayPath: overlayPath, harnessHome })
    await seedSession(scaffold, fixture, 'dsh-accessible-view-e2e')

    browser = await chromium.launch({ headless: true })
    context = await browser.newContext({ viewport: { width: 1440, height: 1000 }, locale: 'en-US' })
    await context.grantPermissions(['clipboard-read', 'clipboard-write'], { origin: scaffold.baseUrl })
    page = await context.newPage()
    page.on('console', (message) => {
      if (message.type() === 'error') browserErrors.push(message.text())
    })
    page.on('pageerror', error => browserErrors.push(error.message))
    await page.goto(scaffold.baseUrl, { waitUntil: 'load' })
  }, 120_000)

  afterAll(async () => {
    const failures: unknown[] = []
    await context?.close().catch(error => failures.push(error))
    await browser?.close().catch(error => failures.push(error))
    await scaffold?.close().catch(error => failures.push(error))
    await rm(temporaryRoot, { recursive: true, force: true }).catch(error => failures.push(error))
    if (failures.length > 0) throw new AggregateError(failures, 'assembled browser cleanup failed')
  })

  it('gates content and preserves keyboard, semantics, copy, and clear behavior in Chromium', async () => {
    const groupRow = page.locator('[role="treeitem"]').first()
    await groupRow.waitFor({ state: 'visible', timeout: 30_000 })
    await groupRow.click()
    const sessionRow = page.locator('[role="treeitem"]').nth(1)
    await sessionRow.waitFor({ state: 'visible', timeout: 15_000 })
    await sessionRow.click()
    await page.getByText(prompt, { exact: true }).waitFor({ state: 'visible', timeout: 20_000 })

    const accessibleTab = page.getByRole('tab', { name: 'Accessible view' })
    await accessibleTab.waitFor({ state: 'visible', timeout: 15_000 })
    await accessibleTab.focus()
    await page.keyboard.press('Enter')

    const viewHeading = page.getByRole('heading', { level: 2, name: 'Accessible reading view' })
    await viewHeading.waitFor({ state: 'visible' })
    expect(await page.getByText(prompt, { exact: true }).count(), 'conversation content leaked before Load').toBe(0)

    const requireFromPlugin = createRequire(join(pluginRoot, 'package.json'))
    await page.addScriptTag({ path: requireFromPlugin.resolve('axe-core/axe.min.js') })
    const runAxe = async (): Promise<AxeResult> => await viewHeading.evaluate(async (heading): Promise<AxeResult> => {
      const root = heading.closest('section')
      if (root === null) throw new Error('accessible view section missing')
      return await (window as unknown as {
        axe: { run(node: Element, options: unknown): Promise<AxeResult> }
      }).axe.run(root, { rules: { 'color-contrast': { enabled: false } } })
    })
    const idleAxe = await runAxe()
    expect(idleAxe.violations, JSON.stringify(idleAxe.violations, null, 2)).toHaveLength(0)

    const loadButton = page.getByRole('button', { name: 'Load reading view' })
    await loadButton.focus()
    await page.keyboard.press('Enter')
    await page.getByText(prompt, { exact: true }).waitFor({ state: 'visible', timeout: 15_000 })
    expect(await viewHeading.evaluate(element => document.activeElement === element)).toBe(true)

    const records = page.getByRole('list', { name: 'Conversation records in source order' })
    expect(await records.getAttribute('aria-live')).toBe('off')
    expect(await records.locator('article').count()).toBeGreaterThan(1)

    const toolArticle = page.getByRole('article').filter({
      has: page.getByText(/^Record \d+: Tool result$/u),
    }).first()
    const outputDisclosure = toolArticle.getByRole('button', { name: 'Show tool output' })
    await outputDisclosure.waitFor({ state: 'visible' })
    expect(await outputDisclosure.getAttribute('aria-expanded')).toBe('false')
    await outputDisclosure.focus()
    await outputDisclosure.press('Enter')
    const hideOutputDisclosure = toolArticle.getByRole('button', { name: 'Hide tool output' })
    await hideOutputDisclosure.waitFor({ state: 'visible' })
    expect(await hideOutputDisclosure.getAttribute('aria-expanded')).toBe('true')
    expect(await hideOutputDisclosure.evaluate(element => document.activeElement === element)).toBe(true)

    const copyButton = page.getByRole('button', {
      name: /Copy visible message text from record \d+, Your message/u,
    }).first()
    await copyButton.waitFor({ state: 'visible' })
    await copyButton.click()
    await page.getByText(/was copied to the system clipboard/u).waitFor({ state: 'visible' })
    expect(await page.evaluate(async () => await navigator.clipboard.readText())).toBe(prompt)

    const loadedAxe = await runAxe()
    expect(loadedAxe.violations, JSON.stringify(loadedAxe.violations, null, 2)).toHaveLength(0)

    const clearButton = page.getByRole('button', { name: 'Clear reading view and return' })
    await clearButton.focus()
    await page.keyboard.press('Enter')
    await loadButton.waitFor({ state: 'visible' })
    expect(await loadButton.evaluate(element => document.activeElement === element)).toBe(true)
    expect(await page.getByText(prompt, { exact: true }).count()).toBe(0)
    expect(browserErrors, `browser console errors: ${JSON.stringify(browserErrors)}`).toHaveLength(0)

    process.stdout.write(`${JSON.stringify({
      protocol: 'dsh-accessible-view/1.0.0-draft',
      evidence: 'assembled-browser',
      dsh: '0.1.1-rc.2',
      plugin: pluginManifest.version,
      engine: 'chromium',
      idleAxeViolations: idleAxe.violations.length,
      loadedAxeViolations: loadedAxe.violations.length,
      contentGated: true,
      focusRestored: true,
      clipboardProjection: true,
    }, null, 2)}\n`)
  }, 120_000)
})
