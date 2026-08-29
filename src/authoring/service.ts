import { Context, Service } from '@deepseek-ai/cordis'
import { HUMAN_REVIEW_REQUIREMENTS, STATIC_CHECK_LIMITATIONS } from './standards.js'
import {
  A11Y_CHECK_REPORT_VERSION,
  type AccessibilityCheckReport,
  type AccessibilityCheckRequest,
  type AccessibilityEngine,
  type AccessibilityEngineEvidence,
  type AccessibilityEngineFinding,
  type AccessibilityFinding,
} from './types.js'

declare module '@deepseek-ai/cordis' {
  interface Context {
    accessibilityAuthoring: AccessibilityAuthoring
  }
}

const ENGINE_ID = /^[a-z][a-z0-9]*(?:[.-][a-z0-9]+)*$/u
const EXACT_SEMVER = /^\d+\.\d+\.\d+(?:-[0-9A-Za-z.-]+)?(?:\+[0-9A-Za-z.-]+)?$/u

function assertEngine(engine: AccessibilityEngine): void {
  if (!ENGINE_ID.test(engine.id)) {
    throw new Error(`accessibility authoring engine id "${engine.id}" must use lowercase letters, digits, dots, or hyphens`)
  }
  if (!EXACT_SEMVER.test(engine.version)) throw new Error(`accessibility authoring engine "${engine.id}" needs an exact semantic version`)
  if (engine.configVersion.trim().length === 0) throw new Error(`accessibility authoring engine "${engine.id}" needs a config version`)
  if (engine.targetKinds.length === 0) throw new Error(`accessibility authoring engine "${engine.id}" needs at least one target kind`)
  if (engine.targetKinds.some(kind => !ENGINE_ID.test(kind))) {
    throw new Error(`accessibility authoring engine "${engine.id}" has an invalid target kind`)
  }
  if (new Set(engine.targetKinds).size !== engine.targetKinds.length) {
    throw new Error(`accessibility authoring engine "${engine.id}" has duplicate target kinds`)
  }
}

function assertFinding(engineId: string, finding: AccessibilityEngineFinding): void {
  if (finding.ruleId.trim().length === 0) throw new Error(`accessibility authoring engine "${engineId}" returned an empty rule id`)
  if (finding.severity !== 'error' && finding.severity !== 'warning') {
    throw new Error(`accessibility authoring engine "${engineId}" returned an invalid severity for "${finding.ruleId}"`)
  }
  if (finding.message.trim().length === 0) throw new Error(`accessibility authoring engine "${engineId}" returned an empty message`)
  if (!Number.isInteger(finding.line) || finding.line < 1) {
    throw new Error(`accessibility authoring engine "${engineId}" returned an invalid line for "${finding.ruleId}"`)
  }
  if (!Number.isInteger(finding.column) || finding.column < 1) {
    throw new Error(`accessibility authoring engine "${engineId}" returned an invalid column for "${finding.ruleId}"`)
  }
  for (const standard of finding.standards) {
    if (standard.id.trim().length === 0 || standard.level.trim().length === 0 || standard.url.trim().length === 0) {
      throw new Error(`accessibility authoring engine "${engineId}" returned an invalid standard for "${finding.ruleId}"`)
    }
  }
}

function compareFindings(left: AccessibilityFinding, right: AccessibilityFinding): number {
  return left.line - right.line
    || left.column - right.column
    || left.engineId.localeCompare(right.engineId)
    || left.ruleId.localeCompare(right.ruleId)
    || left.message.localeCompare(right.message)
}

/** Registry and deterministic aggregation service for accessibility authoring engines. */
export class AccessibilityAuthoring extends Service {
  private readonly engines = new Map<string, AccessibilityEngine>()

  constructor(ctx: Context) {
    super(ctx, 'accessibilityAuthoring')
  }

  /**
   * Register trusted installed code as an engine provider. Checked projects and
   * model arguments cannot load providers.
   * @param engine - provider with exact implementation and configuration versions.
   * @returns an idempotent disposer owned by the registering plugin fiber.
   */
  registerEngine(engine: AccessibilityEngine): () => void {
    assertEngine(engine)
    if (this.engines.has(engine.id)) throw new Error(`accessibility authoring engine "${engine.id}" is already registered`)
    const engines = this.engines
    const dispose = this.ctx.effect(function* () {
      engines.set(engine.id, engine)
      yield () => { engines.delete(engine.id) }
    }, `accessibilityAuthoring.registerEngine(${engine.id})`)
    return () => { void dispose() }
  }

  /**
   * Run every provider for the source kind and return one stable evidence report.
   * Provider failures reject the report instead of silently producing partial evidence.
   * @param request - already-authorized source, permission evidence, and finding cap.
   * @param signal - cancellation shared with every provider.
   * @returns the complete deterministic report; it always marks AT and user evidence not run.
   */
  async check(request: AccessibilityCheckRequest, signal?: AbortSignal): Promise<AccessibilityCheckReport> {
    if (!Number.isInteger(request.maxFindings) || request.maxFindings < 1) {
      throw new Error('a11y_check maxFindings must be a positive integer')
    }
    if (!/^[0-9a-f]{64}$/u.test(request.inputEvidence.sha256)) throw new Error('accessibility input evidence needs a lowercase SHA-256 digest')
    if (!Number.isSafeInteger(request.inputEvidence.byteLength) || request.inputEvidence.byteLength < 0) {
      throw new Error('accessibility input evidence needs a non-negative safe byte length')
    }
    signal?.throwIfAborted()
    const engines = [...this.engines.values()]
      .filter(engine => engine.targetKinds.includes(request.source.kind))
      .sort((left, right) => left.id.localeCompare(right.id))
    if (engines.length === 0) throw new Error(`no accessibility authoring engine supports "${request.source.kind}"`)

    const allFindings: AccessibilityFinding[] = []
    const engineEvidence: AccessibilityEngineEvidence[] = []
    for (const engine of engines) {
      signal?.throwIfAborted()
      const result = await engine.check(request.source, signal)
      for (const finding of result.findings) {
        assertFinding(engine.id, finding)
        allFindings.push({ ...finding, id: '', engineId: engine.id })
      }
      engineEvidence.push({
        id: engine.id,
        version: engine.version,
        configVersion: engine.configVersion,
        findingCount: result.findings.length,
      })
    }

    allFindings.sort(compareFindings)
    const findings = allFindings.slice(0, request.maxFindings).map((finding, index) => ({
      ...finding,
      id: `${finding.engineId}/${finding.ruleId}/${finding.line}:${finding.column}/${index + 1}`,
    }))
    const errors = allFindings.filter(finding => finding.severity === 'error').length
    const warnings = allFindings.length - errors
    const outcome = errors > 0 ? 'fail' : warnings > 0 ? 'pass-with-warnings' : 'pass'

    return {
      schemaVersion: A11Y_CHECK_REPORT_VERSION,
      target: { kind: request.source.kind, path: request.source.path, ...request.inputEvidence },
      authorization: request.authorization,
      engines: engineEvidence,
      outcome,
      summary: { errors, warnings, totalFindings: allFindings.length },
      findings,
      findingsTruncated: findings.length < allFindings.length,
      evidence: {
        automated: 'completed',
        assistiveTechnology: 'not-run',
        disabledUser: 'not-run',
      },
      uncertainty: {
        automatedCoverage: 'partial',
        renderedBehavior: 'not-observed',
        humanJudgment: 'required',
      },
      humanReviewRequired: HUMAN_REVIEW_REQUIREMENTS,
      limitations: STATIC_CHECK_LIMITATIONS,
      certification: false,
    }
  }
}
