/** Disposable synthetic world for human assistive-technology verification. */
import { spawn, type ChildProcess } from 'node:child_process'
import { mkdir, mkdtemp, readFile, rm, symlink, writeFile } from 'node:fs/promises'
import { arch, platform, release, tmpdir } from 'node:os'
import { dirname, join } from 'node:path'
import { it } from 'vitest'
import {
  fixtureUserPrompts, launchWebScaffold, seedSession, type WebScaffold,
} from './scaffold.ts'

const protocol = 'dsh-at-lab/1.0.0-draft'
const pluginRoot = process.env.DSH_ACCESSIBILITY_PLUGIN_ROOT
if (pluginRoot === undefined || pluginRoot === '') throw new Error('DSH_ACCESSIBILITY_PLUGIN_ROOT is required')
const browser = process.env.DSH_ACCESSIBILITY_AT_LAB_BROWSER ?? 'none'
if (!['none', 'system', 'safari', 'chrome'].includes(browser)) {
  throw new Error(`invalid DSH_ACCESSIBILITY_AT_LAB_BROWSER: ${browser}`)
}
const timeoutMs = Number(process.env.DSH_ACCESSIBILITY_AT_LAB_TIMEOUT_MS ?? '0')
if (!Number.isSafeInteger(timeoutMs) || timeoutMs < 0 || timeoutMs > 86_400_000) {
  throw new Error(`invalid DSH_ACCESSIBILITY_AT_LAB_TIMEOUT_MS: ${String(timeoutMs)}`)
}
const pluginManifest = JSON.parse(await readFile(join(pluginRoot, 'package.json'), 'utf8')) as {
  name?: string
  version?: string
}
if (pluginManifest.name !== '@oh-my-dsh/dsh-accessibility') throw new Error('external package identity mismatch')

const fixturePath = join(process.cwd(), 'apps/web/tests/snapshots/seeded-history/seed.jsonl')
const fixture = await readFile(fixturePath, 'utf8')
if (fixtureUserPrompts(fixture).length === 0) throw new Error('AT lab fixture has no synthetic user prompt')

interface LaunchedBrowser {
  readonly process?: ChildProcess
  readonly context: 'none' | 'existing-browser-context' | 'temporary-isolated-chrome-profile'
}

function openBrowser(url: string, temporaryRoot: string): Promise<LaunchedBrowser> {
  if (browser === 'none') return Promise.resolve({ context: 'none' })
  const os = platform()
  if (browser === 'chrome') {
    if (os !== 'darwin') throw new Error('chrome selection is supported only on macOS; use system or none')
    const process = spawn('/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', [
      `--user-data-dir=${join(temporaryRoot, 'chrome-profile')}`,
      '--no-first-run',
      '--no-default-browser-check',
      '--disable-background-networking',
      '--disable-component-update',
      '--disable-default-apps',
      '--disable-sync',
      '--metrics-recording-only',
      '--host-resolver-rules=MAP * 0.0.0.0, EXCLUDE 127.0.0.1, EXCLUDE localhost',
      url,
    ], { stdio: 'ignore' })
    return new Promise((resolveOpen, reject) => {
      process.once('error', reject)
      process.once('spawn', () => resolveOpen({
        process,
        context: 'temporary-isolated-chrome-profile',
      }))
    })
  }
  let command: string
  let args: string[]
  if (browser === 'safari') {
    if (os !== 'darwin') throw new Error('safari selection is supported only on macOS; use system or none')
    command = 'open'
    args = ['-a', 'Safari', url]
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
      else resolveOpen({ context: 'existing-browser-context' })
    })
  })
}

async function closeBrowser(launched: LaunchedBrowser | undefined): Promise<void> {
  const process = launched?.process
  if (process === undefined || process.exitCode !== null || process.signalCode !== null) return
  await new Promise<void>((resolveClose, rejectClose) => {
    let settled = false
    const finish = (): void => {
      if (settled) return
      settled = true
      clearTimeout(force)
      clearTimeout(abandon)
      resolveClose()
    }
    const force = setTimeout(() => {
      if (process.exitCode === null && process.signalCode === null) process.kill('SIGKILL')
    }, 2_000)
    const abandon = setTimeout(() => {
      if (settled) return
      settled = true
      clearTimeout(force)
      rejectClose(new Error('isolated Chrome did not exit within 5000 ms'))
    }, 5_000)
    process.once('exit', finish)
    if (!process.kill('SIGTERM')) finish()
  })
}

