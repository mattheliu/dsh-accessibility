import {
  ACCESSIBILITY_CHECK_IDS,
  type AccessibilityCheck,
  type AccessibilityCheckId,
} from './audit.ts'

/** Versioned, privacy-minimized export contract for companion diagnostics. */
export const REDACTED_DIAGNOSTIC_PROTOCOL = 'dsh-accessibility-diagnostic/1.0.0-draft' as const

export interface RedactedDiagnosticCheck {
  id: AccessibilityCheckId
  outcome: 'passed' | 'needs-attention'
  affected: number
}

export interface RedactedDiagnosticReport {
  protocol: typeof REDACTED_DIAGNOSTIC_PROTOCOL
  generatedAt: string
  scope: 'current-document-structure'
  claim: 'none'
  summary: {
    total: number
    passed: number
    needsAttention: number
  }
  checks: RedactedDiagnosticCheck[]
  omitted: readonly [
    'page-url',
    'page-title',
    'dom-content',
    'selectors',
    'element-names',
    'conversation-content',
    'user-agent',
  ]
  limitations: readonly [
    'deterministic-structure-only',
    'manual-and-assistive-technology-evaluation-required',
    'not-a-wcag-conformance-claim',
  ]
}

function canonicalTimestamp(now: Date): string {
  if (Number.isNaN(now.getTime())) throw new TypeError('report timestamp must be valid')
  return now.toISOString()
}

function canonicalChecks(checks: readonly AccessibilityCheck[]): RedactedDiagnosticCheck[] {
  if (checks.length !== ACCESSIBILITY_CHECK_IDS.length) {
    throw new TypeError('diagnostic report requires the complete check set')
  }
  return ACCESSIBILITY_CHECK_IDS.map((id, index) => {
    const source = checks[index]
    if (source === undefined || source.id !== id) {
      throw new TypeError('diagnostic report requires the stable check order')
    }
    if (!Number.isSafeInteger(source.affected) || source.affected < 0) {
      throw new TypeError(`diagnostic ${id} affected count must be a non-negative safe integer`)
    }
    if (source.passed !== (source.affected === 0)) {
      throw new TypeError(`diagnostic ${id} outcome and affected count disagree`)
    }
    return {
      id,
      outcome: source.passed ? 'passed' : 'needs-attention',
      affected: source.affected,
    }
  })
}

/**
 * Project an exact internal check set onto an allowlisted report. Arbitrary
 * source properties are ignored so DOM data cannot cross this export boundary.
 */
export function createRedactedDiagnosticReport(
  checks: readonly AccessibilityCheck[],
  now: Date = new Date(),
): RedactedDiagnosticReport {
  const projected = canonicalChecks(checks)
  const needsAttention = projected.filter(check => check.outcome === 'needs-attention').length
  return {
    protocol: REDACTED_DIAGNOSTIC_PROTOCOL,
    generatedAt: canonicalTimestamp(now),
    scope: 'current-document-structure',
    claim: 'none',
    summary: {
      total: projected.length,
      passed: projected.length - needsAttention,
      needsAttention,
    },
    checks: projected,
    omitted: [
      'page-url',
      'page-title',
      'dom-content',
      'selectors',
      'element-names',
      'conversation-content',
      'user-agent',
    ],
    limitations: [
      'deterministic-structure-only',
      'manual-and-assistive-technology-evaluation-required',
      'not-a-wcag-conformance-claim',
    ],
  }
}

/** Stable text form used only after an explicit user clipboard action. */
export function redactedDiagnosticReportText(
  checks: readonly AccessibilityCheck[],
  now: Date = new Date(),
): string {
  return `${JSON.stringify(createRedactedDiagnosticReport(checks, now), null, 2)}\n`
}
