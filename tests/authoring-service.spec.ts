import { Context } from '@deepseek-ai/cordis'
import { describe, expect, it } from 'vitest'
import { AccessibilityAuthoring } from '../src/authoring/service.ts'
import type { AccessibilityEngine } from '../src/authoring/types.ts'

const authorization = {
  mode: 'configured-root' as const,
  configuredRootCount: 1,
  approval: 'not-required' as const,
  readOnly: true as const,
  network: 'none' as const,
}
const inputEvidence = { sha256: '0'.repeat(64), byteLength: 13 }

function engine(id: string, findings: Awaited<ReturnType<AccessibilityEngine['check']>>['findings']): AccessibilityEngine {
  return {
    id,
    version: '1.2.3',
    configVersion: 'fixture-1',
    targetKinds: ['web-static'],
    async check() { return { findings } },
  }
}

describe('accessibility authoring service', () => {
  it('aggregates providers deterministically, caps output, and preserves evidence boundaries', async () => {
    const ctx = new Context()
    const service = new AccessibilityAuthoring(ctx)
    service.registerEngine(engine('z-engine', [{
      ruleId: 'late', severity: 'warning', message: 'later', line: 2, column: 1, standards: [],
    }]))
    service.registerEngine(engine('a-engine', [{
      ruleId: 'first', severity: 'error', message: 'first', line: 1, column: 1, standards: [],
    }]))

    const report = await service.check({
      source: { kind: 'web-static', path: '/workspace/page.html', content: '<main></main>' },
      inputEvidence,
      authorization,
      maxFindings: 1,
    })

    expect(report.engines.map(item => item.id)).toEqual(['a-engine', 'z-engine'])
    expect(report.outcome).toBe('fail')
    expect(report.summary).toEqual({ errors: 1, warnings: 1, totalFindings: 2 })
    expect(report.findings).toHaveLength(1)
    expect(report.findingsTruncated).toBe(true)
    expect(report.evidence).toEqual({ automated: 'completed', assistiveTechnology: 'not-run', disabledUser: 'not-run' })
    expect(report.certification).toBe(false)
    expect(report.humanReviewRequired.map(item => item.id)).toContain('disabled-user-task-validation')
  })

  it('rejects duplicate providers and propagates provider failures instead of issuing partial evidence', async () => {
    const ctx = new Context()
    const service = new AccessibilityAuthoring(ctx)
    service.registerEngine(engine('fixture', []))
    expect(() => service.registerEngine(engine('fixture', []))).toThrow(/already registered/u)
    service.registerEngine({
      ...engine('broken', []),
      async check() { throw new Error('engine unavailable') },
    })
    await expect(service.check({
      source: { kind: 'web-static', path: 'page.html', content: '' }, inputEvidence, authorization, maxFindings: 10,
    })).rejects.toThrow('engine unavailable')
  })
})
