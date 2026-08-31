/** Aggregate valid human evidence without mixing incompatible environments. */
import { readFileSync } from 'node:fs'
import {
  createEvidenceCatalogIndex,
  DEFAULT_EVIDENCE_CATALOG,
  EVIDENCE_CATALOG_PROTOCOL,
  validateEvidenceCatalog,
} from './evidence-catalog-lib.mjs'
import { validateHumanEvidenceRecord } from './human-evidence-lib.mjs'

export const EVIDENCE_COVERAGE_POLICY_PROTOCOL = 'dsh-a11y-evidence-coverage-policy/0.1.0-draft'
export const EVIDENCE_COVERAGE_REPORT_PROTOCOL = 'dsh-a11y-evidence-coverage-report/0.1.0-draft'

export const DEFAULT_EVIDENCE_COVERAGE_POLICY = JSON.parse(readFileSync(
  new URL('../EVIDENCE-COVERAGE-POLICY.json', import.meta.url),
  'utf8',
))

const CLAIMS = new Set(['a11y-at-tested', 'a11y-user-validated'])
const TASK_SELECTORS = new Set(['claim-eligible', 'representative-core', 'safety-critical'])
const AGGREGATIONS = new Set(['single-record', 'same-environment-cohort'])
const SURFACE_KINDS = new Set(['browser', 'terminal'])
const MODALITIES = new Set(['speech', 'braille', 'keyboard', 'switch', 'voice', 'magnification', 'other'])

