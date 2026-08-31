/** Disposable replay world for human observation of DSH live announcements. */
import { spawn } from 'node:child_process'
import { mkdir, mkdtemp, readFile, rm, writeFile } from 'node:fs/promises'
import { arch, platform, release, tmpdir } from 'node:os'
import { join } from 'node:path'
import { it } from 'vitest'
import type { SessionEvent } from '@deepseek-ai/dsh-session'
import {
  fixtureUserPrompts, launchWebScaffold, type WebScaffold,
} from './scaffold.ts'

const protocol = 'dsh-live-at-lab/1.0.0-draft'
const scenario = process.env.DSH_ACCESSIBILITY_LIVE_AT_SCENARIO ?? 'complete'
const browser = process.env.DSH_ACCESSIBILITY_AT_LAB_BROWSER ?? 'none'
const scenarios = {
  complete: 'live-interactions',
  stop: 'live-interactions',
  fail: 'live-interactions',
  question: 'question-composer',
  plan: 'plan-review',
  approval: 'approval-composer',
} as const
type Scenario = keyof typeof scenarios

if (!(scenario in scenarios)) throw new Error(`invalid live AT scenario: ${scenario}`)
if (!['none', 'system', 'safari', 'chrome'].includes(browser)) {
  throw new Error(`invalid DSH_ACCESSIBILITY_AT_LAB_BROWSER: ${browser}`)
}
const timeoutMs = Number(process.env.DSH_ACCESSIBILITY_AT_LAB_TIMEOUT_MS ?? '0')
if (!Number.isSafeInteger(timeoutMs) || timeoutMs < 0 || timeoutMs > 86_400_000) {
  throw new Error(`invalid DSH_ACCESSIBILITY_AT_LAB_TIMEOUT_MS: ${String(timeoutMs)}`)
}

const selectedScenario = scenario as Scenario
const fixtureName = scenarios[selectedScenario]
const fixturePath = join(process.cwd(), 'snapshots/web', fixtureName, 'session.jsonl')
const fixture = await readFile(fixturePath, 'utf8')
const recordedPrompts = fixtureUserPrompts(fixture)
if (recordedPrompts.length !== 1 || recordedPrompts[0] === undefined) {
  throw new Error(`live AT fixture must have exactly one synthetic user prompt: ${fixtureName}`)
}
const taskInput = selectedScenario === 'plan' ? `/plan ${recordedPrompts[0]}` : recordedPrompts[0]

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

it('boots a disposable replay world for human live-announcement observation', async () => {
  let temporaryRoot: string | undefined
  let scaffold: WebScaffold | undefined
  let removeEventObserver: (() => void) | undefined
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
    temporaryRoot = await mkdtemp(join(tmpdir(), 'dsh-live-at-lab-'))
    let replayOverride: string | undefined
    if (selectedScenario === 'stop' || selectedScenario === 'fail') {
      replayOverride = join(temporaryRoot, 'replay.override.json')
      const override = selectedScenario === 'stop'
        ? {
            patches: [{
              at: 0,
              entry: { kind: 'hang', readyFile: join(temporaryRoot, 'stream-ready') },
            }],
          }
        : {
            patches: [{
              at: 0,
              entry: {
                kind: 'throw', chunks: [], code: 'AUTH',
                message: 'Synthetic authentication failure for the DSH live AT lab.',
              },
            }],
          }
      await writeFile(replayOverride, JSON.stringify(override))
    }

    const harnessHome = join(temporaryRoot, 'dsh-home')
    scaffold = await launchWebScaffold({
      harnessHome,
      // Bounded smoke mode cannot consume a human-driven replay. Boot the
      // same disposable product world with its fail-loud route-only adapter;
      // the repository's E2E owners separately prove every callable script.
      ...(timeoutMs > 0 ? {} : {
        replayFixture: fixturePath,
        compareReplaySession: false,
        paceMs: 120,
        ...(replayOverride === undefined ? {} : { replayOverride }),
      }),
    })
    const liveWorkspace = join(scaffold.workspaceCwd, 'live-at-workspace')
    await mkdir(liveWorkspace, { recursive: true })
    const createdWorkspace = await scaffold.ctx.workspaceController.create({ path: liveWorkspace })
    const createdSession = await scaffold.ctx.sessionController.create({
      workspaceId: createdWorkspace.workspace.workspaceId,
    })

    removeEventObserver = scaffold.ctx.on('session/event', (_session, event: SessionEvent) => {
      if (event.type !== 'turn/end') return
      process.stdout.write(`${JSON.stringify({
        protocol,
        evidence: 'host-terminal-boundary-not-at-evidence',
        scenario: selectedScenario,
        reason: event.data.reason.kind,
      })}\n`)
    })

    process.stdout.write(`${JSON.stringify({
      protocol,
      evidence: 'lab-ready',
      scenario: selectedScenario,
      dsh: {
        version: process.env.DSH_ACCESSIBILITY_DSH_VERSION ?? 'unavailable',
        revision: process.env.DSH_ACCESSIBILITY_DSH_REVISION ?? 'unavailable',
      },
      environment: { os: platform(), osRelease: release(), architecture: arch() },
      requestedBrowser: browser,
      localOrigin: scaffold.baseUrl,
      syntheticSessionId: String(createdSession.sessionId),
      taskInput,
      persistence: 'temporary; removed when the launcher exits',
      limitations: [
        'lab readiness and Host terminal boundaries are not assistive-technology evidence',
        'actual speech or braille, focus behavior, and task completion require a human record',
        'this replay scenario validates only the selected state transition',
        ...(timeoutMs > 0 ? ['bounded smoke mode does not mount the human-driven replay script'] : []),
      ],
    }, null, 2)}\n`)
    process.stdout.write([
      '',
      `Live AT lab ready for scenario: ${selectedScenario}.`,
      `One-use local sign-in URL (do not publish): ${scaffold.authenticatedUrl}`,
      'Open the synthetic live-at-workspace Session and submit taskInput exactly as printed above.',
      selectedScenario === 'stop'
        ? 'After partial output begins, activate Stop generating and record the actual announcement.'
        : selectedScenario === 'question'
          ? 'Answer the synthetic question, then record tool, request, and response announcements.'
          : selectedScenario === 'plan'
            ? 'Approve the synthetic plan, then record tool, review, and response announcements.'
            : selectedScenario === 'approval'
              ? 'Set Access mode to Read Only before submitting; approve the synthetic command and record every announcement.'
              : 'Wait for the synthetic terminal state and record the actual announcement.',
      'Follow AT-LIVE-LAB.md or AT-LIVE-LAB.zh.md. Do not infer speech from the Host boundary line.',
      timeoutMs === 0
        ? 'Return to this terminal and press Ctrl+C when finished; disposable state will be removed.'
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
    removeEventObserver?.()
    const failures: unknown[] = []
    await scaffold?.close().catch(error => failures.push(error))
    if (temporaryRoot !== undefined) {
      await rm(temporaryRoot, { recursive: true, force: true }).catch(error => failures.push(error))
    }
    if (failures.length > 0) throw new AggregateError(failures, 'Live AT lab cleanup failed')
  }
}, timeoutMs > 0 ? Math.max(120_000, timeoutMs + 30_000) : 86_400_000)
