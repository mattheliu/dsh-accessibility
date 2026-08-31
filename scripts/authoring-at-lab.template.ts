/** Disposable DSH authoring world for human AT evidence and product-only verification. */
import { spawn } from 'node:child_process'
import { createServer, type Server } from 'node:http'
import { mkdir, mkdtemp, readFile, rm, symlink, writeFile } from 'node:fs/promises'
import { arch, platform, release, tmpdir } from 'node:os'
import { dirname, join } from 'node:path'
import type { Browser, Page } from 'playwright'
import { chromium } from 'playwright'
import { expect, it } from 'vitest'
import type { SessionEvent, SessionId } from '@deepseek-ai/dsh-session'
import type {} from '@deepseek-ai/dsh-user-approval'
import { launchWebScaffold, watchConsole, type WebScaffold } from './scaffold.ts'
import { expandTurnProcesses, newEnglishPage } from './support.ts'

const protocol = 'dsh-a11y-authoring-at-lab/0.1.0-draft'
const browserMode = process.env.DSH_ACCESSIBILITY_AUTHORING_AT_BROWSER ?? 'none'
if (!['none', 'system', 'safari', 'chrome', 'verify', 'verify-reject'].includes(browserMode)) {
  throw new Error(`invalid DSH_ACCESSIBILITY_AUTHORING_AT_BROWSER: ${browserMode}`)
}
const timeoutMs = Number(process.env.DSH_ACCESSIBILITY_AUTHORING_AT_TIMEOUT_MS ?? '0')
if (!Number.isSafeInteger(timeoutMs) || timeoutMs < 0 || timeoutMs > 86_400_000) {
  throw new Error(`invalid DSH_ACCESSIBILITY_AUTHORING_AT_TIMEOUT_MS: ${String(timeoutMs)}`)
}
const localPreviewRoot = process.env.DSH_ACCESSIBILITY_LOCAL_PREVIEW_ROOT
const replayFixture = process.env.DSH_ACCESSIBILITY_AUTHORING_AT_FIXTURE
if (localPreviewRoot === undefined || replayFixture === undefined) {
  throw new Error('authoring AT lab launcher did not provide its local-preview root and replay fixture')
}

const initialHtml = `<!doctype html>
<html lang="en">
<head><meta charset="utf-8"><title>Accessible authoring fixture</title></head>
<body>
  <main>
    <h1>Featured product</h1>
    <img src="/product.svg">
    <button type="button"></button>
  </main>
</body>
</html>
`
const expectedHtml = `<!doctype html>
<html lang="en">
<head><meta charset="utf-8"><title>Accessible authoring fixture</title></head>
<body>
  <main>
    <h1>Featured product</h1>
    <img src="/product.svg" alt="Blue hiking backpack">
    <button type="button">Add to cart</button>
  </main>
</body>
</html>
`
const imageSvg = '<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32"><rect width="32" height="32" fill="#2463eb"/></svg>'
const taskInput = 'Audit the host-advertised target preview.authoring scoped to main before changing code. Then read index.html. This disposable product image depicts a blue hiking backpack, and the button adds it to the cart. Use only the edit tool to add an appropriate image alternative and an accessible button name without changing unrelated content. Request one-time workspace-write permission for that exact edit, re-run a11y_check on the same target, then report the bounded flow result briefly. Do not use bash, write, URLs, or any file other than index.html.'

async function listen(server: Server): Promise<string> {
  await new Promise<void>((resolveListen, reject) => {
    server.once('error', reject)
    server.listen(0, '127.0.0.1', () => {
      server.off('error', reject)
      resolveListen()
    })
  })
  const address = server.address()
  if (address === null || typeof address === 'string') throw new Error('authoring AT preview has no IPv4 port')
  return `http://127.0.0.1:${String(address.port)}`
}

async function closeServer(server: Server): Promise<void> {
  await new Promise<void>((resolveClose, reject) => {
    server.close(error => error === undefined ? resolveClose() : reject(error))
    server.closeAllConnections()
  })
}

