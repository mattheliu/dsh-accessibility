/** Validation rules for consented, de-identified human accessibility evidence. */
import {
  DEFAULT_EVIDENCE_CATALOG,
  DEFAULT_EVIDENCE_CATALOG_INDEX,
  EVIDENCE_CATALOG_PROTOCOL,
} from './evidence-catalog-lib.mjs'

export const HUMAN_EVIDENCE_PROTOCOL = 'dsh-a11y-human-evidence/0.1.0-draft'

const RECORD_TYPES = new Set(['template', 'human-evidence'])
const EVIDENCE_KINDS = new Set(['assistive-technology-run', 'disabled-user-task-run'])
const CLAIMS = new Set(['none', 'a11y-at-tested', 'a11y-user-validated'])
const INTERFACES = new Set(['web', 'cli'])
const TESTER_CATEGORIES = new Set(['community-tester', 'at-specialist', 'disabled-developer'])
const CONSENT_AUTHORITIES = new Set(['self', 'explicit-permission'])
const MODALITIES = new Set(['speech', 'braille', 'keyboard', 'switch', 'voice', 'magnification', 'other'])
const TASK_OUTCOMES = new Set(['pass', 'fail', 'partial', 'not-run'])
const OBSERVATION_OUTCOMES = new Set(['pass', 'fail', 'partial', 'not-observed'])
const FOCUS_OUTCOMES = new Set(['expected', 'unexpected', 'lost', 'not-applicable'])
const ASSISTANCE_LEVELS = new Set(['none', 'setup-only', 'verbal', 'sighted-operation', 'other'])
const SEVERITIES = new Set(['blocker', 'high', 'medium', 'low'])
const OVERALL_RESULTS = new Set(['pass', 'fail', 'partial'])
const REVIEW_STATUSES = new Set(['template', 'current', 'expired', 'superseded', 'withdrawn'])

