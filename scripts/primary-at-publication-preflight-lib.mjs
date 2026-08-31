/** Build a bounded, non-mutating publication preflight for the primary AT campaign. */

export const PRIMARY_AT_PUBLICATION_PREFLIGHT_PROTOCOL = 'dsh-a11y-primary-at-publication-preflight/0.1.0-draft'

export const PRIMARY_AT_PUBLICATION_FILES = [
  'PRIMARY-AT-CAMPAIGN.json',
  'PRIMARY-AT-CAMPAIGN.schema.json',
  'PRIMARY-AT-CAMPAIGN.md',
  'PRIMARY-AT-CAMPAIGN.zh.md',
  'PRIMARY-AT-PUBLIC-READINESS.schema.json',
  'PRIMARY-AT-PUBLICATION-PREFLIGHT.schema.json',
  'AT-CORE-LAB.md',
  'AT-CORE-LAB.zh.md',
  '.github/ISSUE_TEMPLATE/assistive-technology-test.yml',
  '.github/ISSUE_TEMPLATE/assistive-technology-test-zh.yml',
  '.github/ISSUE_TEMPLATE/disabled-developer-task-result.yml',
  '.github/ISSUE_TEMPLATE/disabled-developer-task-result-zh.yml',
  'outreach/primary-at/README.md',
  'outreach/primary-at/default-branch-pr.md',
  'outreach/primary-at/discussion-16.md',
  'outreach/primary-at/issue-1-nvda.md',
  'outreach/primary-at/issue-2-voiceover.md',
  'scripts/primary-at-public-readiness-lib.mjs',
  'scripts/primary-at-publication-preflight-lib.mjs',
  'scripts/verify-primary-at-campaign-public.mjs',
  'scripts/prepare-primary-at-publication.mjs',
]

const EXPECTED_GATES = [
  'core-revision-public',
  'lab-revision-public',
  'default-branch-intake',
  'discussion-current',
  'tracking-issues-current',
]

function revision(value, name) {
  if (typeof value !== 'string' || !/^[0-9a-f]{40}$/u.test(value)) {
    throw new Error(`${name} must be a full lowercase Git revision`)
  }
  return value
}

function repositoryState(value, name) {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) {
    throw new Error(`${name} repository state is required`)
  }
  const requiredRevision = revision(value.requiredRevision, `${name}.requiredRevision`)
  const headRevision = revision(value.headRevision, `${name}.headRevision`)
  if (typeof value.repository !== 'string' || !/^https:\/\/github\.com\/[A-Za-z0-9_.-]+\/[A-Za-z0-9_.-]+$/u.test(value.repository)) {
    throw new Error(`${name}.repository must be a public GitHub repository URL`)
  }
  if (typeof value.branch !== 'string' || value.branch.length === 0 || value.branch.length > 200) {
    throw new Error(`${name}.branch is required`)
  }
  if (typeof value.clean !== 'boolean' || typeof value.containsRequiredRevision !== 'boolean'
    || typeof value.remoteMatches !== 'boolean') {
    throw new Error(`${name} repository booleans are required`)
  }
  if (!Array.isArray(value.matchingRemoteNames)
    || value.matchingRemoteNames.some(remote => typeof remote !== 'string' || remote.length === 0)) {
    throw new Error(`${name}.matchingRemoteNames must be an array of remote names`)
  }
  return {
    repository: value.repository,
    branch: value.branch,
    headRevision,
    requiredRevision,
    clean: value.clean,
    containsRequiredRevision: value.containsRequiredRevision,
    headMatchesRequiredRevision: headRevision === requiredRevision,
    remoteMatches: value.remoteMatches,
    matchingRemoteNames: [...value.matchingRemoteNames].sort(),
  }
}

function publicState(observation) {
  if (observation?.protocol !== 'dsh-a11y-primary-at-public-readiness/0.1.0-draft') {
    throw new Error('public observation protocol is unsupported')
  }
  const gates = new Map((observation.gates ?? []).map(gate => [gate.id, gate.observedStatus]))
  if (gates.size !== EXPECTED_GATES.length || EXPECTED_GATES.some(id => !gates.has(id))) {
    throw new Error('public observation does not contain the five campaign gates')
  }
  const missingGates = EXPECTED_GATES.filter(id => gates.get(id) !== 'ready')
  return {
    protocol: observation.protocol,
    observationComplete: observation.observationComplete === true,
    readyToOpen: observation.readyToOpen === true,
    missingGates,
    gateStatus: Object.fromEntries(EXPECTED_GATES.map(id => [id, gates.get(id)])),
  }
}

function check(id, passed, passDetail, failDetail) {
  return { id, status: passed ? 'pass' : 'fail', detail: passed ? passDetail : failDetail }
}

function action(id, status, detail) {
  return { id, status, detail }
}

