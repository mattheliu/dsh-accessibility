import { createHash } from 'node:crypto'
import type { Context } from '@deepseek-ai/cordis'
import type { FsTarget } from '@deepseek-ai/dsh-fs'
import { defineTool } from '@deepseek-ai/dsh-tools'
import type { GenericCallView, InferValue, PreToolDecision, ToolExecution, ToolExecutionToken } from '@deepseek-ai/dsh-tools'
import type { AccessibilityAuthoring } from './service.js'
import type { AccessibilityCheckReport } from './types.js'
import type { ResolvedAuthoringConfig } from './config.js'
import { A11Y_CHECK_OUTPUT_SCHEMA } from './report-schema.js'

export const A11Y_CHECK_TOOL_NAME = 'a11y_check' as const

interface PreparedTarget {
  readonly target: FsTarget
  readonly approvalRequired: boolean
}

function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : 'unknown authorization failure'
}

function cwdFor(exec: ToolExecution): string | undefined {
  return exec.agent?.session.header.cwd
}

async function authorizeTarget(
  ctx: Context,
  exec: ToolExecution,
  filePath: string,
  roots: readonly string[],
): Promise<FsTarget> {
  if (filePath.trim().length === 0) throw new Error('file_path must be a non-empty string')
  const cwd = cwdFor(exec)
  const opts = { ...cwd === undefined ? {} : { cwd }, signal: exec.signal }
  const target = await ctx.fs.resolve(filePath, opts)
  let contained = false
  for (const rootPath of roots) {
    const root = await ctx.fs.resolve(rootPath, opts)
    const info = await ctx.fs.stat(root, exec.signal)
    if (info?.type !== 'directory') throw new Error(`configured authoring root is not an existing directory: ${root.displayPath}`)
    if (ctx.fs.contains(root, target)) contained = true
  }
  if (!contained) throw new Error(`a11y_check denied: ${target.displayPath} is outside every configured authoring root`)
  return target
}

/** Compact deterministic text for model and non-card clients. */
export function formatA11yCheckReport(report: AccessibilityCheckReport): string {
  const engines = report.engines.map(engine => `${engine.id}@${engine.version} (${engine.configVersion})`).join(', ')
  const findings = report.findings.slice(0, 50).map(finding => {
    const standards = finding.standards.map(standardRef => standardRef.id).join(', ')
    return `- ${finding.severity.toUpperCase()} ${finding.ruleId} at ${finding.line}:${finding.column}: ${finding.message}${standards.length === 0 ? '' : ` [${standards}]`}`
  })
  return [
    `Accessibility check ${report.outcome}: ${report.target.path}`,
    `Input: sha256:${report.target.sha256}; ${report.target.byteLength} bytes.`,
    `Report schema: ${report.schemaVersion}; engines: ${engines}`,
    `Findings: ${report.summary.errors} errors, ${report.summary.warnings} warnings, ${report.summary.totalFindings} total${report.findingsTruncated ? ' (canonical list truncated)' : ''}.`,
    ...findings,
    report.findings.length > 50 ? `- ${report.findings.length - 50} more canonical findings omitted from this text rendering.` : '',
    'Evidence boundary: automated static check completed; assistive technology not run; disabled-user validation not run.',
    'Uncertainty: automated coverage is partial; rendered behavior was not observed; human judgment is required.',
    'This report is not accessibility certification. Human review is still required.',
  ].filter(Boolean).join('\n')
}

