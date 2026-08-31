/** Versioned authority for DSH accessibility evidence task identities. */
import { readFileSync } from 'node:fs'

export const EVIDENCE_CATALOG_PROTOCOL = 'dsh-a11y-evidence-catalog/0.1.0-draft'

export const DEFAULT_EVIDENCE_CATALOG = JSON.parse(readFileSync(
  new URL('../EVIDENCE-CATALOG.json', import.meta.url),
  'utf8',
))

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

function strictDate(value, path, issues) {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/u.test(value)) {
    issues.push(`${path}: expected an ISO calendar date`)
    return
  }
  const date = new Date(`${value}T00:00:00.000Z`)
  if (Number.isNaN(date.getTime()) || date.toISOString().slice(0, 10) !== value) {
    issues.push(`${path}: invalid calendar date`)
  }
}

export function validateEvidenceCatalog(input) {
  const issues = []
  const catalog = exactKeys(
    input,
    '$',
    ['$schema', 'protocol', 'catalogId', 'reviewedOn', 'scenarios'],
    ['$schema', 'protocol', 'catalogId', 'reviewedOn', 'scenarios'],
    issues,
  )
  if (catalog === undefined) return { valid: false, issues }
  if (typeof catalog.$schema !== 'string' || catalog.$schema.length > 200) issues.push('$.$schema: expected a schema URL')
  if (catalog.protocol !== EVIDENCE_CATALOG_PROTOCOL) issues.push(`$.protocol: expected ${EVIDENCE_CATALOG_PROTOCOL}`)
  if (typeof catalog.catalogId !== 'string' || !/^[a-z0-9][a-z0-9._-]{7,99}$/u.test(catalog.catalogId)) {
    issues.push('$.catalogId: invalid catalog id')
  }
  strictDate(catalog.reviewedOn, '$.reviewedOn', issues)
  if (!Array.isArray(catalog.scenarios) || catalog.scenarios.length < 1 || catalog.scenarios.length > 30) {
    issues.push('$.scenarios: expected 1-30 scenarios')
    return { valid: false, issues }
  }

  const protocols = []
  catalog.scenarios.forEach((value, scenarioIndex) => {
    const path = `$.scenarios[${String(scenarioIndex)}]`
    const scenario = exactKeys(value, path, ['protocol', 'interface', 'tasks'], ['protocol', 'interface', 'tasks'], issues)
    if (scenario === undefined) return
    if (typeof scenario.protocol !== 'string' || !/^[a-z0-9][a-z0-9.-]*\/\d+\.\d+\.\d+(?:-[a-z0-9.-]+)?$/u.test(scenario.protocol)) {
      issues.push(`${path}.protocol: invalid versioned protocol`)
    } else {
      protocols.push(scenario.protocol)
    }
    if (!['web', 'cli'].includes(scenario.interface)) issues.push(`${path}.interface: expected web or cli`)
    if (!Array.isArray(scenario.tasks) || scenario.tasks.length < 1 || scenario.tasks.length > 40) {
      issues.push(`${path}.tasks: expected 1-40 tasks`)
      return
    }
    const taskIds = []
    let representativeCount = 0
    scenario.tasks.forEach((taskValue, taskIndex) => {
      const taskPath = `${path}.tasks[${String(taskIndex)}]`
      const task = exactKeys(
        taskValue,
        taskPath,
        ['id', 'title', 'description', 'representativeCoreTask', 'safetyCritical', 'claimEligible'],
        ['id', 'title', 'description', 'representativeCoreTask', 'safetyCritical', 'claimEligible'],
        issues,
      )
      if (task === undefined) return
      if (typeof task.id !== 'string' || !/^[a-z0-9][a-z0-9._-]{1,79}$/u.test(task.id)) issues.push(`${taskPath}.id: invalid task id`)
      else taskIds.push(task.id)
      if (typeof task.title !== 'string' || task.title.length < 1 || task.title.length > 120) issues.push(`${taskPath}.title: expected 1-120 characters`)
      if (typeof task.description !== 'string' || task.description.length < 1 || task.description.length > 500) issues.push(`${taskPath}.description: expected 1-500 characters`)
      for (const key of ['representativeCoreTask', 'safetyCritical', 'claimEligible']) {
        if (typeof task[key] !== 'boolean') issues.push(`${taskPath}.${key}: expected a boolean`)
      }
      if (task.representativeCoreTask === true) representativeCount += 1
      if ((task.representativeCoreTask === true || task.safetyCritical === true) && task.claimEligible !== true) {
        issues.push(`${taskPath}.claimEligible: representative or safety-critical tasks must be claim eligible`)
      }
    })
    if (new Set(taskIds).size !== taskIds.length) issues.push(`${path}.tasks: duplicate task ids are not allowed`)
    if (representativeCount === 0) issues.push(`${path}.tasks: at least one representative core task is required`)
  })
  if (new Set(protocols).size !== protocols.length) issues.push('$.scenarios: duplicate protocols are not allowed')
  return { valid: issues.length === 0, issues }
}

export function createEvidenceCatalogIndex(catalog = DEFAULT_EVIDENCE_CATALOG) {
  const validation = validateEvidenceCatalog(catalog)
  if (!validation.valid) throw new Error(`invalid evidence catalog:\n${validation.issues.join('\n')}`)
  return new Map(catalog.scenarios.map(scenario => [
    scenario.protocol,
    {
      ...scenario,
      tasksById: new Map(scenario.tasks.map(task => [task.id, task])),
    },
  ]))
}

export const DEFAULT_EVIDENCE_CATALOG_INDEX = createEvidenceCatalogIndex()
