/** Observe the primary campaign's public availability without mutating campaign state. */

export const PRIMARY_AT_PUBLIC_READINESS_PROTOCOL = 'dsh-a11y-primary-at-public-readiness/0.1.0-draft'

const CAMPAIGN_PROTOCOL = 'dsh-a11y-primary-at-campaign/0.1.0-draft'
const CORE_PROTOCOL = 'dsh-core-at-lab/1.0.0-draft'
const REPOSITORY = 'omdsh-dev/dsh-accessibility'
const CORE_REPOSITORY = 'omdsh-dev/deepseek-harness'
const RAW_MAIN = `https://raw.githubusercontent.com/${REPOSITORY}/main`

function exactCampaign(campaign) {
  if (campaign?.protocol !== CAMPAIGN_PROTOCOL) throw new Error(`unsupported campaign protocol: ${String(campaign?.protocol)}`)
  if (typeof campaign.campaignId !== 'string' || campaign.campaignId.length === 0) throw new Error('campaignId is required')
  if (!['prepared-not-open', 'open', 'closed'].includes(campaign.status)) throw new Error(`unsupported campaign status: ${String(campaign.status)}`)
  for (const [path, value] of [
    ['candidate.revision', campaign.candidate?.revision],
    ['lab.revision', campaign.lab?.revision],
  ]) {
    if (typeof value !== 'string' || !/^[0-9a-f]{40}$/u.test(value)) throw new Error(`${path} must be a full lowercase Git revision`)
  }
  if (campaign.automatedEvidence?.dshRevision !== campaign.candidate.revision) {
    throw new Error('automatedEvidence.dshRevision must equal candidate.revision')
  }
  if (campaign.automatedEvidence?.protocol !== 'dsh-non-at-browser/1.0.0-draft'
    || campaign.automatedEvidence?.evidence !== 'dsh-core-browser-non-at'
    || campaign.automatedEvidence?.result !== 'pass'
    || campaign.automatedEvidence?.claimBoundary !== 'automated-only-not-at-or-user-evidence'
    || typeof campaign.automatedEvidence?.path !== 'string'
    || !/^automated-evidence\/core-browser\/[0-9A-Za-z.-]+\.json$/u.test(campaign.automatedEvidence.path)) {
    throw new Error('campaign automatedEvidence must identify one exact passing non-human core-browser report')
  }
  const expectedGateIds = [
    'core-revision-public',
    'lab-revision-public',
    'default-branch-intake',
    'discussion-current',
    'tracking-issues-current',
  ]
  const gates = new Map((campaign.availabilityGates ?? []).map(gate => [gate.id, gate]))
  if (gates.size !== expectedGateIds.length || expectedGateIds.some(id => !gates.has(id))) {
    throw new Error(`campaign must declare exactly these public gates: ${expectedGateIds.join(', ')}`)
  }
  return { gates, expectedGateIds }
}

async function request(fetchImpl, url, format) {
  let response
  try {
    response = await fetchImpl(url, {
      headers: {
        Accept: format === 'json' ? 'application/vnd.github+json' : 'text/html, text/plain;q=0.9',
        'User-Agent': 'dsh-accessibility-public-readiness/0.1',
      },
      redirect: 'follow',
      signal: AbortSignal.timeout(15_000),
    })
  } catch (error) {
    return { status: 'error', detail: `anonymous request failed: ${error instanceof Error ? error.message : String(error)}` }
  }
  if (response.status === 404) return { status: 'fail', detail: 'public resource returned HTTP 404' }
  if (!response.ok) return { status: 'error', detail: `public resource returned HTTP ${String(response.status)}` }
  try {
    return { status: 'pass', value: format === 'json' ? await response.json() : await response.text() }
  } catch {
    return { status: 'error', detail: `public resource did not contain valid ${format}` }
  }
}

async function textCheck(fetchImpl, id, url, markers) {
  const result = await request(fetchImpl, url, 'text')
  if (result.status !== 'pass') return { id, url, status: result.status, detail: result.detail }
  const missing = markers.filter(marker => !result.value.includes(marker))
  return missing.length === 0
    ? { id, url, status: 'pass', detail: `found all ${String(markers.length)} required public markers` }
    : { id, url, status: 'fail', detail: `public content is missing ${String(missing.length)} of ${String(markers.length)} required campaign markers` }
}