function isObject(value) {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function exactKeys(value, path, required, allowed, issues) {
  if (!isObject(value)) {
    issues.push(`${path}: expected an object`)
    return undefined
  }
  for (const key of required) {
    if (!Object.hasOwn(value, key)) issues.push(`${path}: missing required field ${key}`)
  }
  for (const key of Object.keys(value)) {
    if (!allowed.includes(key)) issues.push(`${path}.${key}: unknown field`)
  }
  return value
}

function string(value, path, issues, { min = 1, max = 500, pattern } = {}) {
  if (typeof value !== 'string') {
    issues.push(`${path}: expected a string`)
    return undefined
  }
  if (value.length < min || value.length > max) issues.push(`${path}: expected ${String(min)}-${String(max)} characters`)
  if (pattern !== undefined && !pattern.test(value)) issues.push(`${path}: invalid format`)
  return value
}

function enumeration(value, path, allowed, issues) {
  if (typeof value !== 'string' || !allowed.has(value)) {
    issues.push(`${path}: expected one of ${[...allowed].join(', ')}`)
    return undefined
  }
  return value
}

function stringList(value, path, issues, { max = 10, allowed } = {}) {
  if (!Array.isArray(value) || value.length < 1 || value.length > max) {
    issues.push(`${path}: expected 1-${String(max)} strings`)
    return []
  }
  value.forEach((item, index) => {
    string(item, `${path}[${String(index)}]`, issues, { max: 80 })
    if (allowed !== undefined) enumeration(item, `${path}[${String(index)}]`, allowed, issues)
  })
  if (new Set(value).size !== value.length) issues.push(`${path}: duplicate values are not allowed`)
  return value
}

function selectedTasks(scenario, selector) {
  if (selector === 'claim-eligible') return scenario.tasks.filter(task => task.claimEligible)
  if (selector === 'representative-core') return scenario.tasks.filter(task => task.representativeCoreTask)
  if (selector === 'safety-critical') return scenario.tasks.filter(task => task.safetyCritical)
  return []
}

export function validateEvidenceCoveragePolicy(policy, catalog = DEFAULT_EVIDENCE_CATALOG) {
  const issues = []
  const catalogValidation = validateEvidenceCatalog(catalog)
  if (!catalogValidation.valid) issues.push(...catalogValidation.issues.map(issue => `catalog${issue.slice(1)}`))
  const catalogIndex = catalogValidation.valid ? createEvidenceCatalogIndex(catalog) : new Map()
  const row = exactKeys(
    policy,
    '$',
    ['$schema', 'protocol', 'policyId', 'catalog', 'description', 'profiles'],
    ['$schema', 'protocol', 'policyId', 'catalog', 'description', 'profiles'],
    issues,
  )
  if (row === undefined) return { valid: false, issues }
  string(row.$schema, '$.$schema', issues, { max: 200 })
  if (row.protocol !== EVIDENCE_COVERAGE_POLICY_PROTOCOL) issues.push(`$.protocol: expected ${EVIDENCE_COVERAGE_POLICY_PROTOCOL}`)
  string(row.policyId, '$.policyId', issues, { pattern: /^[a-z0-9][a-z0-9._-]{7,99}$/u, max: 100 })
  string(row.description, '$.description', issues, { max: 500 })
  const catalogReference = exactKeys(row.catalog, '$.catalog', ['protocol', 'catalogId'], ['protocol', 'catalogId'], issues)
  if (catalogReference !== undefined) {
    if (catalogReference.protocol !== EVIDENCE_CATALOG_PROTOCOL) issues.push(`$.catalog.protocol: expected ${EVIDENCE_CATALOG_PROTOCOL}`)
    if (catalogReference.catalogId !== catalog.catalogId) issues.push(`$.catalog.catalogId: expected ${catalog.catalogId}`)
  }
  if (!Array.isArray(row.profiles) || row.profiles.length < 1 || row.profiles.length > 20) {
    issues.push('$.profiles: expected 1-20 profiles')
    return { valid: false, issues }
  }
  const profileIds = []
  const requirementIds = []
  row.profiles.forEach((profileValue, profileIndex) => {
    const profilePath = `$.profiles[${String(profileIndex)}]`
    const profile = exactKeys(profileValue, profilePath, ['id', 'title', 'requirements'], ['id', 'title', 'requirements'], issues)
    if (profile === undefined) return
    const profileId = string(profile.id, `${profilePath}.id`, issues, { pattern: /^[a-z0-9][a-z0-9._-]{1,79}$/u, max: 80 })
    if (profileId !== undefined) profileIds.push(profileId)
    string(profile.title, `${profilePath}.title`, issues, { max: 160 })
    if (!Array.isArray(profile.requirements) || profile.requirements.length < 1 || profile.requirements.length > 30) {
      issues.push(`${profilePath}.requirements: expected 1-30 requirements`)
      return
    }
    profile.requirements.forEach((requirementValue, requirementIndex) => {
      const requirementPath = `${profilePath}.requirements[${String(requirementIndex)}]`
      const requirement = exactKeys(
        requirementValue,
        requirementPath,
        ['id', 'claim', 'scenarioProtocol', 'taskSelector', 'aggregation', 'environment'],
        ['id', 'claim', 'scenarioProtocol', 'taskSelector', 'aggregation', 'environment'],
        issues,
      )
      if (requirement === undefined) return
      const requirementId = string(requirement.id, `${requirementPath}.id`, issues, { pattern: /^[a-z0-9][a-z0-9._-]{1,79}$/u, max: 80 })
      if (requirementId !== undefined) requirementIds.push(requirementId)
      const claim = enumeration(requirement.claim, `${requirementPath}.claim`, CLAIMS, issues)
      string(requirement.scenarioProtocol, `${requirementPath}.scenarioProtocol`, issues, {
        pattern: /^[a-z0-9][a-z0-9.-]*\/\d+\.\d+\.\d+(?:-[a-z0-9.-]+)?$/u,
        max: 120,
      })
      const selector = enumeration(requirement.taskSelector, `${requirementPath}.taskSelector`, TASK_SELECTORS, issues)
      const aggregation = enumeration(requirement.aggregation, `${requirementPath}.aggregation`, AGGREGATIONS, issues)
      const scenario = catalogIndex.get(requirement.scenarioProtocol)
      if (scenario === undefined) issues.push(`${requirementPath}.scenarioProtocol: protocol is not registered in the evidence catalog`)
      else if (selector !== undefined && selectedTasks(scenario, selector).length === 0) {
        issues.push(`${requirementPath}.taskSelector: selector resolves to no catalog tasks`)
      }
      if (claim === 'a11y-user-validated' && aggregation !== 'single-record') {
        issues.push(`${requirementPath}.aggregation: disabled-user validation must remain within one record`)
      }
      const environment = exactKeys(
        requirement.environment,
        `${requirementPath}.environment`,
        ['surfaceKind'],
        ['osNames', 'surfaceKind', 'surfaceNames', 'accessTechnologyNames', 'requiredModalities', 'locales'],
        issues,
      )
      if (environment === undefined) return
      enumeration(environment.surfaceKind, `${requirementPath}.environment.surfaceKind`, SURFACE_KINDS, issues)
      for (const key of ['osNames', 'surfaceNames', 'accessTechnologyNames', 'locales']) {
        if (environment[key] !== undefined) stringList(environment[key], `${requirementPath}.environment.${key}`, issues)
      }
      if (environment.requiredModalities !== undefined) {
        stringList(environment.requiredModalities, `${requirementPath}.environment.requiredModalities`, issues, { max: 7, allowed: MODALITIES })
      }
      if (claim === 'a11y-at-tested'
        && environment.accessTechnologyNames === undefined
        && environment.requiredModalities === undefined) {
        issues.push(`${requirementPath}.environment: AT coverage requires a named access technology or modality`)
      }
      if (scenario !== undefined && environment.surfaceKind !== (scenario.interface === 'cli' ? 'terminal' : 'browser')) {
        issues.push(`${requirementPath}.environment.surfaceKind: does not match the catalog interface`)
      }
    })
  })
  if (new Set(profileIds).size !== profileIds.length) issues.push('$.profiles: duplicate profile ids are not allowed')
  if (new Set(requirementIds).size !== requirementIds.length) issues.push('$.profiles: duplicate requirement ids are not allowed')
  return { valid: issues.length === 0, issues }
}

function folded(value) {
  return value.toLocaleLowerCase('en-US')
}

function includesFolded(values, value) {
  return values === undefined || values.some(candidate => folded(candidate) === folded(value))
}

function matchesEnvironment(record, selector) {
  const environment = record.environment
  const surface = environment.browserOrTerminal
  if (surface.kind !== selector.surfaceKind) return false
  if (!includesFolded(selector.osNames, environment.os.name)) return false
  if (!includesFolded(selector.surfaceNames, surface.name)) return false
  if (!includesFolded(selector.locales, record.scenario.locale)) return false
  if (selector.accessTechnologyNames === undefined && selector.requiredModalities === undefined) return true
  const matchingTechnologies = selector.accessTechnologyNames === undefined
    ? environment.accessTechnologies
    : environment.accessTechnologies.filter(technology => includesFolded(selector.accessTechnologyNames, technology.name))
  if (matchingTechnologies.length === 0) return false
  return selector.requiredModalities === undefined
    || selector.requiredModalities.every(modality => matchingTechnologies.some(technology => technology.modalities.includes(modality)))
}

function stableSortByName(values) {
  return [...values].sort((left, right) => folded(left.name).localeCompare(folded(right.name), 'en-US'))
}

function cohortFor(record) {
  const surface = { ...record.environment.browserOrTerminal }
  const accessTechnologies = stableSortByName(record.environment.accessTechnologies).map(technology => ({
    ...technology,
    modalities: [...technology.modalities].sort(),
  }))
  const cohort = {
    dsh: { ...record.builds.dsh },
    components: stableSortByName(record.builds.components).map(component => ({ ...component })),
    os: { ...record.environment.os },
    surface,
    accessTechnologies,
    locale: record.scenario.locale,
  }
  const fingerprint = JSON.stringify({
    ...cohort,
    inputMethods: [...record.environment.inputMethods].sort(),
    settings: [...record.environment.settings].sort(),
  })
  return { cohort, fingerprint }
}

function evaluateRequirement(requirement, records, catalogIndex) {
  const catalogScenario = catalogIndex.get(requirement.scenarioProtocol)
  const requiredTaskIds = selectedTasks(catalogScenario, requirement.taskSelector).map(task => task.id)
  const eligibleRecords = records.filter(record => record.claim === requirement.claim
    && record.scenario.protocol === requirement.scenarioProtocol
    && matchesEnvironment(record, requirement.environment))
  const groups = new Map()
  for (const record of eligibleRecords) {
    const { cohort, fingerprint } = cohortFor(record)
    const key = requirement.aggregation === 'single-record' ? `record:${record.recordId}` : fingerprint
    const group = groups.get(key) ?? { cohort, recordIds: [], taskIds: new Set() }
    group.recordIds.push(record.recordId)
    record.tasks.forEach(task => group.taskIds.add(task.id))
    groups.set(key, group)
  }
  const candidates = [...groups.values()].map(group => {
    const coveredTaskIds = requiredTaskIds.filter(taskId => group.taskIds.has(taskId))
    return {
      ...group,
      recordIds: [...new Set(group.recordIds)].sort(),
      coveredTaskIds,
      missingTaskIds: requiredTaskIds.filter(taskId => !group.taskIds.has(taskId)),
    }
  }).sort((left, right) => right.coveredTaskIds.length - left.coveredTaskIds.length
    || left.missingTaskIds.length - right.missingTaskIds.length
    || left.recordIds.join(',').localeCompare(right.recordIds.join(','), 'en-US'))
  const best = candidates[0]
  return {
    id: requirement.id,
    status: best !== undefined && best.missingTaskIds.length === 0 ? 'satisfied' : 'missing',
    claim: requirement.claim,
    scenarioProtocol: requirement.scenarioProtocol,
    taskSelector: requirement.taskSelector,
    aggregation: requirement.aggregation,
    requiredTaskIds,
    coveredTaskIds: best?.coveredTaskIds ?? [],
    missingTaskIds: best?.missingTaskIds ?? requiredTaskIds,
    matchedRecordIds: best?.recordIds ?? [],
    cohort: best?.cohort ?? null,
  }
}

/**
 * Validate and aggregate public human evidence against the draft coverage baseline.
 * The result is intentionally not a release-readiness or conformance verdict.
 * @param {unknown[]} inputs parsed evidence records and templates.
 * @param {{ now?: Date, policy?: unknown, catalog?: unknown }} options evaluation inputs.
 */
export function evaluateEvidenceCoverage(inputs, options = {}) {
  const issues = []
  const now = options.now ?? new Date()
  const policy = options.policy ?? DEFAULT_EVIDENCE_COVERAGE_POLICY
  const catalog = options.catalog ?? DEFAULT_EVIDENCE_CATALOG
  const policyValidation = validateEvidenceCoveragePolicy(policy, catalog)
  if (!policyValidation.valid) issues.push(...policyValidation.issues.map(issue => `policy${issue.slice(1)}`))
  if (!Array.isArray(inputs)) return { valid: false, issues: [...issues, '$.records: expected an array'] }
  const records = []
  const templates = []
  inputs.forEach((input, index) => {
    const result = validateHumanEvidenceRecord(input, { now })
    if (!result.valid) {
      issues.push(...result.issues.map(issue => `$.records[${String(index)}]${issue.slice(1)}`))
      return
    }
    if (result.recordType === 'template') templates.push(input)
    else records.push(input)
  })
  const recordIds = records.map(record => record.recordId)
  if (new Set(recordIds).size !== recordIds.length) issues.push('$.records: duplicate human-evidence record ids are not allowed')
  if (issues.length > 0) return { valid: false, issues }

  const catalogIndex = createEvidenceCatalogIndex(catalog)
  const profiles = policy.profiles.map(profile => {
    const requirements = profile.requirements.map(requirement => evaluateRequirement(requirement, records, catalogIndex))
    return {
      id: profile.id,
      title: profile.title,
      status: requirements.every(requirement => requirement.status === 'satisfied') ? 'satisfied' : 'missing',
      requirements,
    }
  })
  const report = {
    protocol: EVIDENCE_COVERAGE_REPORT_PROTOCOL,
    generatedOn: now.toISOString().slice(0, 10),
    verdictScope: 'coverage-policy-only-not-release-readiness',
    policy: { protocol: policy.protocol, policyId: policy.policyId },
    catalog: { protocol: catalog.protocol, catalogId: catalog.catalogId },
    inventory: {
      templates: templates.length,
      humanEvidence: records.length,
      claimNone: records.filter(record => record.claim === 'none').length,
      atTested: records.filter(record => record.claim === 'a11y-at-tested').length,
      userValidated: records.filter(record => record.claim === 'a11y-user-validated').length,
    },
    baselineSatisfied: profiles.every(profile => profile.status === 'satisfied'),
    profiles,
  }
  return { valid: true, issues: [], report }
}
