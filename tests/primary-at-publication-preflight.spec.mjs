import { readFileSync } from 'node:fs'
import Ajv2020 from 'ajv/dist/2020.js'
import addFormats from 'ajv-formats'
import { describe, expect, it } from 'vitest'
import {
  createPrimaryAtPublicationPreflight,
  PRIMARY_AT_PUBLICATION_FILES,
  PRIMARY_AT_PUBLICATION_PREFLIGHT_PROTOCOL,
} from '../scripts/primary-at-publication-preflight-lib.mjs'

const campaign = JSON.parse(readFileSync(new URL('../PRIMARY-AT-CAMPAIGN.json', import.meta.url), 'utf8'))
const gateIds = [
  'core-revision-public',
  'lab-revision-public',
  'default-branch-intake',
  'discussion-current',
  'tracking-issues-current',
]

function publicObservation(ready = []) {
  return {
    protocol: 'dsh-a11y-primary-at-public-readiness/0.1.0-draft',
    observationComplete: true,
    readyToOpen: ready.length === gateIds.length,
    gates: gateIds.map(id => ({ id, observedStatus: ready.includes(id) ? 'ready' : 'missing' })),
  }
}

function input(overrides = {}) {
  return {
    campaign,
    now: new Date('2026-08-31T12:00:00.000Z'),
    core: {
      repository: campaign.candidate.repository,
      branch: 'feat/a11y-core-0.1.2-alpha.2',
      headRevision: campaign.candidate.revision,
      requiredRevision: campaign.candidate.revision,
      clean: true,
      containsRequiredRevision: true,
      remoteMatches: true,
      matchingRemoteNames: ['omdsh'],
    },
    lab: {
      repository: campaign.lab.repository,
      branch: 'feat/hermetic-at-lab',
      headRevision: 'f'.repeat(40),
      requiredRevision: campaign.lab.revision,
      clean: true,
      containsRequiredRevision: true,
      remoteMatches: true,
      matchingRemoteNames: ['origin'],
    },
    labTrackedFiles: [...PRIMARY_AT_PUBLICATION_FILES, campaign.automatedEvidence.path],
    publicObservation: publicObservation(),
    ...overrides,
  }
}

describe('primary AT publication preflight', () => {
  it('reports clean exact local sources as ready without claiming publication', () => {
    const report = createPrimaryAtPublicationPreflight(input())
    expect(report.protocol).toBe(PRIMARY_AT_PUBLICATION_PREFLIGHT_PROTOCOL)
    expect(report.localReady).toBe(true)
    expect(report.handoff).toEqual({
      requiredFileCount: PRIMARY_AT_PUBLICATION_FILES.length + 1,
      trackedFileCount: PRIMARY_AT_PUBLICATION_FILES.length + 1,
      missingFiles: [],
    })
    expect(report.actions.map(({ id, status }) => [id, status])).toEqual([
      ['publish-core-revision', 'ready'],
      ['publish-lab-branch', 'ready'],
      ['merge-default-branch-intake', 'blocked'],
      ['update-discussion-16', 'blocked'],
      ['update-tracking-issues', 'blocked'],
      ['open-campaign', 'blocked'],
    ])
    expect(report.limitations.join(' ')).toMatch(/read-only.*does not push.*not assistive-technology evidence/iu)
  })

  it('fails local readiness for dirty, misdirected, or incomplete sources', () => {
    const base = input()
    const report = createPrimaryAtPublicationPreflight(input({
      core: { ...base.core, clean: false },
      lab: { ...base.lab, remoteMatches: false, matchingRemoteNames: [] },
      labTrackedFiles: base.labTrackedFiles.filter(file => file !== 'PRIMARY-AT-CAMPAIGN.md'),
    }))
    expect(report.localReady).toBe(false)
    expect(report.handoff.missingFiles).toEqual(['PRIMARY-AT-CAMPAIGN.md'])
    expect(report.checks.filter(item => item.status === 'fail').map(item => item.id)).toEqual([
      'core-worktree-clean',
      'lab-public-remote',
      'publication-files-committed',
    ])
    expect(report.actions.slice(0, 2).every(item => item.status === 'blocked')).toBe(true)
  })

  it('unlocks each external action only after its public prerequisites are observed', () => {
    const revisions = ['core-revision-public', 'lab-revision-public']
    const afterRevisions = createPrimaryAtPublicationPreflight(input({ publicObservation: publicObservation(revisions) }))
    expect(afterRevisions.actions.find(item => item.id === 'merge-default-branch-intake')?.status).toBe('ready')
    expect(afterRevisions.actions.find(item => item.id === 'update-discussion-16')?.status).toBe('blocked')

    const all = createPrimaryAtPublicationPreflight(input({ publicObservation: publicObservation(gateIds) }))
    expect(all.publicObservation).toMatchObject({ readyToOpen: true, missingGates: [] })
    expect(all.actions.find(item => item.id === 'open-campaign')?.status).toBe('ready')
  })

  it('validates a real report against the public schema', () => {
    const schema = JSON.parse(readFileSync(new URL('../PRIMARY-AT-PUBLICATION-PREFLIGHT.schema.json', import.meta.url), 'utf8'))
    const ajv = new Ajv2020({ allErrors: true, strict: true })
    addFormats(ajv)
    const validate = ajv.compile(schema)
    const report = createPrimaryAtPublicationPreflight(input())
    expect(validate(report), JSON.stringify(validate.errors)).toBe(true)
  })
})
