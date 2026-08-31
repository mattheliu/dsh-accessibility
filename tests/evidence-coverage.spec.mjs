import { readFileSync } from 'node:fs'
import { spawnSync } from 'node:child_process'
import Ajv2020 from 'ajv/dist/2020.js'
import addFormats from 'ajv-formats'
import { describe, expect, it } from 'vitest'
import {
  DEFAULT_EVIDENCE_CATALOG,
  createEvidenceCatalogIndex,
} from '../scripts/evidence-catalog-lib.mjs'
import {
  DEFAULT_EVIDENCE_COVERAGE_POLICY,
  EVIDENCE_COVERAGE_POLICY_PROTOCOL,
  EVIDENCE_COVERAGE_REPORT_PROTOCOL,
  evaluateEvidenceCoverage,
  validateEvidenceCoveragePolicy,
} from '../scripts/evidence-coverage-lib.mjs'

const now = new Date('2026-09-02T00:00:00.000Z')
const template = JSON.parse(readFileSync(
  new URL('../evidence/templates/authoring-at.allow-once.template.json', import.meta.url),
  'utf8',
))
const catalogIndex = createEvidenceCatalogIndex()

function tasksFor(protocol, selector) {
  const scenario = catalogIndex.get(protocol)
  if (selector === 'claim-eligible') return scenario.tasks.filter(task => task.claimEligible).map(task => task.id)
  if (selector === 'representative-core') return scenario.tasks.filter(task => task.representativeCoreTask).map(task => task.id)
  if (selector === 'safety-critical') return scenario.tasks.filter(task => task.safetyCritical).map(task => task.id)
  throw new Error(`unknown selector ${selector}`)
}

function evidenceRecord({
  id,
  claim,
  protocol,
  taskIds,
  selector,
  environmentSelector = { surfaceKind: catalogIndex.get(protocol).interface === 'cli' ? 'terminal' : 'browser' },
  accessTechnologyVersion,
}) {
  const record = structuredClone(template)
  const scenario = catalogIndex.get(protocol)
  const isUserValidation = claim === 'a11y-user-validated'
  const isCli = scenario.interface === 'cli'
  const selectedTaskIds = taskIds ?? tasksFor(protocol, selector)
  const atName = environmentSelector.accessTechnologyNames?.[0]
    ?? (environmentSelector.requiredModalities === undefined ? undefined : 'Modality test assistive technology')
  const observedModalities = atName === undefined
    ? ['keyboard']
    : (environmentSelector.requiredModalities ?? ['speech', 'keyboard'])
  const osName = environmentSelector.osNames?.[0] ?? (isCli ? 'Linux' : 'Linux')
  const surfaceName = environmentSelector.surfaceNames?.[0] ?? (isCli ? 'GNOME Terminal' : 'Firefox')
  const atVersion = accessTechnologyVersion ?? (atName === 'NVDA' ? '2025.3.1' : '10')
  const osVersion = osName.toLocaleLowerCase('en-US').startsWith('windows')
    ? '11 24H2 (26100.4946)'
    : osName === 'macOS' ? '15.6.1 (24G90)' : '6.11.0'
  const surfaceVersion = surfaceName.includes('Safari')
    ? '18.6'
    : surfaceName.includes('Chrome') ? '151.0.7922.170' : isCli ? '3.54.2' : '142.0'

  record.recordType = 'human-evidence'
  record.recordId = id
  record.recordedOn = '2026-09-01'
  record.evidenceKind = isUserValidation ? 'disabled-user-task-run' : 'assistive-technology-run'
  record.claim = claim
  record.scenario = {
    protocol,
    interface: scenario.interface,
    locale: 'en-US',
    taskIds: selectedTaskIds,
    description: `Exact ${protocol} tasks covered by this de-identified evidence record.`,
  }
  record.builds = {
    dsh: {
      name: '@deepseek-ai/dsh',
      version: '0.1.2-alpha.2',
      revision: '0123456789abcdef0123456789abcdef01234567',
    },
    components: [],
  }
  record.environment = {
    os: { name: osName, version: osVersion },
    browserOrTerminal: {
      kind: environmentSelector.surfaceKind,
      name: surfaceName,
      version: surfaceVersion,
      ...(isCli ? { shell: 'zsh 5.9' } : {}),
    },
    accessTechnologies: atName === undefined ? [] : [{
      name: atName,
      version: atVersion,
      modalities: environmentSelector.requiredModalities ?? ['speech', 'keyboard'],
    }],
    inputMethods: ['keyboard'],
    settings: ['English interface; ordinary test verbosity and punctuation'],
  }
  record.tester = {
    category: isUserValidation ? 'disabled-developer' : 'at-specialist',
    screenVisuallyInspected: false,
    unrecordedAssistance: false,
    experience: isUserValidation
      ? 'Regular agent workflow experience; no disability details collected.'
      : 'Experienced with assistive-technology interoperability testing.',
  }
  record.consent = {
    authority: 'self',
    affirmative: true,
    publicDeidentifiedSummary: true,
    rawDataPublished: false,
    withdrawalRouteAvailable: isUserValidation,
  }
  record.tasks = selectedTaskIds.map(taskId => ({
    id: taskId,
    outcome: 'pass',
    independent: true,
    effective: true,
    safe: true,
    assistance: { level: 'none', notes: [] },
    observations: observedModalities.map(modality => ({
      checkpoint: `${taskId}-${modality}-result`,
      modality,
      outcome: 'pass',
      observed: `The ${taskId} task result and next action were perceivable through ${modality}.`,
    })),
    focus: [{ transition: `${taskId} completes`, destination: 'Next usable task control', outcome: 'expected' }],
    barriers: [],
    limitations: ['Only the exact recorded task, build, environment, and settings are covered.'],
  }))
  record.summary = {
    overall: 'pass',
    independentCoreTaskCompletion: isUserValidation,
    blockers: [],
    limitations: ['No other product build, environment, locale, or task is covered.'],
    claimScope: `${protocol}: ${selectedTaskIds.join(', ')} only.`,
  }
  record.review = { status: 'current', validUntil: '2026-11-30' }
  record.publication = {
    publicIssue: 'https://github.com/omdsh-dev/dsh-accessibility/issues/123',
    sanitizedArtifacts: [],
  }
  return record
}