export function createPrimaryAtPublicationPreflight(input) {
  const { campaign } = input
  if (campaign?.protocol !== 'dsh-a11y-primary-at-campaign/0.1.0-draft') {
    throw new Error('campaign protocol is unsupported')
  }
  const core = repositoryState(input.core, 'core')
  const lab = repositoryState(input.lab, 'lab')
  if (core.requiredRevision !== campaign.candidate?.revision) {
    throw new Error('core required revision must equal the campaign candidate revision')
  }
  if (lab.requiredRevision !== campaign.lab?.revision) {
    throw new Error('lab required revision must equal the campaign lab revision')
  }
  const expectedEvidencePath = campaign.automatedEvidence?.path
  if (typeof expectedEvidencePath !== 'string' || expectedEvidencePath.length === 0) {
    throw new Error('campaign automated evidence path is required')
  }
  const requiredFiles = [...PRIMARY_AT_PUBLICATION_FILES, expectedEvidencePath]
  const tracked = new Set(input.labTrackedFiles ?? [])
  const missingFiles = requiredFiles.filter(file => !tracked.has(file))
  const publicObservation = publicState(input.publicObservation)
  const checks = [
    check('core-worktree-clean', core.clean, 'core worktree is clean', 'core worktree has tracked, staged, or untracked changes'),
    check('core-exact-head', core.headMatchesRequiredRevision, 'core HEAD is the exact campaign revision', 'core HEAD differs from the exact campaign revision'),
    check('core-public-remote', core.remoteMatches, 'core target repository remote is configured', 'core target repository remote is missing'),
    check('lab-worktree-clean', lab.clean, 'lab worktree is clean', 'lab worktree has tracked, staged, or untracked changes'),
    check('lab-contains-campaign-revision', lab.containsRequiredRevision, 'lab HEAD contains the exact campaign lab revision', 'lab HEAD does not contain the exact campaign lab revision'),
    check('lab-public-remote', lab.remoteMatches, 'lab target repository remote is configured', 'lab target repository remote is missing'),
    check('publication-files-committed', missingFiles.length === 0, 'all publication handoff files are committed', `${String(missingFiles.length)} publication handoff file(s) are absent from lab HEAD`),
    check('campaign-still-gated', campaign.status === 'prepared-not-open' || campaign.status === 'open', 'campaign status is valid for publication coordination', 'campaign is closed and cannot be published as an active recruitment campaign'),
    check('public-observation-complete', publicObservation.observationComplete, 'anonymous public observation completed', 'anonymous public observation contains request errors'),
  ]
  const localReady = checks.slice(0, 8).every(item => item.status === 'pass')
  const gateReady = id => publicObservation.gateStatus[id] === 'ready'
  const revisionsReady = gateReady('core-revision-public') && gateReady('lab-revision-public')
  const intakeReady = gateReady('default-branch-intake')
  const discussionReady = gateReady('discussion-current')
  const issuesReady = gateReady('tracking-issues-current')
  const actions = [
    action('publish-core-revision', gateReady('core-revision-public') ? 'complete' : localReady ? 'ready' : 'blocked', 'Publish only the exact candidate revision to the declared public core repository.'),
    action('publish-lab-branch', gateReady('lab-revision-public') ? 'complete' : localReady ? 'ready' : 'blocked', 'Publish the campaign lab revision and the current reviewed handoff branch to the declared public lab repository.'),
    action('merge-default-branch-intake', intakeReady ? 'complete' : revisionsReady ? 'ready' : 'blocked', 'Make the manifest, guides, exact automated report, and four Issue forms available from the public default branch.'),
    action('update-discussion-16', discussionReady ? 'complete' : intakeReady ? 'ready' : 'blocked', 'Edit the existing Discussion body from the reviewed handoff; preserve its history.'),
    action('update-tracking-issues', issuesReady ? 'complete' : intakeReady ? 'ready' : 'blocked', 'Edit Issues 1 and 2 from the reviewed handoff; preserve their history.'),
    action('open-campaign', campaign.status === 'open' && publicObservation.readyToOpen
      ? 'complete'
      : publicObservation.readyToOpen && discussionReady && issuesReady ? 'ready' : 'blocked', 'Change all five manifest gates to ready and status to open only after anonymous verification passes.'),
  ]
  const now = input.now ?? new Date()
  if (!(now instanceof Date) || Number.isNaN(now.getTime())) throw new Error('now must be a valid Date')
  return {
    protocol: PRIMARY_AT_PUBLICATION_PREFLIGHT_PROTOCOL,
    generatedAt: now.toISOString(),
    verdictScope: 'local-publication-source-readiness-only-not-publication-or-human-evidence',
    localReady,
    repositories: { core, lab },
    handoff: {
      requiredFileCount: requiredFiles.length,
      trackedFileCount: requiredFiles.length - missingFiles.length,
      missingFiles,
    },
    publicObservation: {
      protocol: publicObservation.protocol,
      observationComplete: publicObservation.observationComplete,
      readyToOpen: publicObservation.readyToOpen,
      missingGates: publicObservation.missingGates,
    },
    checks,
    actions,
    limitations: [
      'This preflight is read-only and does not push, merge, edit a public thread, or open recruitment.',
      'Clean local revisions and matching remotes do not prove that any commit or intake route is publicly available.',
      'Publication readiness is not assistive-technology evidence, disabled-user validation, or an accessibility support claim.',
    ],
  }
}
