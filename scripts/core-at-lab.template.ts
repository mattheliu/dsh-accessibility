/** Disposable synthetic DSH core world for human assistive-technology verification. */
import { spawn } from 'node:child_process'
import { mkdtemp, readFile, rm } from 'node:fs/promises'
import { arch, platform, release, tmpdir } from 'node:os'
import { join } from 'node:path'
import { it } from 'vitest'
import {
  fixtureUserPrompts, launchWebScaffold, seedSession, type WebScaffold,
} from './scaffold.ts'

const protocol = 'dsh-core-at-lab/1.0.0-draft'
const browser = process.env.DSH_ACCESSIBILITY_AT_LAB_BROWSER ?? 'none'
if (!['none', 'system', 'safari', 'chrome'].includes(browser)) {
  throw new Error(`invalid DSH_ACCESSIBILITY_AT_LAB_BROWSER: ${browser}`)
}
const timeoutMs = Number(process.env.DSH_ACCESSIBILITY_AT_LAB_TIMEOUT_MS ?? '0')
if (!Number.isSafeInteger(timeoutMs) || timeoutMs < 0 || timeoutMs > 86_400_000) {
  throw new Error(`invalid DSH_ACCESSIBILITY_AT_LAB_TIMEOUT_MS: ${String(timeoutMs)}`)
}
const fixturePath = join(process.cwd(), 'snapshots/web/seeded-history/session.jsonl')
const fixture = await readFile(fixturePath, 'utf8')
if (fixtureUserPrompts(fixture).length === 0) throw new Error('Core AT lab fixture has no synthetic user prompt')

function openBrowser(url: string): Promise<void> {
  if (browser === 'none') return Promise.resolve()
  const os = platform()
  let command: string
  let args: string[]
  if (browser === 'safari' || browser === 'chrome') {
    if (os !== 'darwin') throw new Error(`${browser} selection is supported only on macOS; use system or none`)
    command = 'open'
    args = ['-a', browser === 'safari' ? 'Safari' : 'Google Chrome', url]
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

it('boots a disposable synthetic DSH core world for human AT observation', async () => {
  let temporaryRoot: string | undefined
  let scaffold: WebScaffold | undefined
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
    temporaryRoot = await mkdtemp(join(tmpdir(), 'dsh-core-at-lab-'))
    const harnessHome = join(temporaryRoot, 'dsh-home')
    scaffold = await launchWebScaffold({ harnessHome })
    await seedSession(scaffold, fixture, 'dsh-core-at-lab-alpha')
    await seedSession(scaffold, fixture, 'dsh-core-at-lab-beta')

    process.stdout.write(`${JSON.stringify({
      protocol,
      evidence: 'lab-ready',
      dsh: {
        version: process.env.DSH_ACCESSIBILITY_DSH_VERSION ?? 'unavailable',
        revision: process.env.DSH_ACCESSIBILITY_DSH_REVISION ?? 'unavailable',
      },
      environment: { os: platform(), osRelease: release(), architecture: arch() },
      requestedBrowser: browser,
      localOrigin: scaffold.baseUrl,
      fixture: 'DSH synthetic seeded-history only; two sessions',
      persistence: 'temporary; removed when the launcher exits',
      limitations: [
        'lab readiness is not assistive-technology evidence',
        'the synthetic static history does not validate live response announcements',
        'spoken or braille output and task completion require a human observation record',
        'browser and assistive-technology versions must be recorded by the tester',
      ],
    }, null, 2)}\n`)
    process.stdout.write([
      '',
      'Core AT lab ready.',
      `One-use local sign-in URL (do not publish): ${scaffold.authenticatedUrl}`,
      'Use only the two synthetic Sessions and follow AT-CORE-LAB.md or AT-CORE-LAB.zh.md.',
      timeoutMs === 0
        ? 'Return to this terminal and press Ctrl+C when finished; the disposable DSH state will be removed.'
        : `Smoke mode will stop and remove disposable state after ${String(timeoutMs)} ms.`,
      '',
    ].join('\n'))
    await openBrowser(scaffold.authenticatedUrl)

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
    await scaffold?.close().catch(error => failures.push(error))
    if (temporaryRoot !== undefined) {
      await rm(temporaryRoot, { recursive: true, force: true }).catch(error => failures.push(error))
    }
    if (failures.length > 0) throw new AggregateError(failures, 'Core AT lab cleanup failed')
  }
}, timeoutMs > 0 ? Math.max(120_000, timeoutMs + 30_000) : 86_400_000)