async function commitCheck(fetchImpl, id, repository, revision) {
  const url = `https://github.com/${repository}/commit/${revision}`
  const result = await request(fetchImpl, url, 'text')
  if (result.status !== 'pass') return { id, url, status: result.status, detail: result.detail }
  return result.value.includes(revision)
    ? { id, url, status: 'pass', detail: 'exact revision is anonymously readable from the public commit page' }
    : { id, url, status: 'fail', detail: 'public commit page did not identify the exact requested revision' }
}

async function campaignManifestCheck(fetchImpl, campaign) {
  const id = 'campaign-manifest'
  const url = `${RAW_MAIN}/PRIMARY-AT-CAMPAIGN.json`
  const result = await request(fetchImpl, url, 'text')
  if (result.status !== 'pass') return { id, url, status: result.status, detail: result.detail }
  let publicCampaign
  try {
    publicCampaign = JSON.parse(result.value)
  } catch {
    return { id, url, status: 'error', detail: 'public campaign manifest is not valid JSON' }
  }
  const matches = publicCampaign.protocol === campaign.protocol
    && publicCampaign.campaignId === campaign.campaignId
    && publicCampaign.candidate?.revision === campaign.candidate.revision
    && publicCampaign.lab?.revision === campaign.lab.revision
    && publicCampaign.automatedEvidence?.path === campaign.automatedEvidence?.path
    && publicCampaign.automatedEvidence?.dshRevision === campaign.candidate.revision
  return matches
    ? { id, url, status: 'pass', detail: 'public default-branch manifest pins the exact campaign and revisions' }
    : { id, url, status: 'fail', detail: 'public default-branch manifest is absent, stale, or pins different revisions' }
}

async function browserEvidenceCheck(fetchImpl, campaign) {
  const id = 'exact-candidate-browser-evidence'
  const url = `${RAW_MAIN}/${campaign.automatedEvidence.path}`
  const result = await request(fetchImpl, url, 'text')
  if (result.status !== 'pass') return { id, url, status: result.status, detail: result.detail }
  let report
  try {
    report = JSON.parse(result.value)
  } catch {
    return { id, url, status: 'error', detail: 'public automated-evidence report is not valid JSON' }
  }
  const limitations = Array.isArray(report.limitations) ? report.limitations.join(' ') : ''
  const matches = report.protocol === campaign.automatedEvidence.protocol
    && report.evidence === campaign.automatedEvidence.evidence
    && report.result === 'pass'
    && report.dsh?.revision === campaign.candidate.revision
    && report.dsh?.dirty === false
    && /not assistive-technology or disabled-user evidence/iu.test(limitations)
  return matches
    ? { id, url, status: 'pass', detail: 'public report passes on the exact clean candidate and retains its non-human boundary' }
    : { id, url, status: 'fail', detail: 'public automated-evidence report is absent, stale, dirty, non-passing, or missing its evidence boundary' }
}

function observedGate(id, declaredStatus, checks) {
  const observedStatus = checks.some(check => check.status === 'error')
    ? 'error'
    : checks.every(check => check.status === 'pass') ? 'ready' : 'missing'
  return {
    id,
    declaredStatus,
    observedStatus,
    manifestMatchesObservation: declaredStatus === observedStatus,
    checks,
  }
}

/**
 * Create a privacy-minimized observation report. Requests are deliberately anonymous:
 * no token, cookie, GitHub CLI session, or organization membership is used.
 */
