import { describe, expect, it } from 'vitest'
import { readFileSync } from 'node:fs'
import { spawnSync } from 'node:child_process'
import Ajv2020 from 'ajv/dist/2020.js'
import addFormats from 'ajv-formats'
import {
  HUMAN_EVIDENCE_PROTOCOL,
  validateHumanEvidenceRecord,
} from '../scripts/human-evidence-lib.mjs'

const templatePath = new URL('../evidence/templates/authoring-at.allow-once.template.json', import.meta.url)
const template = JSON.parse(readFileSync(templatePath, 'utf8'))
const now = new Date('2026-09-02T00:00:00.000Z')

function atRecord() {
  const record = structuredClone(template)
  record.$schema = 'https://raw.githubusercontent.com/omdsh-dev/dsh-accessibility/main/HUMAN-EVIDENCE.schema.json'
  record.recordType = 'human-evidence'
  record.recordId = 'voiceover-safari-authoring-2026-09-01'
  record.recordedOn = '2026-09-01'
  record.claim = 'a11y-at-tested'
  record.scenario.description = 'One bounded allow-once authoring task in the disposable lab.'
  record.builds.dsh.revision = '0123456789abcdef0123456789abcdef01234567'
  record.builds.components[0].revision = '89abcdef0123456789abcdef0123456789abcdef'
  record.environment = {
    os: { name: 'macOS', version: '15.6.1 (24G90)' },
    browserOrTerminal: { kind: 'browser', name: 'Safari', version: '18.6' },
    accessTechnologies: [{ name: 'VoiceOver', version: '10', modalities: ['speech', 'keyboard'] }],
    inputMethods: ['VoiceOver keyboard commands'],
    settings: ['English speech; medium verbosity; punctuation some; Quick Nav off'],
  }
  record.tester = {
    category: 'at-specialist',
    screenVisuallyInspected: false,
    unrecordedAssistance: false,
    experience: 'Experienced with VoiceOver Web testing.',
  }
  record.consent = {
    authority: 'self',
    affirmative: true,
    publicDeidentifiedSummary: true,
    rawDataPublished: false,
    withdrawalRouteAvailable: true,
  }
  record.tasks[0] = {
    id: 'allow-once',
    representativeCoreTask: false,
    outcome: 'pass',
    independent: true,
    effective: true,
    safe: true,
    assistance: { level: 'none', notes: [] },
    observations: [{
      checkpoint: 'approval-request',
      modality: 'speech',
      outcome: 'pass',
      observed: 'Approval details and the one-time workspace write reason were announced before the action buttons.',
    }],
    focus: [{ transition: 'approval opens', destination: 'Approval details region', outcome: 'expected' }],
    barriers: [],
    limitations: ['Only the English allow-once authoring scenario was tested.'],
  }
  record.summary = {
    overall: 'pass',
    independentCoreTaskCompletion: false,
    blockers: [],
    limitations: ['This result does not cover other browsers, ATs, languages, or DSH tasks.'],
    claimScope: 'VoiceOver 10 with Safari 18.6 on macOS 15.6.1 for authoring allow-once only.',
  }
  record.review = { status: 'current', validUntil: '2026-11-30' }
  record.publication = {
    publicIssue: 'https://github.com/omdsh-dev/dsh-accessibility/issues/123',
    sanitizedArtifacts: [],
  }
  return record
}

function userValidatedRecord() {
  const record = atRecord()
  record.recordId = 'disabled-developer-authoring-2026-09-01'
  record.evidenceKind = 'disabled-user-task-run'
  record.claim = 'a11y-user-validated'
  record.tester.category = 'disabled-developer'
  record.tester.experience = 'Regular DSH-style agent workflow experience; no disability details collected.'
  record.tasks[0].representativeCoreTask = true
  record.summary.independentCoreTaskCompletion = true
  record.summary.claimScope = 'One disabled developer independently completed the exact authoring task in the recorded environment.'
  return record
}

