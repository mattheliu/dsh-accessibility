import { readFileSync } from 'node:fs'
import Ajv2020 from 'ajv/dist/2020.js'
import addFormats from 'ajv-formats'
import { describe, expect, it } from 'vitest'

const root = new URL('../', import.meta.url)
const manifest = JSON.parse(readFileSync(new URL('PRIMARY-AT-CAMPAIGN.json', root), 'utf8'))
const schema = JSON.parse(readFileSync(new URL('PRIMARY-AT-CAMPAIGN.schema.json', root), 'utf8'))

function source(file) {
  return readFileSync(new URL(file, root), 'utf8')
}

describe('primary human assistive-technology campaign', () => {
  it('opens the exact lab-ready candidate without creating human evidence', () => {
    expect(manifest).toMatchObject({
      protocol: 'dsh-a11y-primary-at-campaign/0.1.0-draft',
      status: 'open',
      candidate: {
        package: '@deepseek-ai/dsh',
        version: '0.1.2-alpha.2',
        revision: '5803bfcfdd502adac26ae9b8eec12d6aed263ec6',
      },
      lab: {
        package: '@oh-my-dsh/dsh-accessibility',
        version: '0.1.0-beta.6',
        revision: '6aed71615edd1db1ec5b12897e1ad40b79294c78',
      },
      automatedEvidence: {
        protocol: 'dsh-non-at-browser/1.0.0-draft',
        evidence: 'dsh-core-browser-non-at',
        dshRevision: '5803bfcfdd502adac26ae9b8eec12d6aed263ec6',
        result: 'pass',
        claimBoundary: 'automated-only-not-at-or-user-evidence',
      },
    })
    expect(manifest.priorityRequirements.map(row => row.requirementId)).toEqual([
      'voiceover-safari-core-web',
      'nvda-chrome-core-web',
      'disabled-developer-core-web',
    ])
    expect(manifest.availabilityGates).toHaveLength(5)
    expect(manifest.availabilityGates.every(gate => gate.status === 'ready')).toBe(true)
    expect(manifest.evidenceBoundary.join('\n')).toMatch(/zero human records/)
    expect(manifest.evidenceBoundary.join('\n')).toMatch(/not assistive-technology or disabled-user evidence/)
    expect(manifest.automatedEvidence.dshRevision).toBe(manifest.candidate.revision)
    expect(source(manifest.automatedEvidence.path)).toContain(manifest.candidate.revision)
  })

  it('validates the manifest and refuses an open campaign with a missing public gate', () => {
    const ajv = new Ajv2020({ allErrors: true, strict: true })
    addFormats(ajv)
    const validate = ajv.compile(schema)
    expect(validate(manifest), ajv.errorsText(validate.errors)).toBe(true)

    const openWithMissingGate = structuredClone(manifest)
    openWithMissingGate.availabilityGates[0].status = 'missing'
    expect(validate(openWithMissingGate)).toBe(false)
    expect(ajv.errorsText(validate.errors)).toMatch(/availabilityGates.*status|ready/)
  })

  it('records the complete public default-branch intake', () => {
    const gate = manifest.availabilityGates.find(row => row.id === 'default-branch-intake')
    expect(gate).toMatchObject({ status: 'ready' })
    expect(gate.detail).toMatch(/bilingual AT and disabled-developer forms/)
    expect(gate.detail).toMatch(/automated browser report/)
  })

  it.each(['PRIMARY-AT-CAMPAIGN.md', 'PRIMARY-AT-CAMPAIGN.zh.md'])(
    '%s preserves exact setup, non-evidence boundaries, and the open intake state',
    (file) => {
      const guide = source(file)
      expect(guide).toContain(manifest.candidate.revision)
      expect(guide).toContain(manifest.lab.revision)
      expect(guide).toContain('`open`')
      expect(guide).toContain('dsh-core-at-lab/1.0.0-draft')
      expect(guide).toContain('lab:at:core ../deepseek-harness chrome')
      expect(guide).toMatch(/zero human records|零条真人记录/)
      expect(guide).toMatch(/not accessibility evidence|不是真人无障碍证据/)
      expect(guide).toContain('Discussion 16')
      expect(guide).toContain('Issue 1')
      expect(guide).toContain('Issue 2')
    },
  )

  it('ships and links the complete campaign handoff', () => {
    const packageManifest = JSON.parse(source('package.json'))
    for (const file of [
      'PRIMARY-AT-CAMPAIGN.md',
      'PRIMARY-AT-CAMPAIGN.zh.md',
      'PRIMARY-AT-CAMPAIGN.json',
      'PRIMARY-AT-CAMPAIGN.schema.json',
    ]) expect(packageManifest.files).toContain(file)
    expect(source('README.md')).toContain('[Primary AT campaign](PRIMARY-AT-CAMPAIGN.md)')
    expect(source('README.zh.md')).toContain('[首轮 AT 活动](PRIMARY-AT-CAMPAIGN.zh.md)')
  })
})
