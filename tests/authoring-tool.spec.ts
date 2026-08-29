import { posix } from 'node:path'
import { Context } from '@deepseek-ai/cordis'
import { FileSystem, FsError, FsTargetKey, FsVersion } from '@deepseek-ai/dsh-fs'
import type {
  FsDirEntry,
  FsEditOutcome,
  FsEditRequest,
  FsInfo,
  FsPathInfo,
  FsTarget,
  FsWriteIntent,
  FsWriteOutcome,
} from '@deepseek-ai/dsh-fs'
import ToolRuntime from '@deepseek-ai/dsh-tools'
import SystemPrompt from '@deepseek-ai/dsh-system-prompt'
import { describe, expect, it } from 'vitest'
import { resolveAuthoringConfig } from '../src/authoring/config.ts'
import { apply } from '../src/index.ts'

class MemoryFs extends FileSystem {
  readonly directories = new Set(['/workspace', '/outside'])
  readonly files = new Map<string, Uint8Array>()
  readCount = 0

  override async resolve(path: string, opts?: { cwd?: string }): Promise<FsTarget> {
    const canonical = posix.resolve(opts?.cwd ?? '/', path)
    return { targetKey: FsTargetKey(canonical), displayPath: canonical }
  }

  override processPath(target: FsTarget): string { return target.displayPath }
  override fileUrl(target: FsTarget): string { return `file://${target.displayPath}` }
  override contains(parent: FsTarget, child: FsTarget): boolean {
    const root = String(parent.targetKey)
    const candidate = String(child.targetKey)
    return candidate === root || candidate.startsWith(`${root}/`)
  }

  override async stat(target: FsTarget): Promise<FsInfo | undefined> {
    const path = String(target.targetKey)
    if (this.directories.has(path)) return { type: 'directory', version: FsVersion('dir-v1') }
    const content = this.files.get(path)
    return content === undefined ? undefined : { type: 'file', size: content.length, version: FsVersion('file-v1') }
  }

  override async lstat(path: string, opts?: { cwd?: string }): Promise<FsPathInfo | undefined> {
    const target = await this.resolve(path, opts)
    return this.stat(target)
  }

  override async readText(target: FsTarget): Promise<string> {
    return new TextDecoder().decode(await this.readBytes(target, undefined, Number.MAX_SAFE_INTEGER))
  }

  override async streamText(target: FsTarget): Promise<AsyncIterable<string>> {
    const content = await this.readText(target)
    return (async function* () { yield content })()
  }

  override async readBytes(target: FsTarget, _signal: AbortSignal | undefined, maxBytes: number): Promise<Uint8Array> {
    this.readCount += 1
    const content = this.files.get(String(target.targetKey))
    if (content === undefined) throw new FsError(`not found: ${target.displayPath}`, 'FS_NOT_FOUND')
    if (content.length > maxBytes) throw new FsError(`too large: ${target.displayPath}`, 'FS_TOO_LARGE')
    return content
  }

  override async listDir(): Promise<FsDirEntry[]> { return [] }
  override async writeText(_target: FsTarget, _content: string, _expected?: FsWriteIntent): Promise<FsWriteOutcome> {
    throw new Error('test backend is read-only')
  }
  override async editText(_target: FsTarget, _edit: FsEditRequest): Promise<FsEditOutcome> {
    throw new Error('test backend is read-only')
  }
}

let callId = 0
const signal = new AbortController().signal

async function setup(access: 'approval' | 'allowlist' = 'allowlist', maxBytes = 1024 * 1024) {
  const ctx = new Context()
  await ctx.plugin(SystemPrompt)
  await ctx.plugin(ToolRuntime)
  await ctx.plugin(MemoryFs)
  const fs = ctx.fs as MemoryFs
  apply(ctx, {
    authoring: { enabled: true, access, allowedRoots: ['/workspace'], maxBytes },
  })
  return { ctx, fs }
}

function execute(ctx: Context, filePath: string) {
  return ctx.tools.execute({
    callId: `a11y-check-${++callId}` as never,
    name: 'a11y_check',
    arguments: { file_path: filePath },
    signal,
  })
}

const passingHtml = '<!doctype html><html lang="en"><head><title>Test</title></head><body><main><h1>Test</h1></main></body></html>'

describe('permissioned a11y_check tool', () => {
  it('requires roots when enabled', () => {
    expect(resolveAuthoringConfig().enabled).toBe(false)
    expect(() => resolveAuthoringConfig({ authoring: { enabled: true } })).toThrow(/allowedRoots/u)
  })

  it('does not register a model tool under the default configuration', async () => {
    const ctx = new Context()
    await ctx.plugin(SystemPrompt)
    await ctx.plugin(ToolRuntime)
    apply(ctx)
    expect(ctx.tools.get('a11y_check')).toBeUndefined()
    expect(ctx.accessibilityAuthoring).toBeDefined()
  })

  it('checks a file inside an allowlisted canonical root and records honest evidence', async () => {
    const { ctx, fs } = await setup()
    fs.files.set('/workspace/page.html', new TextEncoder().encode(passingHtml))

    const result = await execute(ctx, '/workspace/./page.html')

    expect(result.isError).toBe(false)
    if (result.isError) throw new Error('expected success')
    expect(result.value).toMatchObject({
      schemaVersion: '1.0.0',
      outcome: 'pass',
      target: { path: '/workspace/page.html', sha256: expect.stringMatching(/^[0-9a-f]{64}$/u), byteLength: passingHtml.length },
      authorization: { mode: 'configured-root', approval: 'not-required', readOnly: true, network: 'none' },
      evidence: { automated: 'completed', assistiveTechnology: 'not-run', disabledUser: 'not-run' },
      uncertainty: { automatedCoverage: 'partial', renderedBehavior: 'not-observed', humanJudgment: 'required' },
      certification: false,
    })
    expect(fs.readCount).toBe(1)
  })

  it('denies traversal outside configured roots before reading content', async () => {
    const { ctx, fs } = await setup()
    fs.files.set('/outside/private.html', new TextEncoder().encode(passingHtml))

    const result = await execute(ctx, '/workspace/../outside/private.html')

    expect(result.isError).toBe(true)
    expect(result.content).toEqual([expect.objectContaining({ type: 'text', text: expect.stringMatching(/outside every configured authoring root/u) })])
    expect(fs.readCount).toBe(0)
  })

  it('fails closed before reading when approval mode has no approval service', async () => {
    const { ctx, fs } = await setup('approval')
    fs.files.set('/workspace/page.html', new TextEncoder().encode(passingHtml))

    const result = await execute(ctx, '/workspace/page.html')

    expect(result.isError).toBe(true)
    expect(result.content).toEqual([expect.objectContaining({ type: 'text', text: expect.stringMatching(/Allow one read-only offline accessibility check/u) })])
    expect(fs.readCount).toBe(0)
  })

  it('enforces the byte cap before the deterministic engine receives content', async () => {
    const { ctx, fs } = await setup('allowlist', 20)
    fs.files.set('/workspace/page.html', new TextEncoder().encode(passingHtml))
    const result = await execute(ctx, '/workspace/page.html')
    expect(result.isError).toBe(true)
    expect(result.content).toEqual([expect.objectContaining({ type: 'text', text: expect.stringMatching(/maxBytes/u) })])
    expect(fs.readCount).toBe(0)
  })
})