export async function verifyPrimaryAtPublicReadiness(campaign, options = {}) {
  const { gates, expectedGateIds } = exactCampaign(campaign)
  const fetchImpl = options.fetch ?? globalThis.fetch
  if (typeof fetchImpl !== 'function') throw new Error('a Fetch-compatible implementation is required')
  const now = options.now ?? new Date()
  if (!(now instanceof Date) || Number.isNaN(now.getTime())) throw new Error('now must be a valid Date')

  const candidate = await commitCheck(fetchImpl, 'exact-core-revision', CORE_REPOSITORY, campaign.candidate.revision)
  const lab = await commitCheck(fetchImpl, 'exact-lab-revision', REPOSITORY, campaign.lab.revision)

  const defaultBranchChecks = await Promise.all([
    campaignManifestCheck(fetchImpl, campaign),
    browserEvidenceCheck(fetchImpl, campaign),
    textCheck(fetchImpl, 'campaign-guide-en', `${RAW_MAIN}/PRIMARY-AT-CAMPAIGN.md`, [
      campaign.candidate.revision,
      campaign.lab.revision,
      'pnpm run campaign:public:require',
    ]),
    textCheck(fetchImpl, 'campaign-guide-zh', `${RAW_MAIN}/PRIMARY-AT-CAMPAIGN.zh.md`, [
      campaign.candidate.revision,
      campaign.lab.revision,
      'pnpm run campaign:public:require',
    ]),
    textCheck(fetchImpl, 'core-lab-guide', `${RAW_MAIN}/AT-CORE-LAB.md`, [CORE_PROTOCOL, 'pnpm run lab:at:core']),
    textCheck(fetchImpl, 'at-form-en', `${RAW_MAIN}/.github/ISSUE_TEMPLATE/assistive-technology-test.yml`, [
      CORE_PROTOCOL,
      'A person directly operated the named assistive technology',
      'every AT modality you claim',
    ]),
    textCheck(fetchImpl, 'at-form-zh', `${RAW_MAIN}/.github/ISSUE_TEMPLATE/assistive-technology-test-zh.yml`, [
      CORE_PROTOCOL,
      '真人直接操作了具名辅助技术',
      '每种已声明辅助技术模态',
    ]),
    textCheck(fetchImpl, 'disabled-developer-form-en', `${RAW_MAIN}/.github/ISSUE_TEMPLATE/disabled-developer-task-result.yml`, [
      'disabled developer',
      '`a11y-user-validated`',
      'independently, effectively, and safely',
    ]),
    textCheck(fetchImpl, 'disabled-developer-form-zh', `${RAW_MAIN}/.github/ISSUE_TEMPLATE/disabled-developer-task-result-zh.yml`, [
      '残障开发者',
      '`a11y-user-validated`',
      '独立、有效、安全地完成',
    ]),
  ])

  const discussion = await textCheck(
    fetchImpl,
    'discussion-16-body',
    `https://github.com/${REPOSITORY}/discussions/16`,
    [campaign.candidate.revision, campaign.lab.revision, CORE_PROTOCOL, 'Do not begin until it says', 'zero human records'],
  )

  const issueChecks = await Promise.all([
    textCheck(fetchImpl, 'issue-1-nvda-body', `https://github.com/${REPOSITORY}/issues/1`, [
      campaign.candidate.revision,
      campaign.lab.revision,
      CORE_PROTOCOL,
      'physical Windows',
      'person directly operating and listening',
    ]),
    textCheck(fetchImpl, 'issue-2-voiceover-body', `https://github.com/${REPOSITORY}/issues/2`, [
      campaign.candidate.revision,
      campaign.lab.revision,
      CORE_PROTOCOL,
      'physical macOS',
      'person directly operating and listening',
    ]),
  ])

  const checksByGate = new Map([
    ['core-revision-public', [candidate]],
    ['lab-revision-public', [lab]],
    ['default-branch-intake', defaultBranchChecks],
    ['discussion-current', [discussion]],
    ['tracking-issues-current', issueChecks],
  ])
  const observedGates = expectedGateIds.map(id => observedGate(id, gates.get(id).status, checksByGate.get(id)))
  const readyToOpen = observedGates.every(gate => gate.observedStatus === 'ready')
  return {
    protocol: PRIMARY_AT_PUBLIC_READINESS_PROTOCOL,
    generatedAt: now.toISOString(),
    verdictScope: 'anonymous-public-availability-only-not-human-accessibility-evidence',
    campaign: {
      protocol: campaign.protocol,
      campaignId: campaign.campaignId,
      declaredStatus: campaign.status,
      candidateRevision: campaign.candidate.revision,
      labRevision: campaign.lab.revision,
      automatedEvidencePath: campaign.automatedEvidence.path,
    },
    anonymous: true,
    readyToOpen,
    observationComplete: observedGates.every(gate => gate.observedStatus !== 'error'),
    gates: observedGates,
  }
}
