import { readFile } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'
import { createHtmlValidateEngine, HTML_VALIDATE_CONFIG_VERSION, HTML_VALIDATE_RULES } from '../src/authoring/html-validate-engine.ts'

const example = (name: string) => fileURLToPath(new URL(`../examples/a11y-check/${name}`, import.meta.url))

describe('static HTML accessibility engine', () => {
  it('records an exact engine/config identity and finds the synthetic defects', async () => {
    const engine = createHtmlValidateEngine()
    const result = await engine.check({
      kind: 'web-static',
      path: 'before.html',
      content: await readFile(example('before.html'), 'utf8'),
    })

    expect(engine.version).toBe('11.4.0')
    expect(engine.configVersion).toBe(HTML_VALIDATE_CONFIG_VERSION)
    expect(Object.keys(HTML_VALIDATE_RULES).length).toBeGreaterThan(20)
    expect(result.findings.map(finding => finding.ruleId)).toEqual(expect.arrayContaining([
      'empty-title', 'empty-heading', 'input-missing-label', 'no-implicit-button-type', 'wcag/h37',
    ]))
    expect(result.findings.every(finding => finding.standards.length > 0)).toBe(true)
  })

  it('passes the repaired synthetic source without treating that as certification', async () => {
    const engine = createHtmlValidateEngine()
    const result = await engine.check({
      kind: 'web-static',
      path: 'after.html',
      content: await readFile(example('after.html'), 'utf8'),
    })
    expect(result.findings).toEqual([])
  })
})
