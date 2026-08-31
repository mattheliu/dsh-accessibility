/** Disposable product-entry verification for DSH headless accessibility output. */
import { mkdtempSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { startMockLlmServer } from '@deepseek-ai/dsh-llm-mock-server'
import { execa } from 'execa'
import { expect, it } from 'vitest'

const protocol = 'dsh-cli-accessibility/1.0.0-draft'
const dshBin = fileURLToPath(new URL('../lib/bin.js', import.meta.url))
const timeoutMs = 60_000

async function runDsh(
  args: readonly string[],
  environment: Readonly<Record<string, string>>,
  cwd: string,
): Promise<{ stdout: string; stderr: string; code: number }> {
  const result = await execa(process.execPath, [dshBin, ...args], {
    cwd,
    input: '',
    timeout: timeoutMs,
    killSignal: 'SIGKILL',
    reject: false,
    env: { ...process.env, ...environment },
    extendEnv: false,
  })
  if (result.timedOut)
    throw new Error(`DSH CLI conformance process exceeded ${String(timeoutMs)} ms`)
  return {
    stdout: result.stdout,
    stderr: result.stderr,
    code: result.exitCode ?? -1,
  }
}

function expectStableTerminalText(value: string): void {
  const disallowed = Array.from(value).filter((character) => {
    const code = character.charCodeAt(0)
    return (
      code === 0x1b ||
      code === 0x0d ||
      code === 0x07 ||
      code === 0x08 ||
      (code >= 0x7f && code <= 0x9f)
    )
  })
  expect(disallowed).toEqual([])
}

it('conforms to the draft versioned CLI accessibility output protocol', async () => {
  const apiKey = 'dsh-cli-conformance-synthetic-key'
  const reasoningSentinel = 'SENSITIVE_REASONING_SENTINEL'
  const successServer = await startMockLlmServer({
    sequence: ['reasoning_success'],
    repeatLast: true,
    apiKey,
    reasoningText: reasoningSentinel,
    successText: 'CLI ACCESSIBILITY OK',
  })
  const failureServer = await startMockLlmServer({
    sequence: ['auth_error'],
    repeatLast: true,
    apiKey,
  })
  const home = mkdtempSync(join(tmpdir(), 'dsh-cli-conformance-'))
  const common = {
    DSH_HOME: home,
    DSH_TELEMETRY_DISABLED: '1',
    DEEPSEEK_API_KEY: apiKey,
  }

  try {
    const help = await runDsh(['--profile', 'headless', '--help'], common, home)
    expect(help).toMatchObject({ code: 0, stderr: '' })
    expect(help.stdout).toContain('--accessibility')
    expect(help.stdout).toContain('--output-format <format>')

    const invalid = await runDsh(
      ['--profile', 'headless', '--output-format', 'xml', 'synthetic task'],
      common,
      home,
    )
    expect(invalid.code).toBe(1)
    expect(invalid.stderr).toContain('--output-format must be text or json')
    expect(successServer.requests).toHaveLength(0)

    const accessible = await runDsh(
      ['--profile', 'headless', '--accessibility', 'synthetic accessible task'],
      { ...common, DEEPSEEK_BASE_URL: successServer.baseURL },
      home,
    )
    expect(accessible).toEqual({
      code: 0,
      stdout: 'CLI ACCESSIBILITY OK',
      stderr: 'dsh: task started\ndsh: task completed',
    })
    expect(accessible.stderr).not.toContain(reasoningSentinel)
    expectStableTerminalText(accessible.stdout + accessible.stderr)

    const json = await runDsh(
      ['--profile', 'headless', '--output-format', 'json', 'synthetic JSON task'],
      { ...common, DEEPSEEK_BASE_URL: successServer.baseURL },
      home,
    )
    expect(json.code).toBe(0)
    expect(json.stderr).toBe('')
    expect(json.stdout.split('\n')).toHaveLength(1)
    expect(JSON.parse(json.stdout) as unknown).toEqual({
      type: 'dsh-headless-result',
      schemaVersion: '1.0.0',
      status: 'completed',
      text: 'CLI ACCESSIBILITY OK',
      reason: { kind: 'completed' },
    })

    const accessibleFailure = await runDsh(
      ['--profile', 'headless', '--accessibility', 'synthetic failure task'],
      { ...common, DEEPSEEK_BASE_URL: failureServer.baseURL },
      home,
    )
    expect(accessibleFailure.code).toBe(1)
    expect(accessibleFailure.stdout).toBe('')
    expect(accessibleFailure.stderr.split('\n')).toHaveLength(2)
    expect(accessibleFailure.stderr.split('\n')[0]).toBe('dsh: task started')
    expect(accessibleFailure.stderr.split('\n')[1]).toMatch(/^dsh: task failed: \S+: \S/u)
    expectStableTerminalText(accessibleFailure.stderr)

    const jsonFailure = await runDsh(
      ['--profile', 'headless', '--output-format', 'json', 'synthetic JSON failure task'],
      { ...common, DEEPSEEK_BASE_URL: failureServer.baseURL },
      home,
    )
    expect(jsonFailure.code).toBe(1)
    expect(jsonFailure.stderr).toBe('')
    expect(jsonFailure.stdout.split('\n')).toHaveLength(1)
    expect(JSON.parse(jsonFailure.stdout) as unknown).toMatchObject({
      type: 'dsh-headless-result',
      schemaVersion: '1.0.0',
      status: 'failed',
      text: '',
      reason: { kind: 'error' },
    })

    process.stdout.write(
      `${JSON.stringify({
        protocol,
        evidence: 'automated-process-output-not-at-evidence',
        dsh: {
          version: process.env.DSH_ACCESSIBILITY_DSH_VERSION ?? 'unavailable',
          revision: process.env.DSH_ACCESSIBILITY_DSH_REVISION ?? 'unavailable',
        },
        cases: [
          'help-discovery',
          'invalid-format-fail-closed',
          'accessible-completed',
          'json-completed',
          'accessible-error',
          'json-error',
        ],
        limitations: [
          'process bytes do not prove speech, braille, terminal cursor behavior, or disabled-user task completion',
          'real assistive-technology evidence uses the manual lab and a human record',
        ],
      })}\n`,
    )
  } finally {
    await Promise.allSettled([successServer.close(), failureServer.close()])
    rmSync(home, { recursive: true, force: true })
  }
}, 120_000)
