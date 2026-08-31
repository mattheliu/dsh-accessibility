/** Fail-closed scaffolding for privacy-minimized, non-evidence human-result templates. */
import {
  DEFAULT_EVIDENCE_CATALOG,
  DEFAULT_EVIDENCE_CATALOG_INDEX,
  EVIDENCE_CATALOG_PROTOCOL,
} from './evidence-catalog-lib.mjs'
import {
  HUMAN_EVIDENCE_PROTOCOL,
  validateHumanEvidenceRecord,
} from './human-evidence-lib.mjs'

const EVIDENCE_KINDS = new Set(['assistive-technology-run', 'disabled-user-task-run'])
function taskIdsForSelector(scenario, selector) {
  if (selector === 'all') return scenario.tasks.map(task => task.id)
  if (selector === 'claim-eligible') {
    return scenario.tasks.filter(task => task.claimEligible).map(task => task.id)
  }
  if (selector === 'representative-core') {
    return scenario.tasks.filter(task => task.representativeCoreTask).map(task => task.id)
  }
  if (selector === 'safety-critical') {
    return scenario.tasks.filter(task => task.safetyCritical).map(task => task.id)
  }
  const requested = selector.split(',').map(value => value.trim()).filter(Boolean)
  if (requested.length === 0) throw new Error('task selector must not be empty')
  if (new Set(requested).size !== requested.length) throw new Error('task selector contains duplicate task ids')
  const unknown = requested.filter(taskId => !scenario.tasksById.has(taskId))
  if (unknown.length > 0) throw new Error(`unknown task ids for ${scenario.protocol}: ${unknown.join(', ')}`)
  const requestedSet = new Set(requested)
  return scenario.tasks.filter(task => requestedSet.has(task.id)).map(task => task.id)
}

function placeholderTask(taskId, modality) {
  return {
    id: taskId,
    outcome: 'not-run',
    independent: false,
    effective: false,
    safe: false,
    assistance: {
      level: 'none',
      notes: [],
    },
    observations: [{
      checkpoint: 'task-result',
      modality,
      outcome: 'not-observed',
      observed: 'Non-evidence scaffold; replace with a concise observation produced by a person.',
    }],
    focus: [],
    barriers: [],
    limitations: ['Non-evidence scaffold; this task has not been performed or reviewed.'],
  }
}

function recordIdFor(scenario, evidenceKind, taskIds) {
  const protocolSlug = scenario.protocol.split('/')[0]
    .replace(/^dsh-/u, '')
    .replace(/[^a-z0-9]+/gu, '-')
    .replace(/^-|-$/gu, '')
  const kindSlug = evidenceKind === 'disabled-user-task-run' ? 'disabled-user' : 'at'
  return `template-${protocolSlug}-${kindSlug}-${String(taskIds.length)}-tasks`.slice(0, 100)
}

/**
 * Create a validator-clean template that cannot carry a support claim.
 * @param {{ protocol: string, tasks: string, evidenceKind: string, locale: string }} options
 */
export function createHumanEvidenceTemplate(options) {
  if (typeof options !== 'object' || options === null) throw new Error('template options are required')
  const { protocol, tasks, evidenceKind, locale } = options
  if (!EVIDENCE_KINDS.has(evidenceKind)) {
    throw new Error(`evidence kind must be one of ${[...EVIDENCE_KINDS].join(', ')}`)
  }
  if (typeof locale !== 'string' || !/^[A-Za-z]{2,3}(?:-[A-Za-z0-9]{2,8})*$/u.test(locale)) {
    throw new Error('locale must be an explicit BCP 47-like language tag such as en-US or zh-CN')
  }
  const scenario = DEFAULT_EVIDENCE_CATALOG_INDEX.get(protocol)
  if (scenario === undefined) throw new Error(`unknown versioned evidence protocol: ${String(protocol)}`)
  if (typeof tasks !== 'string' || tasks.length === 0) throw new Error('task selector is required')
  const taskIds = taskIdsForSelector(scenario, tasks)
  if (taskIds.length === 0) throw new Error(`task selector ${tasks} matched no tasks for ${scenario.protocol}`)

  const assistiveTechnologyRun = evidenceKind === 'assistive-technology-run'
  const browserOrTerminal = scenario.interface === 'web'
    ? { kind: 'browser', name: 'Synthetic browser', version: '0.0' }
    : { kind: 'terminal', name: 'Synthetic terminal', version: '0.0', shell: '0.0' }
  const record = {
    $schema: 'https://raw.githubusercontent.com/omdsh-dev/dsh-accessibility/main/HUMAN-EVIDENCE.schema.json',
    protocol: HUMAN_EVIDENCE_PROTOCOL,
    catalog: {
      protocol: EVIDENCE_CATALOG_PROTOCOL,
      catalogId: DEFAULT_EVIDENCE_CATALOG.catalogId,
    },
    recordType: 'template',
    recordId: recordIdFor(scenario, evidenceKind, taskIds),
    recordedOn: '2000-01-01',
    evidenceKind,
    claim: 'none',
    scenario: {
      protocol: scenario.protocol,
      interface: scenario.interface,
      locale,
      taskIds,
      description: 'Non-evidence scaffold. Replace every synthetic value only after consent and de-identification review.',
    },
    builds: {
      dsh: {
        name: '@deepseek-ai/dsh',
        version: '0.0.0',
        revision: '0000000000000000000000000000000000000000',
      },
      components: [],
    },
    environment: {
      os: { name: 'Synthetic operating system', version: '0.0' },
      browserOrTerminal,
      accessTechnologies: assistiveTechnologyRun
        ? [{ name: 'Synthetic access technology', version: '0.0', modalities: ['other'] }]
        : [],
      inputMethods: ['Replace with every input method actually used.'],
      settings: ['Replace with exact locale, verbosity, punctuation, mode, and other relevant settings.'],
    },
    tester: {
      category: assistiveTechnologyRun ? 'community-tester' : 'disabled-developer',
      screenVisuallyInspected: false,
      unrecordedAssistance: false,
      experience: 'Non-evidence scaffold; include only relevant experience, never identity or disability details.',
    },
    consent: {
      authority: 'self',
      affirmative: false,
      publicDeidentifiedSummary: false,
      rawDataPublished: false,
      withdrawalRouteAvailable: false,
    },
    tasks: taskIds.map(taskId => placeholderTask(taskId, assistiveTechnologyRun ? 'other' : 'keyboard')),
    summary: {
      overall: 'partial',
      independentCoreTaskCompletion: false,
      blockers: [],
      limitations: ['Non-evidence scaffold; no human result has been encoded or reviewed.'],
      claimScope: 'No support claim. Replace only with an exact, consented, de-identified scope.',
    },
    review: {
      status: 'template',
      validUntil: '2000-04-29',
    },
    publication: {
      sanitizedArtifacts: [],
    },
  }

  const result = validateHumanEvidenceRecord(record, { now: new Date('2000-01-01T00:00:00.000Z') })
  if (!result.valid) throw new Error(`generated template failed validation:\n${result.issues.join('\n')}`)
  return record
}