function findRequirement(report, requirementId) {
  return report.profiles.flatMap(profile => profile.requirements).find(requirement => requirement.id === requirementId)
}

function allBaselineRecords() {
  return DEFAULT_EVIDENCE_COVERAGE_POLICY.profiles.flatMap(profile => profile.requirements.map(requirement => evidenceRecord({
    id: `record-${requirement.id}`,
    claim: requirement.claim,
    protocol: requirement.scenarioProtocol,
    selector: requirement.taskSelector,
    environmentSelector: requirement.environment,
  })))
}

describe('aggregate human evidence coverage', () => {
  it('defines six profiles and twenty-six uniquely named requirements', () => {
    const result = validateEvidenceCoveragePolicy(DEFAULT_EVIDENCE_COVERAGE_POLICY)
    expect(result).toEqual({ valid: true, issues: [] })
    expect(DEFAULT_EVIDENCE_COVERAGE_POLICY.protocol).toBe(EVIDENCE_COVERAGE_POLICY_PROTOCOL)
    expect(DEFAULT_EVIDENCE_COVERAGE_POLICY.profiles).toHaveLength(6)
    expect(DEFAULT_EVIDENCE_COVERAGE_POLICY.profiles.flatMap(profile => profile.requirements)).toHaveLength(26)
  })

  it('reports the checked-in template honestly as zero human coverage', () => {
    const result = evaluateEvidenceCoverage([template], { now })
    expect(result.valid).toBe(true)
    expect(result.report).toMatchObject({
      protocol: EVIDENCE_COVERAGE_REPORT_PROTOCOL,
      verdictScope: 'coverage-policy-only-not-release-readiness',
      inventory: { templates: 1, humanEvidence: 0, claimNone: 0, atTested: 0, userValidated: 0 },
      baselineSatisfied: false,
    })
    expect(result.report.profiles.every(profile => profile.status === 'missing')).toBe(true)
    expect(result.report.profiles.flatMap(profile => profile.requirements).every(requirement => (
      requirement.status === 'missing'
      && requirement.coveredTaskIds.length === 0
      && requirement.matchedRecordIds.length === 0
      && requirement.cohort === null
    ))).toBe(true)
  })

  it('combines AT task records only inside one exact environment cohort', () => {
    const requirement = DEFAULT_EVIDENCE_COVERAGE_POLICY.profiles[0].requirements[0]
    const requiredTasks = tasksFor(requirement.scenarioProtocol, requirement.taskSelector)
    const midpoint = Math.ceil(requiredTasks.length / 2)
    const first = evidenceRecord({
      id: 'voiceover-core-first-half',
      claim: requirement.claim,
      protocol: requirement.scenarioProtocol,
      taskIds: requiredTasks.slice(0, midpoint),
      environmentSelector: requirement.environment,
    })
    const second = evidenceRecord({
      id: 'voiceover-core-second-half',
      claim: requirement.claim,
      protocol: requirement.scenarioProtocol,
      taskIds: requiredTasks.slice(midpoint),
      environmentSelector: requirement.environment,
    })
    const combined = evaluateEvidenceCoverage([first, second], { now })
    expect(findRequirement(combined.report, requirement.id)).toMatchObject({
      status: 'satisfied',
      missingTaskIds: [],
      matchedRecordIds: ['voiceover-core-first-half', 'voiceover-core-second-half'],
    })

    second.environment.accessTechnologies[0].version = '11'
    const incompatible = evaluateEvidenceCoverage([first, second], { now })
    const row = findRequirement(incompatible.report, requirement.id)
    expect(row.status).toBe('missing')
    expect(row.coveredTaskIds.length).toBeLessThan(row.requiredTaskIds.length)
    expect(row.matchedRecordIds).toHaveLength(1)
  })

  it('allows a modality-only row to be provided by one exact multi-technology stack', () => {
    const requirement = DEFAULT_EVIDENCE_COVERAGE_POLICY.profiles[4].requirements.find(row => row.id === 'braille-core-web')
    const record = evidenceRecord({
      id: 'braille-with-screen-reader-stack',
      claim: requirement.claim,
      protocol: requirement.scenarioProtocol,
      selector: requirement.taskSelector,
      environmentSelector: requirement.environment,
    })
    record.environment.accessTechnologies = [
      { name: 'Screen reader under test', version: '10', modalities: ['keyboard'] },
      { name: 'Refreshable braille display under test', version: '4.2', modalities: ['braille'] },
    ]
    record.tasks.forEach((task) => {
      task.observations.push({
        checkpoint: `${task.id}-keyboard-result`,
        modality: 'keyboard',
        outcome: 'pass',
        observed: `The ${task.id} task was operated through the declared keyboard modality.`,
      })
    })
    const covered = evaluateEvidenceCoverage([record], { now })
    expect(covered.valid, covered.issues.join('\n')).toBe(true)
    expect(findRequirement(covered.report, requirement.id).status).toBe('satisfied')

    record.environment.accessTechnologies[1].modalities = ['keyboard']
    const missing = evaluateEvidenceCoverage([record], { now })
    expect(missing.valid, missing.issues.join('\n')).toBe(true)
    expect(findRequirement(missing.report, requirement.id).status).toBe('missing')
  })

  it('does not combine disabled-developer tasks across public records as if one person completed them', () => {
    const requirement = DEFAULT_EVIDENCE_COVERAGE_POLICY.profiles[5].requirements[0]
    const requiredTasks = tasksFor(requirement.scenarioProtocol, requirement.taskSelector)
    const midpoint = Math.ceil(requiredTasks.length / 2)
    const first = evidenceRecord({
      id: 'disabled-core-first-half',
      claim: requirement.claim,
      protocol: requirement.scenarioProtocol,
      taskIds: requiredTasks.slice(0, midpoint),
      environmentSelector: requirement.environment,
    })
    const second = evidenceRecord({
      id: 'disabled-core-second-half',
      claim: requirement.claim,
      protocol: requirement.scenarioProtocol,
      taskIds: requiredTasks.slice(midpoint),
      environmentSelector: requirement.environment,
    })
    const split = evaluateEvidenceCoverage([first, second], { now })
    expect(findRequirement(split.report, requirement.id).status).toBe('missing')

    const complete = evidenceRecord({
      id: 'disabled-core-complete-record',
      claim: requirement.claim,
      protocol: requirement.scenarioProtocol,
      taskIds: requiredTasks,
      environmentSelector: requirement.environment,
    })
    const result = evaluateEvidenceCoverage([first, second, complete], { now })
    expect(findRequirement(result.report, requirement.id)).toMatchObject({
      status: 'satisfied',
      matchedRecordIds: ['disabled-core-complete-record'],
      missingTaskIds: [],
    })
  })

  it('can satisfy the complete draft baseline without turning it into a release verdict', () => {
    const result = evaluateEvidenceCoverage(allBaselineRecords(), { now })
    expect(result.valid, result.issues.join('\n')).toBe(true)
    expect(result.report.baselineSatisfied).toBe(true)
    expect(result.report.verdictScope).toBe('coverage-policy-only-not-release-readiness')
    expect(result.report.profiles.every(profile => profile.status === 'satisfied')).toBe(true)
    expect(result.report.inventory).toEqual({
      templates: 0,
      humanEvidence: 26,
      claimNone: 0,
      atTested: 21,
      userValidated: 5,
    })
  })

  it('fails closed on invalid records, duplicate ids, and invalid policy aggregation', () => {
    const invalidRecord = evidenceRecord({
      id: 'invalid-unknown-task',
      claim: 'a11y-at-tested',
      protocol: 'dsh-core-at-lab/1.0.0-draft',
      taskIds: ['invented-task'],
      environmentSelector: DEFAULT_EVIDENCE_COVERAGE_POLICY.profiles[0].requirements[0].environment,
    })
    expect(evaluateEvidenceCoverage([invalidRecord], { now }).issues.join('\n')).toMatch(/not registered/)

    const valid = allBaselineRecords()[0]
    expect(evaluateEvidenceCoverage([valid, structuredClone(valid)], { now }).issues.join('\n')).toMatch(/duplicate human-evidence record ids/)

    const policy = structuredClone(DEFAULT_EVIDENCE_COVERAGE_POLICY)
    policy.profiles[5].requirements[0].aggregation = 'same-environment-cohort'
    const policyResult = validateEvidenceCoveragePolicy(policy)
    expect(policyResult.valid).toBe(false)
    expect(policyResult.issues.join('\n')).toMatch(/disabled-user validation must remain within one record/)
  })

  it('compiles both contracts in a strict draft-2020 schema engine', () => {
    const policySchema = JSON.parse(readFileSync(new URL('../EVIDENCE-COVERAGE-POLICY.schema.json', import.meta.url), 'utf8'))
    const reportSchema = JSON.parse(readFileSync(new URL('../EVIDENCE-COVERAGE-REPORT.schema.json', import.meta.url), 'utf8'))
    const ajv = new Ajv2020({ allErrors: true, strict: true })
    addFormats(ajv)
    const validatePolicy = ajv.compile(policySchema)
    const validateReport = ajv.compile(reportSchema)
    expect(validatePolicy(DEFAULT_EVIDENCE_COVERAGE_POLICY), ajv.errorsText(validatePolicy.errors)).toBe(true)
    const report = evaluateEvidenceCoverage(allBaselineRecords(), { now }).report
    expect(validateReport(report), ajv.errorsText(validateReport.errors)).toBe(true)
  })

  it('prints a non-claim report and optionally fails when the baseline is required', () => {
    const ordinary = spawnSync(process.execPath, ['scripts/report-human-evidence-coverage.mjs', 'evidence'], {
      cwd: new URL('..', import.meta.url),
      encoding: 'utf8',
    })
    expect(ordinary.status).toBe(0)
    expect(JSON.parse(ordinary.stdout)).toMatchObject({ baselineSatisfied: false, verdictScope: 'coverage-policy-only-not-release-readiness' })

    const required = spawnSync(process.execPath, ['scripts/report-human-evidence-coverage.mjs', '--require-baseline', 'evidence'], {
      cwd: new URL('..', import.meta.url),
      encoding: 'utf8',
    })
    expect(required.status).toBe(1)
    expect(JSON.parse(required.stdout).baselineSatisfied).toBe(false)
  })
})
