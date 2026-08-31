import { readFileSync } from 'node:fs'
import Ajv2020 from 'ajv/dist/2020.js'
import addFormats from 'ajv-formats'
import { describe, expect, it } from 'vitest'
import { ACCESSIBILITY_CHECK_IDS, type AccessibilityCheck } from '../src/client/audit.ts'
import {
  createRedactedDiagnosticReport,
  REDACTED_DIAGNOSTIC_PROTOCOL,
  redactedDiagnosticReportText,
} from '../src/client/diagnostic-report.ts'

function completeChecks(): AccessibilityCheck[] {
  return ACCESSIBILITY_CHECK_IDS.map(id => ({ id, passed: true, affected: 0 }))
}

describe('redacted diagnostic report boundary', () => {
  it('exports only stable IDs, outcomes, counts, and explicit limitations', () => {
    const checks = completeChecks()
    checks[3] = {
      ...checks[3]!,
      passed: false,
      affected: 2,
      url: 'https://private.example/account',
      html: '<button>customer name</button>',
      selector: '#private-customer',
    } as AccessibilityCheck
    const now = new Date('2026-08-31T08:00:00.000Z')
    const report = createRedactedDiagnosticReport(checks, now)

    expect(report).toMatchObject({
      protocol: REDACTED_DIAGNOSTIC_PROTOCOL,
      generatedAt: '2026-08-31T08:00:00.000Z',
      scope: 'current-document-structure',
      claim: 'none',
      summary: { total: 17, passed: 16, needsAttention: 1 },
      checks: expect.arrayContaining([
        { id: 'controls', outcome: 'needs-attention', affected: 2 },
      ]),
    })
    expect(report.omitted).toEqual(expect.arrayContaining([
      'page-url', 'dom-content', 'selectors', 'element-names', 'conversation-content',
    ]))
    expect(report.limitations).toContain('not-a-wcag-conformance-claim')
    const serialized = JSON.stringify(report)
    expect(serialized).not.toContain('private.example')
    expect(serialized).not.toContain('customer name')
    expect(serialized).not.toContain('#private-customer')
    expect(redactedDiagnosticReportText(checks, now)).toBe(`${JSON.stringify(report, null, 2)}\n`)
  })

  it.each([
    ['incomplete set', completeChecks().slice(1), 'complete check set'],
    ['unstable order', completeChecks().toReversed(), 'stable check order'],
    ['negative count', completeChecks().map(check => check.id === 'main' ? { ...check, affected: -1 } : check), 'non-negative safe integer'],
    ['fractional count', completeChecks().map(check => check.id === 'main' ? { ...check, affected: 1.5 } : check), 'non-negative safe integer'],
    ['mismatched pass', completeChecks().map(check => check.id === 'main' ? { ...check, passed: false } : check), 'outcome and affected count disagree'],
  ])('rejects a malformed source boundary: %s', (_name, checks, message) => {
    expect(() => createRedactedDiagnosticReport(checks, new Date(0))).toThrow(message)
  })

  it('rejects an invalid timestamp', () => {
    expect(() => createRedactedDiagnosticReport(completeChecks(), new Date(Number.NaN))).toThrow(
      'report timestamp must be valid',
    )
  })

  it('matches the shipped strict JSON Schema', () => {
    const schema = JSON.parse(readFileSync(
      new URL('../DIAGNOSTIC-REPORT.schema.json', import.meta.url),
      'utf8',
    )) as object
    const ajv = new Ajv2020({ allErrors: true, strict: true })
    addFormats(ajv)
    const validate = ajv.compile(schema)
    const report = createRedactedDiagnosticReport(
      completeChecks(),
      new Date('2026-08-31T08:00:00.000Z'),
    )
    expect(validate(report), JSON.stringify(validate.errors)).toBe(true)

    const extra = { ...report, pageUrl: 'https://private.example/' }
    expect(validate(extra)).toBe(false)
    const wrongOrder = structuredClone(report)
    wrongOrder.checks.reverse()
    expect(validate(wrongOrder)).toBe(false)
    const falsePass = structuredClone(report)
    falsePass.checks[0]!.affected = 1
    expect(validate(falsePass)).toBe(false)
  })
})