function openBrowser(url: string): Promise<void> {
  if (browserMode === 'none' || browserMode.startsWith('verify')) return Promise.resolve()
  const os = platform()
  let command: string
  let args: string[]
  if (browserMode === 'safari' || browserMode === 'chrome') {
    if (os !== 'darwin') throw new Error(`${browserMode} selection is supported only on macOS; use system or none`)
    command = 'open'
    args = ['-a', browserMode === 'safari' ? 'Safari' : 'Google Chrome', url]
  } else if (os === 'darwin') {
    command = 'open'
    args = [url]
  } else if (os === 'win32') {
    command = 'cmd'
    args = ['/c', 'start', '', url]
  } else {
    command = 'xdg-open'
    args = [url]
  }
  return new Promise((resolveOpen, reject) => {
    const opener = spawn(command, args, { stdio: 'ignore' })
    opener.once('error', reject)
    opener.once('exit', (code, signal) => {
      if (signal !== null) reject(new Error(`browser opener ended with signal ${signal}`))
      else if (code !== 0) reject(new Error(`browser opener exited ${String(code)}`))
      else resolveOpen()
    })
  })
}

function resultIsError(event: SessionEvent): boolean {
  if (event.type !== 'tool/result') return false
  return event.data.message.content.some(content => content.isError)
}

function callNames(events: readonly SessionEvent[]): string[] {
  return events.flatMap(event => event.type === 'tool/call' ? [event.data.name] : [])
}

async function verifyProductFlow(
  scaffold: WebScaffold,
  htmlPath: string,
  sessionEvents: SessionEvent[],
  decision: 'allow' | 'reject',
): Promise<void> {
  let browser: Browser | undefined
  let page: Page | undefined
  try {
    browser = await chromium.launch()
    page = await newEnglishPage(browser)
    const tripwire = watchConsole(page)
    await page.goto(scaffold.authenticatedUrl, { waitUntil: 'load' })
    await page.waitForSelector('[class*="frame"]', { timeout: 30_000 })
    const input = page.locator('[data-composer-input][contenteditable="true"]').first()
    await input.waitFor({ timeout: 15_000 })
    await page.locator('[aria-label^="Access mode"]').click()
    await page.getByRole('menuitemradio', { name: 'Read Only' }).click()
    await page.getByRole('button', { name: 'Access mode, current: Read Only' }).waitFor({ timeout: 15_000 })

    const settled = scaffold.whenTurnSettled(90_000)
    await input.fill(taskInput)
    await input.press('Enter')
    const panel = page.locator('[data-approval-key]')
    await panel.waitFor({ timeout: 60_000 })
    expect(await panel.getByRole('group', { name: 'Approval details' }).count()).toBe(1)
    expect(await panel.getByText(/one-time permission to update index\.html/i).count()).toBeGreaterThanOrEqual(1)
    await panel.getByRole('button', { name: decision === 'allow' ? 'Allow once' : 'Reject' }).click()
    await settled

    const expectedSource = decision === 'allow' ? expectedHtml : initialHtml
    await expect.poll(() => readFile(htmlPath, 'utf8'), { timeout: 15_000 }).toBe(expectedSource)
    expect(callNames(sessionEvents)).toEqual(['a11y_check', 'read', 'edit', 'a11y_check'])
    expect(sessionEvents.filter(event => event.type === 'tool/result').some(resultIsError))
      .toBe(decision === 'reject')
    expect(JSON.stringify(sessionEvents.filter(event => event.type === 'approval/decided').at(-1)))
      .toContain(decision === 'allow' ? 'allowed-once' : 'rejected')
    await expandTurnProcesses(page)
    const auditRows = page.locator('[data-tool="a11y_check"]')
    expect(await auditRows.count()).toBe(2)
    for (let index = 0; index < 2; index++) {
      const row = auditRows.nth(index)
      const disclosure = row.locator('[data-expandable]').first()
      await disclosure.click()
      await expect.poll(() => disclosure.getAttribute('aria-expanded'), { timeout: 5_000 }).toBe('true')
      const expectedFailures = decision === 'allow' && index === 1 ? '0' : '2'
      await row.getByText(new RegExp(`Detected failures: ${expectedFailures}`, 'i'))
        .waitFor({ timeout: 10_000 })
    }
    await page.getByText('The bounded repair flow finished; review the tool and audit results.', { exact: true })
      .waitFor({ timeout: 20_000 })
    expect(tripwire.pageErrors).toEqual([])
    expect(tripwire.warnings).toEqual([])
    process.stdout.write(`${JSON.stringify({
      protocol,
      evidence: 'automated-product-verification-not-at-evidence',
      result: 'pass',
      approval: decision === 'allow' ? 'allowed-once' : 'rejected',
      exactRepair: decision === 'allow',
      sourceUnchanged: decision === 'reject',
      toolSequence: callNames(sessionEvents),
    })}\n`)
  } finally {
    await page?.close().catch(() => {})
    await browser?.close().catch(() => {})
  }
}