/** Register the opt-in read-only tool and its canonical containment/approval gate. */
export function applyA11yCheckTool(
  ctx: Context,
  authoring: AccessibilityAuthoring,
  config: ResolvedAuthoringConfig,
): void {
  const prepared = new Map<ToolExecutionToken, PreparedTarget>()

  ctx.on('tools/pre-execute', async (exec, next): Promise<PreToolDecision> => {
    if (exec.name !== A11Y_CHECK_TOOL_NAME) return next()
    const downstream = await next()
    if (downstream.kind === 'deny') return downstream
    const args = exec.arguments as { file_path?: unknown }
    if (typeof args.file_path !== 'string') return { kind: 'deny', reason: 'a11y_check requires a string file_path' }
    try {
      const target = await authorizeTarget(ctx, exec, args.file_path, config.allowedRoots)
      prepared.set(exec.token, {
        target,
        approvalRequired: config.access === 'approval' || downstream.kind === 'ask',
      })
    } catch (error) {
      return { kind: 'deny', reason: errorMessage(error) }
    }
    if (config.access === 'approval') {
      const ownReason = `Allow one read-only offline accessibility check of ${args.file_path}? The file is inside a configured root; no file will be changed or sent over the network.`
      return { kind: 'ask', reason: downstream.kind === 'ask' && downstream.reason ? `${downstream.reason}\n${ownReason}` : ownReason }
    }
    return downstream
  })

  ctx.on('tools/result', (exec) => {
    if (exec.name === A11Y_CHECK_TOOL_NAME) prepared.delete(exec.token)
  })

  ctx.tools.register(defineTool({
    name: A11Y_CHECK_TOOL_NAME,
    description: 'Run a deterministic offline static-HTML accessibility check. Read-only; limited to configured roots; does not prove WCAG conformance or assistive-technology usability.',
    parameters: {
      file_path: { type: 'string', required: true, description: 'Static HTML file inside an explicitly configured authoring root.' },
    },
    output: {
      schema: A11Y_CHECK_OUTPUT_SCHEMA,
      render: (_args, value) => [{ type: 'text', text: formatA11yCheckReport(value) }],
    },
    isConcurrencySafe: () => true,
    async execute(_args, exec) {
      const authorized = prepared.get(exec.token)
      prepared.delete(exec.token)
      if (authorized === undefined) throw new Error('a11y_check authorization evidence is missing; retry the call')
      const info = await ctx.fs.stat(authorized.target, exec.signal)
      if (info === undefined) throw new Error(`a11y_check target does not exist: ${authorized.target.displayPath}`)
      if (info.type !== 'file') throw new Error(`a11y_check target is not a regular file: ${authorized.target.displayPath}`)
      if (info.size !== undefined && info.size > config.maxBytes) {
        throw new Error(`a11y_check target exceeds authoring.maxBytes (${config.maxBytes})`)
      }
      const bytes = await ctx.fs.readBytes(authorized.target, exec.signal, config.maxBytes)
      let content: string
      try {
        content = new TextDecoder('utf-8', { fatal: true }).decode(bytes)
      } catch (cause) {
        throw new Error(`a11y_check target is not valid UTF-8 text: ${authorized.target.displayPath}`, { cause })
      }
      ctx.emit('fs/observed', authorized.target, { kind: 'present', version: info.version }, exec)
      const report = await authoring.check({
        source: { kind: 'web-static', path: authorized.target.displayPath, content },
        inputEvidence: {
          sha256: createHash('sha256').update(bytes).digest('hex'),
          byteLength: bytes.byteLength,
        },
        authorization: {
          mode: authorized.approvalRequired ? 'configured-root+approval' : 'configured-root',
          configuredRootCount: config.allowedRoots.length,
          approval: authorized.approvalRequired ? 'allowed-once' : 'not-required',
          readOnly: true,
          network: 'none',
        },
        maxFindings: config.maxFindings,
      }, exec.signal)
      // The report interfaces expose readonly evidence to providers; the tool
      // registry validates and freezes the same JSON shape at its wire boundary.
      return report as unknown as InferValue<typeof A11Y_CHECK_OUTPUT_SCHEMA>
    },
    presentCall(args): GenericCallView | undefined {
      const path = (args as { file_path?: unknown }).file_path
      if (typeof path !== 'string') return undefined
      return {
        card: 'generic',
        title: `Check accessibility: ${path}`,
        kind: 'read',
        rawInput: path,
        locations: [{ path }],
      }
    },
  }))
}
