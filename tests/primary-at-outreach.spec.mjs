import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'

const root = new URL('../', import.meta.url)
const outreachRoot = new URL('outreach/primary-at/', root)
const campaign = JSON.parse(readFileSync(new URL('PRIMARY-AT-CAMPAIGN.json', root), 'utf8'))
const catalog = JSON.parse(readFileSync(new URL('EVIDENCE-CATALOG.json', root), 'utf8'))
const coreScenario = catalog.scenarios.find(row => row.protocol === 'dsh-core-at-lab/1.0.0-draft')
const claimEligibleCoreTasks = coreScenario.tasks.filter(task => task.claimEligible).map(task => task.id)

function outreach(file) {
  return readFileSync(new URL(file, outreachRoot), 'utf8')
}

const publicBodies = [
  'discussion-16.md',
  'issue-1-nvda.md',
  'issue-2-voiceover.md',
  'default-branch-pr.md',
]

describe('primary AT public outreach handoff', () => {
  it.each(publicBodies)('%s stays bound to the exact campaign and contains no ephemeral secret', (file) => {
    const body = outreach(file)
    expect(body).toContain(campaign.candidate.revision)
    expect(body).toContain(campaign.lab.revision)
    expect(body).toContain('dsh-core-at-lab/1.0.0-draft')
    expect(body).not.toMatch(/[?&](?:token|access_token|key|secret)=/iu)
    expect(body).not.toMatch(/gh[opusr]_[A-Za-z0-9]{20,}/u)
    expect(body).not.toMatch(/npm_[A-Za-z0-9]{20,}/u)
    expect(body).not.toContain('0.1.1-rc.2')
  })

  it.each(['issue-1-nvda.md', 'issue-2-voiceover.md'])(
    '%s requests the complete claim-eligible core task inventory and direct human evidence',
    (file) => {
      const body = outreach(file)
      for (const taskId of claimEligibleCoreTasks) expect(body).toContain(`\`${taskId}\``)
      const taskInventory = body.slice(
        body.indexOf('Record these nine claim-eligible task IDs'),
        body.indexOf('## Required observation'),
      )
      expect((taskInventory.match(/^- `/gmu) ?? [])).toHaveLength(claimEligibleCoreTasks.length)
      expect(body).toMatch(/person directly operating and listening/)
      expect(body).toMatch(/independent\/effective\/safe completion/)
      expect(body).toMatch(/directly observed on every claimed task/)
      expect(body).toMatch(/Partial and failed results remain `claim: none`/)
      expect(body).toMatch(/does not establish .* whole-product support/)
    },
  )

  it('routes the NVDA and VoiceOver issues to their exact physical environments', () => {
    const nvda = outreach('issue-1-nvda.md')
    expect(nvda).toContain('physical Windows')
    expect(nvda).toContain('NVDA and Chrome')
    expect(nvda).toContain('lab:at:core ../deepseek-harness chrome')

    const voiceOver = outreach('issue-2-voiceover.md')
    expect(voiceOver).toContain('physical macOS')
    expect(voiceOver).toContain('VoiceOver and Safari')
    expect(voiceOver).toContain('lab:at:core ../deepseek-harness safari')
  })

  it('keeps Discussion 16 bilingual, status-gated, and connected to both intake routes', () => {
    const discussion = outreach('discussion-16.md')
    expect(discussion).toContain('Do not begin until it says `open`')
    expect(discussion).toContain('只有状态变为 `open` 才开始')
    expect(discussion).toContain('assistive-technology-test.yml')
    expect(discussion).toContain('assistive-technology-test-zh.yml')
    expect(discussion).toContain('disabled-developer-task-result.yml')
    expect(discussion).toContain('disabled-developer-task-result-zh.yml')
    expect(discussion).toMatch(/zero human records/)
    expect(discussion).toMatch(/not human evidence/)
  })

  it('requires public availability before opening and preserves historical threads', () => {
    const handoff = outreach('README.md')
    expect(handoff).toContain('GitHub Issue forms are not available from a feature branch')
    expect(handoff).toContain('edit the bodies rather than closing and recreating the threads')
    expect(handoff).toContain('Change all five `availabilityGates` rows to `ready`')
    expect(handoff).toContain('change campaign status to `open`')
    expect(handoff).toContain('Zero human records is the correct starting state')
    expect(handoff).toContain('campaign:publish:require')
    expect(handoff).toContain('never pushes, merges, edits a thread, opens recruitment, or creates human evidence')
  })

  it('gives the default-branch review an evidence-backed, non-claim checklist', () => {
    const pullRequest = outreach('default-branch-pr.md')
    expect(pullRequest).toContain('221 tests passed')
    expect(pullRequest).toContain('all 26 aggregate requirements missing')
    expect(pullRequest).toContain('prepared-not-open')
    expect(pullRequest).toContain('does not add a human result or accessibility support claim')
    expect(pullRequest).toContain('Campaign schema rejects `open`')
    expect(pullRequest).toContain('Anonymous public-readiness verification')
    expect(pullRequest).toContain('Exact DSH `5803bfcfdd` browser evidence')
  })
})
