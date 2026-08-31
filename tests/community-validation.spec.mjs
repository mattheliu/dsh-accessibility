import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'

const formFiles = [
  'disabled-developer-task-result.yml',
  'disabled-developer-task-result-zh.yml',
]
const expectedBodyIds = [
  'authority',
  'protocol',
  'matrix',
  'assistance',
  'tasks',
  'safety',
  'limitations',
  'claim_boundary',
]

function source(relativePath) {
  return readFileSync(new URL(`../${relativePath}`, import.meta.url), 'utf8')
}

describe('community validation intake', () => {
  it.each(formFiles)('%s collects task evidence without identity fields or premature labels', (file) => {
    const form = source(`.github/ISSUE_TEMPLATE/${file}`)
    const bodyIds = [...form.matchAll(/^    id: ([a-z_]+)$/gm)].map(match => match[1])

    expect(bodyIds).toEqual(expectedBodyIds)
    expect(form).not.toContain('  - evidence:user-validated')
    expect(form).not.toMatch(/^  - type: input$/m)
    expect(form).toContain('  - accessibility')
    expect(form).toMatch(/private withdrawal route|私密撤回渠道/)
    expect(form).toMatch(/independently, effectively, and safely|独立、有效、安全/)
    expect(form).toMatch(/never creates an `a11y-user-validated` claim|绝不会自行形成 `a11y-user-validated` 声明/)
    for (const level of ['none', 'setup-only', 'verbal', 'sighted-operation', 'other']) {
      expect(form).toContain(`\`${level}\``)
    }
  })

  it.each(['COMMUNITY-VALIDATION.md', 'COMMUNITY-VALIDATION.zh.md'])('%s preserves the evidence boundary', (file) => {
    const guide = source(file)

    for (const protocol of [
      'AT-CORE-LAB',
      'AT-LIVE-LAB',
      'AT-LAB',
      'CLI-ACCESSIBILITY',
      'AUTHORING-AT-LAB',
    ]) expect(guide).toContain(protocol)
    expect(guide).toContain('disabled-developer-task-result')
    expect(guide).toContain('assistive-technology-test')
    expect(guide).toContain('security/advisories/new')
    expect(guide).toMatch(/zero human records|零条真人记录/)
    expect(guide).toMatch(/26 draft aggregate requirements|26 项草案聚合要求/)
    expect(guide).toMatch(/AI-operated VoiceOver session is not|AI 操作的 VoiceOver 会话都不是/)
  })

  it('keeps a private withdrawal contact in the issue chooser', () => {
    const config = source('.github/ISSUE_TEMPLATE/config.yml')
    expect(config).toContain('Evidence withdrawal or participant-data request')
    expect(config).toContain('security/advisories/new')
    expect(config).toContain('never post participant contact details publicly')
  })
})