it('boots a disposable synthetic world for human AT observation', async () => {
  let temporaryRoot: string | undefined
  let scaffold: WebScaffold | undefined
  let launchedBrowser: LaunchedBrowser | undefined
  let stopLab!: () => void
  let stopped = false
  const stop = (): void => {
    if (stopped) return
    stopped = true
    stopLab()
  }
  const stopPromise = new Promise<void>((resolveStop) => { stopLab = resolveStop })
  process.once('SIGINT', stop)
  process.once('SIGTERM', stop)

  try {
    temporaryRoot = await mkdtemp(join(tmpdir(), 'dsh-accessibility-at-lab-'))
    const harnessHome = join(temporaryRoot, 'dsh-home')
    const moduleLink = join(harnessHome, 'profiles', 'node_modules', '@oh-my-dsh', 'dsh-accessibility')
    const overlayPath = join(temporaryRoot, 'accessibility.overlay.yml')
    await mkdir(dirname(moduleLink), { recursive: true })
    await symlink(pluginRoot, moduleLink, 'dir')
    await writeFile(overlayPath, [
      '- insert:',
      '    - id: accessibility-at-lab',
      "      name: '@oh-my-dsh/dsh-accessibility'",
      '',
    ].join('\n'))

    scaffold = await launchWebScaffold({ extraOverlayPath: overlayPath, harnessHome })
    await seedSession(scaffold, fixture, 'dsh-accessibility-at-lab')
    // rc.2 predates the process-token URL. Keep that lab usable while newer
    // DSH candidates use their one-use authenticated entry point.
    const localSignInUrl = (scaffold as WebScaffold & { authenticatedUrl?: string }).authenticatedUrl
      ?? scaffold.baseUrl
    launchedBrowser = await openBrowser(localSignInUrl, temporaryRoot)

    process.stdout.write(`${JSON.stringify({
      protocol,
      evidence: 'lab-ready',
      dsh: {
        version: '0.1.1-rc.2',
        revision: process.env.DSH_ACCESSIBILITY_DSH_REVISION ?? 'unavailable',
      },
      companion: {
        version: pluginManifest.version,
        revision: process.env.DSH_ACCESSIBILITY_PLUGIN_REVISION ?? 'unavailable',
      },
      environment: { os: platform(), osRelease: release(), architecture: arch() },
      requestedBrowser: browser,
      browserContext: launchedBrowser.context,
      localOrigin: scaffold.baseUrl,
      fixture: 'DSH synthetic seeded-history only',
      persistence: 'temporary; removed when the launcher exits',
      limitations: [
        'lab readiness is not assistive-technology evidence',
        'spoken output and task completion require a human observation record',
        'browser and assistive-technology versions must be recorded by the tester',
        ...(browser === 'system' || browser === 'safari'
          ? ['system and Safari modes may reuse an existing browser context; stop if personal UI appears']
          : []),
      ],
    }, null, 2)}\n`)
    process.stdout.write([
      '',
      'AT lab ready.',
      `Local sign-in URL (do not publish while the lab is active): ${localSignInUrl}`,
      'Select the synthetic session, activate Accessible view, then Load reading view.',
      'Follow AT-LAB.md or AT-LAB.zh.md and record actual speech, focus, outcome, and workaround.',
      timeoutMs === 0
        ? 'Return to this terminal and press Ctrl+C when finished; the disposable DSH state will be removed.'
        : `Smoke mode will stop and remove disposable state after ${String(timeoutMs)} ms.`,
      '',
    ].join('\n'))

    if (timeoutMs > 0) {
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
    const failures: unknown[] = []
    await closeBrowser(launchedBrowser).catch(error => failures.push(error))
    await scaffold?.close().catch(error => failures.push(error))
    if (temporaryRoot !== undefined) {
      await rm(temporaryRoot, { recursive: true, force: true }).catch(error => failures.push(error))
    }
    if (failures.length > 0) throw new AggregateError(failures, 'AT lab cleanup failed')
  }
}, timeoutMs > 0 ? Math.max(120_000, timeoutMs + 30_000) : 86_400_000)
