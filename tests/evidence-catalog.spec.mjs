import { describe, expect, it } from 'vitest'
import { readFileSync } from 'node:fs'
import Ajv2020 from 'ajv/dist/2020.js'
import addFormats from 'ajv-formats'
import {
  createEvidenceCatalogIndex,
  DEFAULT_EVIDENCE_CATALOG,
  EVIDENCE_CATALOG_PROTOCOL,
  validateEvidenceCatalog,
} from '../scripts/evidence-catalog-lib.mjs'

const protocolDocuments = new Map([
  ['dsh-core-at-lab/1.0.0-draft', ['AT-CORE-LAB.md', 'AT-CORE-LAB.zh.md']],
  ['dsh-live-at-lab/1.0.0-draft', ['AT-LIVE-LAB.md', 'AT-LIVE-LAB.zh.md']],
  ['dsh-at-lab/1.0.0-draft', ['AT-LAB.md', 'AT-LAB.zh.md']],
  ['dsh-cli-accessibility/1.0.0-draft', ['CLI-ACCESSIBILITY.md', 'CLI-ACCESSIBILITY.zh.md']],
  ['dsh-a11y-authoring-at-lab/0.1.0-draft', ['AUTHORING-AT-LAB.md', 'AUTHORING-AT-LAB.zh.md']],
])

describe('versioned accessibility evidence catalog', () => {
  it('defines five versioned protocols and thirty-three stable task ids', () => {
    const result = validateEvidenceCatalog(DEFAULT_EVIDENCE_CATALOG)
    expect(result).toEqual({ valid: true, issues: [] })
    expect(DEFAULT_EVIDENCE_CATALOG.protocol).toBe(EVIDENCE_CATALOG_PROTOCOL)
    expect(DEFAULT_EVIDENCE_CATALOG.scenarios).toHaveLength(5)
    expect(DEFAULT_EVIDENCE_CATALOG.scenarios.reduce((count, scenario) => count + scenario.tasks.length, 0)).toBe(33)

    const index = createEvidenceCatalogIndex()
    expect(index.get('dsh-a11y-authoring-at-lab/0.1.0-draft').tasksById.get('allow-once'))
      .toMatchObject({ representativeCoreTask: true, safetyCritical: true, claimEligible: true })
    expect(index.get('dsh-core-at-lab/1.0.0-draft').tasksById.get('nonvisual-repeat'))
      .toMatchObject({ representativeCoreTask: false, safetyCritical: false, claimEligible: false })
    expect(index.get('dsh-at-lab/1.0.0-draft').tasksById.get('copy-redacted-diagnostic'))
      .toMatchObject({ representativeCoreTask: true, safetyCritical: true, claimEligible: true })
  })

  it('contains product task definitions but no participant evidence fields', () => {
    const serialized = JSON.stringify(DEFAULT_EVIDENCE_CATALOG)
    expect(serialized).not.toMatch(/tester|participant|consent|diagnosis|disability|speech output/i)
  })

  it('keeps every stable task id in both language versions of its human protocol', () => {
    for (const scenario of DEFAULT_EVIDENCE_CATALOG.scenarios) {
      const documents = protocolDocuments.get(scenario.protocol)
      expect(documents, scenario.protocol).toHaveLength(2)
      for (const document of documents) {
        const source = readFileSync(new URL(`../${document}`, import.meta.url), 'utf8')
        for (const task of scenario.tasks) expect(source, `${document}: ${task.id}`).toContain(`\`${task.id}\``)
      }
    }
  })

  it.each([
    ['duplicate protocol', (catalog) => { catalog.scenarios.push(structuredClone(catalog.scenarios[0])) }, /duplicate protocols/],
    ['duplicate task id', (catalog) => { catalog.scenarios[0].tasks.push(structuredClone(catalog.scenarios[0].tasks[0])) }, /duplicate task ids/],
    ['no core task', (catalog) => { catalog.scenarios[0].tasks.forEach(task => { task.representativeCoreTask = false }) }, /at least one representative core task/],
    ['ineligible core task', (catalog) => { catalog.scenarios[0].tasks[1].claimEligible = false }, /must be claim eligible/],
    ['ineligible safety task', (catalog) => { catalog.scenarios[1].tasks[1].claimEligible = false }, /must be claim eligible/],
    ['invalid review date', (catalog) => { catalog.reviewedOn = '2026-02-30' }, /invalid calendar date/],
  ])('rejects %s', (_name, mutate, expected) => {
    const catalog = structuredClone(DEFAULT_EVIDENCE_CATALOG)
    mutate(catalog)
    const result = validateEvidenceCatalog(catalog)
    expect(result.valid).toBe(false)
    expect(result.issues.join('\n')).toMatch(expected)
  })

  it('compiles and validates with a strict draft-2020 schema engine', () => {
    const schema = JSON.parse(readFileSync(new URL('../EVIDENCE-CATALOG.schema.json', import.meta.url), 'utf8'))
    const ajv = new Ajv2020({ allErrors: true, strict: true })
    addFormats(ajv)
    const validate = ajv.compile(schema)
    expect(validate(DEFAULT_EVIDENCE_CATALOG), ajv.errorsText(validate.errors)).toBe(true)

    const invalid = structuredClone(DEFAULT_EVIDENCE_CATALOG)
    invalid.scenarios[0].tasks[1].representativeCoreTask = true
    invalid.scenarios[0].tasks[1].claimEligible = false
    expect(validate(invalid)).toBe(false)
  })
})