it('boots a disposable authoring flow for human assistive-technology testing', async () => {
  let temporaryRoot: string | undefined
  let scaffold: WebScaffold | undefined
  let previewServer: Server | undefined
  let removeEventObserver: (() => void) | undefined
  let stopLab!: () => void
  let stopped = false
  const stop = (): void => {
    if (stopped) return
    stopped = true
    stopLab()
  }
  const stopPromise = new Promise<void>(resolveStop => { stopLab = resolveStop })
  process.once('SIGINT', stop)
  process.once('SIGTERM', stop)

  try {
    temporaryRoot = await mkdtemp(join(tmpdir(), 'dsh-authoring-at-lab-'))
    const harnessHome = join(temporaryRoot, 'dsh-home')
    const overlayPath = join(temporaryRoot, 'authoring-at.overlay.yml')
    const workspacePath = join(temporaryRoot, 'authoring-at-workspace')
    const htmlPath = join(workspacePath, 'index.html')
    // A selected profile layer carries its dependency closure, while the
    // layer itself is normally installed in this profile directory by DSH's
    // plugin command. This disposable lab provides that one installation link
    // directly and lets extraInstallAnchors resolve the package's dependencies.
    const profilePackageLink = join(
      harnessHome, 'profiles', 'scaffold', 'node_modules', '@oh-my-dsh', 'dsh-a11y-local-preview',
    )
    await mkdir(workspacePath, { recursive: true })
    await writeFile(htmlPath, initialHtml)
    await mkdir(dirname(profilePackageLink), { recursive: true })
    await symlink(localPreviewRoot, profilePackageLink, 'dir')

    previewServer = createServer(async (request, response) => {
      try {
        const requestUrl = new URL(request.url ?? '/', 'http://127.0.0.1')
        if (requestUrl.pathname === '/') {
          response.setHeader('content-type', 'text/html; charset=utf-8')
          response.end(await readFile(htmlPath))
          return
        }
        if (requestUrl.pathname === '/product.svg') {
          response.setHeader('content-type', 'image/svg+xml')
          response.end(imageSvg)
          return
        }
        response.writeHead(404).end('not found')
      } catch {
        response.writeHead(500).end('fixture unavailable')
      }
    })
    const previewOrigin = await listen(previewServer)
    await writeFile(overlayPath, [
      '- insert:',
      '    - id: a11y-local-preview',
      "      name: '@oh-my-dsh/dsh-a11y-local-preview'",
      '      config:',
      '        timeoutMs: 20000',
      '        maxConcurrentAudits: 1',
      '        targets:',
      '          - handle: preview.authoring',
      `            url: ${previewOrigin}/`,
      '            subjectLabel: Disposable authoring fixture',
      '',
      '- id: session-title-llm',
      '  disabled: true',
      '',
    ].join('\n'))

    const interactive = browserMode.startsWith('verify') || timeoutMs === 0
    scaffold = await launchWebScaffold({
      harnessHome,
      extraOverlayPath: overlayPath,
      extraInstallAnchors: [join(localPreviewRoot, 'package.json')],
      ...(interactive ? { replayFixture, compareReplaySession: false, paceMs: 120 } : {}),
    })
    const createdWorkspace = await scaffold.ctx.workspaceController.create({ path: workspacePath })
    const createdSession = await scaffold.ctx.sessionController.create({
      workspaceId: createdWorkspace.workspace.workspaceId,
    })
    const createdSessionId = createdSession.sessionId
    const sessionEvents: SessionEvent[] = []
    removeEventObserver = scaffold.ctx.on('session/event', (session, event: SessionEvent) => {
      if (session.id !== createdSessionId) return
      sessionEvents.push(event)
      if (event.type !== 'turn/end') return
      void readFile(htmlPath, 'utf8').then((html) => {
        process.stdout.write(`${JSON.stringify({
          protocol,
          evidence: 'host-terminal-boundary-not-at-evidence',
          reason: event.data.reason.kind,
          toolSequence: callNames(sessionEvents),
          failedTool: sessionEvents.some(resultIsError),
          exactRepair: html === expectedHtml,
        })}\n`)
      }, () => {
        process.stdout.write(`${JSON.stringify({
          protocol,
          evidence: 'host-terminal-boundary-not-at-evidence',
          reason: event.data.reason.kind,
          toolSequence: callNames(sessionEvents),
          failedTool: true,
          exactRepair: false,
        })}\n`)
      })
    })

    process.stdout.write(`${JSON.stringify({
      protocol,
      evidence: 'lab-ready-not-at-evidence',
      dsh: {
        version: process.env.DSH_ACCESSIBILITY_DSH_VERSION ?? 'unavailable',
        revision: process.env.DSH_ACCESSIBILITY_DSH_REVISION ?? 'unavailable',
      },
      composition: {
        package: '@oh-my-dsh/dsh-a11y-local-preview',
        version: process.env.DSH_ACCESSIBILITY_LOCAL_PREVIEW_VERSION ?? 'unavailable',
        revision: process.env.DSH_ACCESSIBILITY_LOCAL_PREVIEW_REVISION ?? 'unavailable',
      },
      environment: { os: platform(), osRelease: release(), architecture: arch() },
      requestedBrowser: browserMode,
      syntheticSessionId: String(createdSessionId),
      taskInput,
      persistence: 'temporary; removed when the launcher exits',
      limitations: [
        'lab readiness, Host terminal output, captions, DOM state, and automated Chromium are not assistive-technology evidence',
        'actual speech or braille, focus behavior, approval comprehension, and task completion require a human record',
        'the synthetic page and replay validate only this bounded authoring scenario',
        ...(timeoutMs > 0 && !browserMode.startsWith('verify')
          ? ['bounded smoke mode does not mount or consume the human-driven replay script']
          : []),
      ],
    }, null, 2)}\n`)
    if (!browserMode.startsWith('verify')) {
      process.stdout.write([
        '',
        'Authoring AT lab ready.',
        `One-use local sign-in URL (do not publish): ${scaffold.authenticatedUrl}`,
        'Open authoring-at-workspace, then its newest Session.',
        'Before submitting, set Access mode to Read Only.',
        'Submit taskInput exactly as printed above.',
        'For the success row, inspect Approval details and choose Allow once.',
        'For a separate rejection row, relaunch the lab, choose Reject, and verify index.html is not changed.',
        'Record actual speech or braille, focus order, control names, decision comprehension, outcome, blockers, AT/version, browser/version, and consent.',
        'Follow AUTHORING-AT-LAB.md or AUTHORING-AT-LAB.zh.md. Never infer AT output from this terminal.',
        timeoutMs === 0
          ? 'Return here and press Ctrl+C when finished; disposable state will be removed.'
          : `Smoke mode will stop and remove disposable state after ${String(timeoutMs)} ms.`,
        '',
      ].join('\n'))
      await openBrowser(scaffold.authenticatedUrl)
    }

    if (browserMode.startsWith('verify')) {
      await verifyProductFlow(
        scaffold,
        htmlPath,
        sessionEvents,
        browserMode === 'verify-reject' ? 'reject' : 'allow',
      )
    } else if (timeoutMs > 0) {
      await Promise.race([
        stopPromise,
        new Promise<void>(resolveTimeout => setTimeout(resolveTimeout, timeoutMs)),
      ])
    } else {
      await stopPromise
    }
  } finally {
    process.off('SIGINT', stop)
    process.off('SIGTERM', stop)
    removeEventObserver?.()
    const failures: unknown[] = []
    await scaffold?.close().catch(error => failures.push(error))
    if (previewServer !== undefined) await closeServer(previewServer).catch(error => failures.push(error))
    if (temporaryRoot !== undefined) {
      await rm(temporaryRoot, { recursive: true, force: true }).catch(error => failures.push(error))
    }
    if (failures.length > 0) throw new AggregateError(failures, 'Authoring AT lab cleanup failed')
  }
}, timeoutMs > 0 || browserMode.startsWith('verify')
  ? Math.max(180_000, timeoutMs + 60_000)
  : 86_400_000)