describe('versioned human accessibility evidence', () => {
  it('accepts the checked-in template without treating it as evidence', () => {
    const result = validateHumanEvidenceRecord(template, { now })
    expect(result).toMatchObject({ valid: true, recordType: 'template', claim: 'none' })
    expect(HUMAN_EVIDENCE_PROTOCOL).toBe('dsh-a11y-human-evidence/0.1.0-draft')
  })

  it('accepts exact current AT and disabled-developer claims', () => {
    expect(validateHumanEvidenceRecord(atRecord(), { now })).toMatchObject({ valid: true, claim: 'a11y-at-tested' })
    expect(validateHumanEvidenceRecord(userValidatedRecord(), { now }))
      .toMatchObject({ valid: true, claim: 'a11y-user-validated' })
  })

  it.each([
    ['failed claimed task', (record) => { record.tasks[0].outcome = 'fail'; record.summary.overall = 'fail' }, /support claims require an overall pass|must pass effectively and safely/],
    ['unsafe claimed task', (record) => { record.tasks[0].safe = false }, /must pass effectively and safely/],
    ['ineffective claimed task', (record) => { record.tasks[0].effective = false }, /must pass effectively and safely/],
    ['operational assistance', (record) => { record.tasks[0].assistance.level = 'sighted-operation' }, /without operational assistance/],
    ['failed speech observation', (record) => { record.tasks[0].observations[0].outcome = 'fail' }, /human observation must pass/],
    ['lost focus', (record) => { record.tasks[0].focus[0].outcome = 'lost' }, /lost focus/],
    ['missing public review', (record) => { delete record.publication.publicIssue }, /public review issue or discussion/],
    ['unrecorded assistance', (record) => { record.tester.unrecordedAssistance = true }, /cannot hide assistance/],
    ['expired current record', (record) => { record.review.validUntil = '2026-09-01' }, /past validUntil/],
    ['overlong validity', (record) => { record.review.validUntil = '2027-09-01' }, /no more than 120 calendar days/],
    ['invalid calendar date', (record) => { record.review.validUntil = '2026-02-30' }, /invalid calendar date/],
    ['future record', (record) => { record.recordedOn = '2026-09-10' }, /cannot be more than one day in the future/],
    ['placeholder revision', (record) => { record.builds.dsh.revision = '0000000000000000000000000000000000000000' }, /placeholder revisions/],
    ['copied template marker', (record) => { record.environment.os.name = 'Synthetic operating system' }, /template placeholder/],
    ['task inventory drift', (record) => { record.scenario.taskIds = ['reject'] }, /must exactly match/],
    ['raw public data', (record) => { record.consent.rawDataPublished = true }, /raw participant data must not be public/],
    ['high barrier claim', (record) => { record.tasks[0].barriers = [{ severity: 'high', summary: 'Approval meaning was unclear.' }] }, /high-severity barriers/],
    ['branch name instead of package version', (record) => { record.builds.dsh.version = 'main' }, /invalid format/],
    ['unknown browser version', (record) => { record.environment.browserOrTerminal.version = 'unknown' }, /exact version required/],
    ['terminal surface for a Web task', (record) => {
      record.environment.browserOrTerminal = { kind: 'terminal', name: 'Terminal', version: '2.14', shell: 'zsh 5.9' }
    }, /web evidence requires a browser/],
    ['undocumented setup assistance', (record) => {
      record.tasks[0].assistance = { level: 'setup-only', notes: [] }
    }, /describe every non-none form of assistance/],
    ['duplicate access technology', (record) => {
      record.environment.accessTechnologies.push(structuredClone(record.environment.accessTechnologies[0]))
    }, /duplicate access-technology names/],
    ['AT claim without an AT run', (record) => {
      record.evidenceKind = 'disabled-user-task-run'
      record.tester.category = 'disabled-developer'
      record.environment.accessTechnologies = []
    }, /a11y-at-tested requires an assistive-technology-run/],
  ])('rejects %s', (_name, mutate, expected) => {
    const record = atRecord()
    mutate(record)
    const result = validateHumanEvidenceRecord(record, { now })
    expect(result.valid).toBe(false)
    expect(result.issues.join('\n')).toMatch(expected)
  })

  it.each([
    ['GitHub token', ['ghp', 'abcdefghijklmnopqrstuvwxyz123456'].join('_')],
    ['npm token', ['npm', 'abcdefghijklmnopqrstuvwxyz123456'].join('_')],
    ['API key', ['sk', 'abcdefghijklmnopqrstuvwx'].join('-')],
    ['URL token', 'https://local.invalid/?token=private-value'],
    ['URL fragment token', 'https://local.invalid/#access_token=private-value'],
    ['absolute path', '/Users/private/workspace/index.html'],
    ['assigned absolute path', 'workspace=/home/private/workspace/index.html'],
    ['file URL path', 'file:///Users/private/workspace/index.html'],
    ['email address', 'participant@example.org'],
    ['runtime session id', 'session-12345678-1234-1234-1234-123456789abc'],
    ['private UUID', '12345678-1234-4234-9234-123456789abc'],
    ['private key', '-----BEGIN OPENSSH PRIVATE KEY-----'],
  ])('rejects a possible %s anywhere in the public record', (_name, secret) => {
    const record = atRecord()
    record.summary.limitations = [secret]
    const result = validateHumanEvidenceRecord(record, { now })
    expect(result.valid).toBe(false)
    expect(result.issues.join('\n')).toMatch(/forbidden in public evidence/)
  })

  it('does not let generic or failed tester records claim disabled-user validation', () => {
    const record = userValidatedRecord()
    record.tester.category = 'community-tester'
    record.tasks[0].independent = false
    record.tasks[0].assistance.level = 'sighted-operation'
    record.summary.independentCoreTaskCompletion = false
    record.consent.withdrawalRouteAvailable = false
    const result = validateHumanEvidenceRecord(record, { now })
    expect(result.valid).toBe(false)
    expect(result.issues.join('\n')).toMatch(/disabled-developer/)
    expect(result.issues.join('\n')).toMatch(/private withdrawal route/)
    expect(result.issues.join('\n')).toMatch(/independent, effective, safe/)
  })

  it('requires at least one, rather than every, representative core task to be independently completed', () => {
    const record = userValidatedRecord()
    const secondTask = structuredClone(record.tasks[0])
    secondTask.id = 'reject'
    secondTask.independent = false
    secondTask.limitations = ['The rejection task was observed but was not the independently completed core task.']
    record.scenario.taskIds.push('reject')
    record.tasks.push(secondTask)
    expect(validateHumanEvidenceRecord(record, { now })).toMatchObject({ valid: true, claim: 'a11y-user-validated' })
  })

  it('supports core-only builds and disabled-developer evidence without requiring a dedicated AT', () => {
    const coreOnly = atRecord()
    coreOnly.scenario.protocol = 'dsh-core-at-lab/1.0.0-draft'
    coreOnly.builds.components = []
    expect(validateHumanEvidenceRecord(coreOnly, { now })).toMatchObject({ valid: true, claim: 'a11y-at-tested' })

    const disabledUser = userValidatedRecord()
    disabledUser.environment.accessTechnologies = []
    disabledUser.environment.inputMethods = ['keyboard and mouse']
    disabledUser.environment.settings = ['Default operating-system settings']
    expect(validateHumanEvidenceRecord(disabledUser, { now })).toMatchObject({ valid: true, claim: 'a11y-user-validated' })
  })

  it('ships a schema with the same protocol and fail-closed claim conditionals', () => {
    const schema = JSON.parse(readFileSync(new URL('../HUMAN-EVIDENCE.schema.json', import.meta.url), 'utf8'))
    expect(schema.properties.protocol.const).toBe(HUMAN_EVIDENCE_PROTOCOL)
    expect(schema.properties.claim.enum).toEqual(['none', 'a11y-at-tested', 'a11y-user-validated'])
    expect(JSON.stringify(schema.allOf)).toContain('a11y-user-validated')
    expect(JSON.stringify(schema.allOf)).toContain('disabled-developer')
  })

  it('compiles in a strict draft-2020 schema engine and validates the real contract shapes', () => {
    const schema = JSON.parse(readFileSync(new URL('../HUMAN-EVIDENCE.schema.json', import.meta.url), 'utf8'))
    const ajv = new Ajv2020({ allErrors: true, strict: true })
    addFormats(ajv)
    const validate = ajv.compile(schema)

    expect(validate(template), ajv.errorsText(validate.errors)).toBe(true)
    expect(validate(atRecord()), ajv.errorsText(validate.errors)).toBe(true)
    const disabledUser = userValidatedRecord()
    disabledUser.environment.accessTechnologies = []
    expect(validate(disabledUser), ajv.errorsText(validate.errors)).toBe(true)

    const invalid = atRecord()
    invalid.tasks[0].focus[0].outcome = 'lost'
    expect(validate(invalid)).toBe(false)
    expect(ajv.errorsText(validate.errors)).toMatch(/focus.*outcome|enum/)
  })

  it('validates the repository evidence directory through the public CLI', () => {
    const result = spawnSync(process.execPath, ['scripts/validate-human-evidence.mjs', 'evidence'], {
      cwd: new URL('..', import.meta.url),
      encoding: 'utf8',
    })
    expect(result.status).toBe(0)
    expect(result.stdout).toContain('valid non-evidence template')
  })
})