const forbiddenKeys = /(?:^|_)(?:contact|diagnosis|disability|email|one.?use.?url|raw.?transcript|recording.?url|session.?log|username)(?:$|_)/iu
const privatePatterns = [
  { pattern: /\bgh[opusr]_[A-Za-z0-9]{20,}\b/u, label: 'GitHub token' },
  { pattern: /\bgithub_pat_[A-Za-z0-9_]{20,}\b/u, label: 'GitHub token' },
  { pattern: /\bnpm_[A-Za-z0-9]{20,}\b/u, label: 'npm token' },
  { pattern: /\bsk-[A-Za-z0-9_-]{16,}\b/u, label: 'API key' },
  { pattern: /\bBearer\s+[A-Za-z0-9._~-]{12,}\b/iu, label: 'bearer credential' },
  { pattern: /(?:[?#&](?:access_?token|api_?key|token|key|secret|auth)=)[^\s&#]+/iu, label: 'URL credential' },
  { pattern: /(?:^|[\s=:'"(]|file:\/\/)\/(?:Users|home)\/[^\s]+/u, label: 'private absolute path' },
  { pattern: /\b[A-Za-z]:\\Users\\[^\s]+/u, label: 'private absolute path' },
  { pattern: /\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/iu, label: 'email address' },
  { pattern: /\bsession-[0-9a-f]{8}-[0-9a-f-]{27,}\b/iu, label: 'runtime session identifier' },
  { pattern: /\b[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}\b/iu, label: 'runtime or private UUID' },
  { pattern: /-----BEGIN [A-Z0-9 ]*PRIVATE KEY-----/u, label: 'private key' },
]

function isObject(value) {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function pathJoin(path, key) {
  return path === '$' ? `$.${key}` : `${path}.${key}`
}

function object(value, path, issues) {
  if (!isObject(value)) {
    issues.push(`${path}: expected an object`)
    return undefined
  }
  return value
}

function exactKeys(value, path, required, allowed, issues) {
  const row = object(value, path, issues)
  if (row === undefined) return undefined
  for (const key of required) {
    if (!Object.hasOwn(row, key)) issues.push(`${path}: missing required field ${key}`)
  }
  for (const key of Object.keys(row)) {
    if (!allowed.includes(key)) issues.push(`${pathJoin(path, key)}: unknown field`)
  }
  return row
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

function boolean(value, path, issues) {
  if (typeof value !== 'boolean') {
    issues.push(`${path}: expected a boolean`)
    return undefined
  }
  return value
}

function enumeration(value, path, values, issues) {
  if (typeof value !== 'string' || !values.has(value)) {
    issues.push(`${path}: expected one of ${[...values].join(', ')}`)
    return undefined
  }
  return value
}

function array(value, path, issues, { min = 0, max = 50 } = {}) {
  if (!Array.isArray(value)) {
    issues.push(`${path}: expected an array`)
    return []
  }
  if (value.length < min || value.length > max) issues.push(`${path}: expected ${String(min)}-${String(max)} items`)
  return value
}

function stringArray(value, path, issues, options = {}) {
  const values = array(value, path, issues, options)
  values.forEach((item, index) => string(item, `${path}[${String(index)}]`, issues, { max: options.itemMax ?? 500 }))
  if (new Set(values).size !== values.length) issues.push(`${path}: duplicate values are not allowed`)
  return values
}

function validateBuild(value, path, issues, expectedName) {
  const row = exactKeys(value, path, ['name', 'version', 'revision'], ['name', 'version', 'revision'], issues)
  if (row === undefined) return
  const name = string(row.name, `${path}.name`, issues, { max: 120 })
  if (expectedName !== undefined && name !== expectedName) issues.push(`${path}.name: expected ${expectedName}`)
  string(row.version, `${path}.version`, issues, {
    pattern: /^v?\d+\.\d+\.\d+(?:-[0-9A-Za-z.-]+)?(?:\+[0-9A-Za-z.-]+)?$/u,
    max: 80,
  })
  string(row.revision, `${path}.revision`, issues, { pattern: /^(?:[0-9a-f]{40}|[0-9a-f]{64})$/u, max: 64 })
}

function exactVersion(value, path, issues) {
  const version = string(value, path, issues, { max: 80 })
  if (version !== undefined && /^(?:latest|current|default|main|master|unknown|unavailable|n\/a)$/iu.test(version.trim())) {
    issues.push(`${path}: exact version required`)
  }
  return version
}

function validateObservation(value, path, issues) {
  const row = exactKeys(
    value, path,
    ['checkpoint', 'modality', 'outcome', 'observed'],
    ['checkpoint', 'modality', 'outcome', 'observed'],
    issues,
  )
  if (row === undefined) return
  string(row.checkpoint, `${path}.checkpoint`, issues, { max: 100 })
  enumeration(row.modality, `${path}.modality`, MODALITIES, issues)
  enumeration(row.outcome, `${path}.outcome`, OBSERVATION_OUTCOMES, issues)
  string(row.observed, `${path}.observed`, issues, { max: 500 })
}

function validateFocus(value, path, issues) {
  const row = exactKeys(value, path, ['transition', 'destination', 'outcome'], ['transition', 'destination', 'outcome'], issues)
  if (row === undefined) return
  string(row.transition, `${path}.transition`, issues, { max: 160 })
  string(row.destination, `${path}.destination`, issues, { max: 160 })
  enumeration(row.outcome, `${path}.outcome`, FOCUS_OUTCOMES, issues)
}

function validateBarrier(value, path, issues) {
  const row = exactKeys(value, path, ['severity', 'summary'], ['severity', 'summary', 'workaround'], issues)
  if (row === undefined) return
  enumeration(row.severity, `${path}.severity`, SEVERITIES, issues)
  string(row.summary, `${path}.summary`, issues, { max: 500 })
  if (row.workaround !== undefined) string(row.workaround, `${path}.workaround`, issues, { max: 500 })
}

function validateTask(value, path, issues) {
  const row = exactKeys(
    value, path,
    ['id', 'outcome', 'independent', 'effective', 'safe', 'assistance', 'observations', 'focus', 'barriers', 'limitations'],
    ['id', 'outcome', 'independent', 'effective', 'safe', 'assistance', 'observations', 'focus', 'barriers', 'limitations'],
    issues,
  )
  if (row === undefined) return undefined
  string(row.id, `${path}.id`, issues, { pattern: /^[a-z0-9][a-z0-9._-]{1,79}$/u, max: 80 })
  enumeration(row.outcome, `${path}.outcome`, TASK_OUTCOMES, issues)
  boolean(row.independent, `${path}.independent`, issues)
  boolean(row.effective, `${path}.effective`, issues)
  boolean(row.safe, `${path}.safe`, issues)
  const assistance = exactKeys(row.assistance, `${path}.assistance`, ['level', 'notes'], ['level', 'notes'], issues)
  if (assistance !== undefined) {
    enumeration(assistance.level, `${path}.assistance.level`, ASSISTANCE_LEVELS, issues)
    const assistanceNotes = stringArray(assistance.notes, `${path}.assistance.notes`, issues, { max: 10, itemMax: 300 })
    if (assistance.level !== 'none' && assistanceNotes.length === 0) {
      issues.push(`${path}.assistance.notes: describe every non-none form of assistance`)
    }
  }
  array(row.observations, `${path}.observations`, issues, { min: 1, max: 30 })
    .forEach((item, index) => validateObservation(item, `${path}.observations[${String(index)}]`, issues))
  array(row.focus, `${path}.focus`, issues, { max: 30 })
    .forEach((item, index) => validateFocus(item, `${path}.focus[${String(index)}]`, issues))
  array(row.barriers, `${path}.barriers`, issues, { max: 30 })
    .forEach((item, index) => validateBarrier(item, `${path}.barriers[${String(index)}]`, issues))
  stringArray(row.limitations, `${path}.limitations`, issues, { min: 1, max: 20, itemMax: 500 })
  return row
}

function scanPrivacy(value, path, issues) {
  if (typeof value === 'string') {
    if (value.length > 1_200) issues.push(`${path}: string is too long for a minimized public record`)
    for (const { pattern, label } of privatePatterns) {
      if (pattern.test(value)) issues.push(`${path}: possible ${label} is forbidden in public evidence`)
    }
    return
  }
  if (Array.isArray(value)) {
    value.forEach((item, index) => scanPrivacy(item, `${path}[${String(index)}]`, issues))
    return
  }
  if (!isObject(value)) return
  for (const [key, nested] of Object.entries(value)) {
    if (forbiddenKeys.test(key)) issues.push(`${pathJoin(path, key)}: participant/private-data field is forbidden`)
    scanPrivacy(nested, pathJoin(path, key), issues)
  }
}

function scanTemplateMarkers(value, path, issues) {
  if (typeof value === 'string') {
    if (/(?:^|[.;]\s+)Replace with\b|Synthetic (?:template|operating system|browser|screen reader)\b|non-evidence template\b/iu.test(value)) {
      issues.push(`${path}: copied template placeholder must be replaced in human evidence`)
    }
    return
  }
  if (Array.isArray(value)) {
    value.forEach((item, index) => scanTemplateMarkers(item, `${path}[${String(index)}]`, issues))
    return
  }
  if (!isObject(value)) return
  for (const [key, nested] of Object.entries(value)) scanTemplateMarkers(nested, pathJoin(path, key), issues)
}

function parseDateOnly(value, path, issues) {
  const raw = string(value, path, issues, { pattern: /^\d{4}-\d{2}-\d{2}$/u, max: 10 })
  if (raw === undefined) return undefined
  const date = new Date(`${raw}T00:00:00.000Z`)
  if (Number.isNaN(date.getTime())) {
    issues.push(`${path}: invalid date`)
    return undefined
  }
  if (date.toISOString().slice(0, 10) !== raw) {
    issues.push(`${path}: invalid calendar date`)
    return undefined
  }
  return date
}

/**
 * Validate one public human-evidence record and its claim eligibility.
 * @param {unknown} input - parsed JSON record.
 * @param {{ now?: Date }} options - deterministic clock for tests.
 * @returns {{ valid: boolean, issues: string[], recordType?: string, claim?: string }} result.
 */
export function validateHumanEvidenceRecord(input, options = {}) {
  const issues = []
  const now = options.now ?? new Date()
  const record = exactKeys(
    input,
    '$',
    ['protocol', 'catalog', 'recordType', 'recordId', 'recordedOn', 'evidenceKind', 'claim', 'scenario', 'builds', 'environment', 'tester', 'consent', 'tasks', 'summary', 'review', 'publication'],
    ['$schema', 'protocol', 'catalog', 'recordType', 'recordId', 'recordedOn', 'evidenceKind', 'claim', 'scenario', 'builds', 'environment', 'tester', 'consent', 'tasks', 'summary', 'review', 'publication'],
    issues,
  )
  if (record === undefined) return { valid: false, issues }
  if (record.$schema !== undefined) string(record.$schema, '$.$schema', issues, { max: 200 })
  if (record.protocol !== HUMAN_EVIDENCE_PROTOCOL) issues.push(`$.protocol: expected ${HUMAN_EVIDENCE_PROTOCOL}`)
  const catalogReference = exactKeys(record.catalog, '$.catalog', ['protocol', 'catalogId'], ['protocol', 'catalogId'], issues)
  if (catalogReference !== undefined) {
    if (catalogReference.protocol !== EVIDENCE_CATALOG_PROTOCOL) issues.push(`$.catalog.protocol: expected ${EVIDENCE_CATALOG_PROTOCOL}`)
    if (catalogReference.catalogId !== DEFAULT_EVIDENCE_CATALOG.catalogId) {
      issues.push(`$.catalog.catalogId: expected ${DEFAULT_EVIDENCE_CATALOG.catalogId}`)
    }
  }
  const recordType = enumeration(record.recordType, '$.recordType', RECORD_TYPES, issues)
  string(record.recordId, '$.recordId', issues, { pattern: /^[a-z0-9][a-z0-9._-]{7,99}$/u, max: 100 })
  const recordedOn = parseDateOnly(record.recordedOn, '$.recordedOn', issues)
  const evidenceKind = enumeration(record.evidenceKind, '$.evidenceKind', EVIDENCE_KINDS, issues)
  const claim = enumeration(record.claim, '$.claim', CLAIMS, issues)

  const scenario = exactKeys(record.scenario, '$.scenario', ['protocol', 'interface', 'locale', 'taskIds'], ['protocol', 'interface', 'locale', 'taskIds', 'description'], issues)
  let catalogScenario
  if (scenario !== undefined) {
    string(scenario.protocol, '$.scenario.protocol', issues, { pattern: /^[a-z0-9][a-z0-9.-]*\/\d+\.\d+\.\d+(?:-[a-z0-9.-]+)?$/u, max: 120 })
    enumeration(scenario.interface, '$.scenario.interface', INTERFACES, issues)
    string(scenario.locale, '$.scenario.locale', issues, { pattern: /^[A-Za-z]{2,3}(?:-[A-Za-z0-9]{2,8})*$/u, max: 35 })
    stringArray(scenario.taskIds, '$.scenario.taskIds', issues, { min: 1, max: 30, itemMax: 80 })
    if (scenario.description !== undefined) string(scenario.description, '$.scenario.description', issues, { max: 500 })
    catalogScenario = DEFAULT_EVIDENCE_CATALOG_INDEX.get(scenario.protocol)
    if (catalogScenario === undefined) issues.push('$.scenario.protocol: protocol is not registered in the evidence catalog')
    else if (scenario.interface !== catalogScenario.interface) issues.push(`$.scenario.interface: catalog requires ${catalogScenario.interface}`)
  }

  const builds = exactKeys(record.builds, '$.builds', ['dsh', 'components'], ['dsh', 'components'], issues)
  if (builds !== undefined) {
    validateBuild(builds.dsh, '$.builds.dsh', issues, '@deepseek-ai/dsh')
    const components = array(builds.components, '$.builds.components', issues, { max: 20 })
    components.forEach((item, index) => validateBuild(item, `$.builds.components[${String(index)}]`, issues))
    const componentNames = components.flatMap(item => isObject(item) && typeof item.name === 'string' ? [item.name] : [])
    if (new Set(componentNames).size !== componentNames.length) issues.push('$.builds.components: duplicate component names are not allowed')
  }

  let accessTechnologyCount = 0
  const environment = exactKeys(
    record.environment,
    '$.environment',
    ['os', 'browserOrTerminal', 'accessTechnologies', 'inputMethods', 'settings'],
    ['os', 'browserOrTerminal', 'accessTechnologies', 'inputMethods', 'settings'],
    issues,
  )
  if (environment !== undefined) {
    const os = exactKeys(environment.os, '$.environment.os', ['name', 'version'], ['name', 'version'], issues)
    if (os !== undefined) {
      string(os.name, '$.environment.os.name', issues, { max: 80 })
      exactVersion(os.version, '$.environment.os.version', issues)
    }
    const surface = exactKeys(environment.browserOrTerminal, '$.environment.browserOrTerminal', ['kind', 'name', 'version'], ['kind', 'name', 'version', 'shell'], issues)
    if (surface !== undefined) {
      const surfaceKind = enumeration(surface.kind, '$.environment.browserOrTerminal.kind', new Set(['browser', 'terminal']), issues)
      string(surface.name, '$.environment.browserOrTerminal.name', issues, { max: 80 })
      exactVersion(surface.version, '$.environment.browserOrTerminal.version', issues)
      if (surface.shell !== undefined) exactVersion(surface.shell, '$.environment.browserOrTerminal.shell', issues)
      if (surfaceKind === 'terminal' && surface.shell === undefined) issues.push('$.environment.browserOrTerminal.shell: terminal evidence requires the exact shell')
      if (surfaceKind === 'browser' && surface.shell !== undefined) issues.push('$.environment.browserOrTerminal.shell: browser evidence cannot include a shell')
      if (scenario?.interface === 'web' && surfaceKind !== 'browser') issues.push('$.environment.browserOrTerminal.kind: web evidence requires a browser')
      if (scenario?.interface === 'cli' && surfaceKind !== 'terminal') issues.push('$.environment.browserOrTerminal.kind: CLI evidence requires a terminal')
    }
    const accessTechnologies = array(environment.accessTechnologies, '$.environment.accessTechnologies', issues, { max: 10 })
    accessTechnologyCount = accessTechnologies.length
    accessTechnologies.forEach((item, index) => {
        const path = `$.environment.accessTechnologies[${String(index)}]`
        const row = exactKeys(item, path, ['name', 'version', 'modalities'], ['name', 'version', 'modalities'], issues)
        if (row === undefined) return
        string(row.name, `${path}.name`, issues, { max: 80 })
        exactVersion(row.version, `${path}.version`, issues)
        const modalities = array(row.modalities, `${path}.modalities`, issues, { min: 1, max: 7 })
        modalities.forEach((modality, modalityIndex) => enumeration(modality, `${path}.modalities[${String(modalityIndex)}]`, MODALITIES, issues))
        if (new Set(modalities).size !== modalities.length) issues.push(`${path}.modalities: duplicate values are not allowed`)
      })
    const accessTechnologyNames = accessTechnologies.flatMap(item => isObject(item) && typeof item.name === 'string' ? [item.name.toLocaleLowerCase('en-US')] : [])
    if (new Set(accessTechnologyNames).size !== accessTechnologyNames.length) {
      issues.push('$.environment.accessTechnologies: duplicate access-technology names are not allowed')
    }
    stringArray(environment.inputMethods, '$.environment.inputMethods', issues, { min: 1, max: 10, itemMax: 100 })
    stringArray(environment.settings, '$.environment.settings', issues, { min: 1, max: 20, itemMax: 300 })
  }

  const tester = exactKeys(record.tester, '$.tester', ['category', 'screenVisuallyInspected', 'unrecordedAssistance'], ['category', 'screenVisuallyInspected', 'unrecordedAssistance', 'experience'], issues)
  if (tester !== undefined) {
    enumeration(tester.category, '$.tester.category', TESTER_CATEGORIES, issues)
    boolean(tester.screenVisuallyInspected, '$.tester.screenVisuallyInspected', issues)
    boolean(tester.unrecordedAssistance, '$.tester.unrecordedAssistance', issues)
    if (tester.experience !== undefined) string(tester.experience, '$.tester.experience', issues, { max: 300 })
  }

  const consent = exactKeys(
    record.consent,
    '$.consent',
    ['authority', 'affirmative', 'publicDeidentifiedSummary', 'rawDataPublished', 'withdrawalRouteAvailable'],
    ['authority', 'affirmative', 'publicDeidentifiedSummary', 'rawDataPublished', 'withdrawalRouteAvailable'],
    issues,
  )
  if (consent !== undefined) {
    enumeration(consent.authority, '$.consent.authority', CONSENT_AUTHORITIES, issues)
    boolean(consent.affirmative, '$.consent.affirmative', issues)
    boolean(consent.publicDeidentifiedSummary, '$.consent.publicDeidentifiedSummary', issues)
    boolean(consent.rawDataPublished, '$.consent.rawDataPublished', issues)
    boolean(consent.withdrawalRouteAvailable, '$.consent.withdrawalRouteAvailable', issues)
  }

  const tasks = array(record.tasks, '$.tasks', issues, { min: 1, max: 30 })
    .map((item, index) => validateTask(item, `$.tasks[${String(index)}]`, issues))
    .filter(Boolean)
  const taskIds = tasks.flatMap(task => typeof task.id === 'string' ? [task.id] : [])
  if (new Set(taskIds).size !== taskIds.length) issues.push('$.tasks: duplicate task ids are not allowed')
  if (scenario !== undefined && Array.isArray(scenario.taskIds)) {
    const expected = [...scenario.taskIds].sort()
    const actual = [...taskIds].sort()
    if (JSON.stringify(expected) !== JSON.stringify(actual)) issues.push('$.scenario.taskIds: must exactly match $.tasks ids')
  }
  tasks.forEach((task, index) => {
    if (typeof task.id === 'string' && catalogScenario !== undefined && !catalogScenario.tasksById.has(task.id)) {
      issues.push(`$.tasks[${String(index)}].id: task ${task.id} is not registered for ${catalogScenario.protocol}`)
    }
  })

  const summary = exactKeys(
    record.summary,
    '$.summary',
    ['overall', 'independentCoreTaskCompletion', 'blockers', 'limitations', 'claimScope'],
    ['overall', 'independentCoreTaskCompletion', 'blockers', 'limitations', 'claimScope'],
    issues,
  )
  if (summary !== undefined) {
    enumeration(summary.overall, '$.summary.overall', OVERALL_RESULTS, issues)
    boolean(summary.independentCoreTaskCompletion, '$.summary.independentCoreTaskCompletion', issues)
    stringArray(summary.blockers, '$.summary.blockers', issues, { max: 20, itemMax: 500 })
    stringArray(summary.limitations, '$.summary.limitations', issues, { min: 1, max: 20, itemMax: 500 })
    string(summary.claimScope, '$.summary.claimScope', issues, { max: 500 })
  }

  const review = exactKeys(record.review, '$.review', ['status', 'validUntil'], ['status', 'validUntil', 'invalidatedBy'], issues)
  let validUntil
  if (review !== undefined) {
    enumeration(review.status, '$.review.status', REVIEW_STATUSES, issues)
    validUntil = parseDateOnly(review.validUntil, '$.review.validUntil', issues)
    if (review.invalidatedBy !== undefined) string(review.invalidatedBy, '$.review.invalidatedBy', issues, { max: 300 })
  }

  const publication = exactKeys(record.publication, '$.publication', ['sanitizedArtifacts'], ['publicIssue', 'sanitizedArtifacts'], issues)
  if (publication !== undefined) {
    if (publication.publicIssue !== undefined) {
      const publicIssue = string(publication.publicIssue, '$.publication.publicIssue', issues, { max: 300 })
      if (publicIssue !== undefined && !/^https:\/\/github\.com\/[A-Za-z0-9_.-]+\/[A-Za-z0-9_.-]+\/(?:issues|discussions)\/\d+$/u.test(publicIssue)) {
        issues.push('$.publication.publicIssue: expected an exact public GitHub issue or discussion URL')
      }
    }
    const artifacts = stringArray(publication.sanitizedArtifacts, '$.publication.sanitizedArtifacts', issues, { max: 10, itemMax: 300 })
    artifacts.forEach((artifact, index) => {
      if (!/^https:\/\//u.test(artifact)) issues.push(`$.publication.sanitizedArtifacts[${String(index)}]: HTTPS URL required`)
    })
  }

  if (recordedOn !== undefined && recordType === 'human-evidence') {
    const today = Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate())
    if (recordedOn.getTime() > today + 86_400_000) issues.push('$.recordedOn: record cannot be more than one day in the future')
    if (validUntil !== undefined) {
      const spanDays = (validUntil.getTime() - recordedOn.getTime()) / 86_400_000
      if (spanDays < 0 || spanDays > 120) issues.push('$.review.validUntil: must be on or after recordedOn and no more than 120 calendar days later')
      if (review?.status === 'current' && today > validUntil.getTime()) {
        issues.push('$.review.status: current record is past validUntil; mark it expired or repeat the test')
      }
    }
  }

  if (recordType === 'template') {
    if (claim !== 'none') issues.push('$.claim: templates cannot carry a support claim')
    if (review?.status !== 'template') issues.push('$.review.status: templates must use template')
  } else if (recordType === 'human-evidence') {
    if (review?.status === 'template') issues.push('$.review.status: human evidence cannot use template')
    if (consent?.affirmative !== true || consent.publicDeidentifiedSummary !== true) {
      issues.push('$.consent: affirmative consent for a public de-identified summary is required')
    }
    if (consent?.rawDataPublished !== false) issues.push('$.consent.rawDataPublished: raw participant data must not be public')
    if (tester?.unrecordedAssistance !== false) issues.push('$.tester.unrecordedAssistance: public evidence cannot hide assistance')
    if (evidenceKind === 'disabled-user-task-run' && tester?.category !== 'disabled-developer') {
      issues.push('$.tester.category: disabled-user-task-run requires disabled-developer without publishing disability details')
    }
    if (evidenceKind === 'disabled-user-task-run' && consent?.withdrawalRouteAvailable !== true) {
      issues.push('$.consent.withdrawalRouteAvailable: disabled-user task evidence requires a private withdrawal route')
    }
    const allRevisions = [builds?.dsh, ...(Array.isArray(builds?.components) ? builds.components : [])]
      .flatMap(build => isObject(build) && typeof build.revision === 'string' ? [build.revision] : [])
    if (allRevisions.some(revision => /^(.)\1+$/u.test(revision))) {
      issues.push('$.builds: copied or placeholder revisions are not valid human evidence')
    }
    scanTemplateMarkers(record, '$', issues)
  }

  if (evidenceKind === 'assistive-technology-run' && accessTechnologyCount === 0) {
    issues.push('$.environment.accessTechnologies: assistive-technology-run requires at least one named access technology')
  }

  if (claim !== undefined && claim !== 'none') {
    if (recordType !== 'human-evidence') issues.push('$.claim: only a human-evidence record can carry a claim')
    if (review?.status !== 'current') issues.push('$.claim: support claims require a current review status')
    if (summary?.overall !== 'pass') issues.push('$.claim: support claims require an overall pass')
    if (summary?.blockers?.length !== 0) issues.push('$.claim: support claims cannot retain blockers')
    if (typeof publication?.publicIssue !== 'string') issues.push('$.claim: a public review issue or discussion is required')
    if (tasks.some(task => task.outcome !== 'pass' || task.effective !== true || task.safe !== true
      || !['none', 'setup-only'].includes(task.assistance?.level))) {
      issues.push('$.claim: every claimed task must pass effectively and safely without operational assistance')
    }
    if (tasks.some(task => task.observations?.some(observation => observation.outcome !== 'pass'))) {
      issues.push('$.claim: every claimed human observation must pass')
    }
    if (tasks.some(task => task.focus?.some(focus => focus.outcome === 'unexpected' || focus.outcome === 'lost'))) {
      issues.push('$.claim: unexpected or lost focus makes the record ineligible')
    }
    if (tasks.some(task => task.barriers?.some(barrier => barrier.severity === 'blocker' || barrier.severity === 'high'))) {
      issues.push('$.claim: blocker or high-severity barriers make the record ineligible')
    }
    if (catalogScenario === undefined || tasks.some(task => catalogScenario.tasksById.get(task.id)?.claimEligible !== true)) {
      issues.push('$.claim: every claimed task must be claim eligible in the versioned evidence catalog')
    }
    if (claim === 'a11y-at-tested' && evidenceKind !== 'assistive-technology-run') {
      issues.push('$.claim: a11y-at-tested requires an assistive-technology-run')
    }
    if (claim === 'a11y-user-validated') {
      if (evidenceKind !== 'disabled-user-task-run') issues.push('$.claim: a11y-user-validated requires disabled-user-task-run')
      if (tester?.category !== 'disabled-developer') issues.push('$.claim: a11y-user-validated requires a disabled-developer tester category')
      if (consent?.withdrawalRouteAvailable !== true) issues.push('$.claim: a11y-user-validated requires a private withdrawal route')
      const hasIndependentCoreTask = tasks.some(task => catalogScenario?.tasksById.get(task.id)?.representativeCoreTask === true
        && task.independent === true && task.effective === true && task.safe === true
        && ['none', 'setup-only'].includes(task.assistance?.level))
      if (!hasIndependentCoreTask) {
        issues.push('$.claim: at least one representative core task must be independent, effective, safe, and use no operational assistance')
      }
      if (summary?.independentCoreTaskCompletion !== true) issues.push('$.claim: independent core task completion must be true')
    }
  } else if (claim === 'none' && summary?.overall !== 'pass' && review?.status === 'current') {
    // Failing and partial records are valuable, but they are historical
    // observations rather than current support claims.
  }

  scanPrivacy(record, '$', issues)
  return { valid: issues.length === 0, issues, recordType, claim }
}
