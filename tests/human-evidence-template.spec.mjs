import { mkdtemp, readFile, rm, stat } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { spawnSync } from 'node:child_process'
import { describe, expect, it } from 'vitest'
import { DEFAULT_EVIDENCE_CATALOG } from '../scripts/evidence-catalog-lib.mjs'
import { createHumanEvidenceTemplate } from '../scripts/human-evidence-template-lib.mjs'
import { validateHumanEvidenceRecord } from '../scripts/human-evidence-lib.mjs'

const cli = new URL('../scripts/create-human-evidence-template.mjs', import.meta.url)
const baseArguments = [
  '--protocol', 'dsh-core-at-lab/1.0.0-draft',
  '--tasks', 'representative-core',
  '--kind', 'disabled-user-task-run',
  '--locale', 'zh-CN',
]

describe('human-evidence template scaffolding', () => {
  it('ships the scaffold command and its pure generator in the npm package boundary', async () => {
    const manifest = JSON.parse(await readFile(new URL('../package.json', import.meta.url), 'utf8'))
    expect(manifest.scripts['evidence:scaffold']).toBe('node scripts/create-human-evidence-template.mjs')
    expect(manifest.files).toEqual(expect.arrayContaining([
      'COMMUNITY-VALIDATION.md',
      'COMMUNITY-VALIDATION.zh.md',
      'scripts/human-evidence-template-lib.mjs',
      'scripts/create-human-evidence-template.mjs',
    ]))
  })

  it.each(DEFAULT_EVIDENCE_CATALOG.scenarios)('creates a validator-clean claim-none template for $protocol', (scenario) => {
    const record = createHumanEvidenceTemplate({
      protocol: scenario.protocol,
      tasks: 'claim-eligible',
      evidenceKind: 'assistive-technology-run',
      locale: 'en-US',
    })

    expect(validateHumanEvidenceRecord(record, { now: new Date('2000-01-01T00:00:00.000Z') }))
      .toMatchObject({ valid: true, recordType: 'template', claim: 'none' })
    expect(record.scenario.taskIds).toEqual(
      scenario.tasks.filter(task => task.claimEligible).map(task => task.id),
    )
    expect(record.consent).toMatchObject({ affirmative: false, publicDeidentifiedSummary: false })
    expect(record.review.status).toBe('template')
  })

  it('creates one disabled-developer template with every catalog-owned representative task and no invented AT', () => {
    const record = createHumanEvidenceTemplate({
      protocol: 'dsh-core-at-lab/1.0.0-draft',
      tasks: 'representative-core',
      evidenceKind: 'disabled-user-task-run',
      locale: 'zh-CN',
    })

    expect(record.scenario.taskIds).toEqual([
      'navigate-sessions',
      'search-sessions',
      'switch-session-view',
      'read-conversation',
      'inspect-trajectory',
      'configure-settings',
      'edit-composer-draft',
    ])
    expect(record.environment.accessTechnologies).toEqual([])
    expect(record.tester.category).toBe('disabled-developer')
    expect(record.tasks.every(task => task.outcome === 'not-run')).toBe(true)
  })

  it('accepts explicit task ids but preserves authoritative catalog order', () => {
    const record = createHumanEvidenceTemplate({
      protocol: 'dsh-a11y-authoring-at-lab/0.1.0-draft',
      tasks: 'reject,allow-once',
      evidenceKind: 'assistive-technology-run',
      locale: 'en-US',
    })
    expect(record.scenario.taskIds).toEqual(['allow-once', 'reject'])
  })

  it.each([
    [{ protocol: 'missing/1.0.0', tasks: 'all', evidenceKind: 'assistive-technology-run', locale: 'en-US' }, /unknown versioned evidence protocol/],
    [{ protocol: 'dsh-core-at-lab/1.0.0-draft', tasks: 'missing-task', evidenceKind: 'assistive-technology-run', locale: 'en-US' }, /unknown task ids/],
    [{ protocol: 'dsh-core-at-lab/1.0.0-draft', tasks: 'navigate-sessions,navigate-sessions', evidenceKind: 'assistive-technology-run', locale: 'en-US' }, /duplicate task ids/],
    [{ protocol: 'dsh-core-at-lab/1.0.0-draft', tasks: 'safety-critical', evidenceKind: 'assistive-technology-run', locale: 'en-US' }, /matched no tasks/],
    [{ protocol: 'dsh-core-at-lab/1.0.0-draft', tasks: 'all', evidenceKind: 'automated-run', locale: 'en-US' }, /evidence kind/],
    [{ protocol: 'dsh-core-at-lab/1.0.0-draft', tasks: 'all', evidenceKind: 'assistive-technology-run', locale: 'latest' }, /locale/],
  ])('rejects unsafe or unknown options', (options, expected) => {
    expect(() => createHumanEvidenceTemplate(options)).toThrow(expected)
  })

  it('prints clean JSON to stdout while keeping the non-claim warning on stderr', () => {
    const result = spawnSync(process.execPath, [cli.pathname, ...baseArguments], { encoding: 'utf8' })
    expect(result.status, result.stderr).toBe(0)
    expect(JSON.parse(result.stdout)).toMatchObject({
      recordType: 'template',
      evidenceKind: 'disabled-user-task-run',
      claim: 'none',
    })
    expect(result.stderr).toContain('no human result or support claim was created')
  })

  it('writes only a new JSON file with private permissions and refuses overwrite', async () => {
    const temporaryRoot = await mkdtemp(join(tmpdir(), 'dsh-evidence-template-test-'))
    const output = join(temporaryRoot, 'draft.json')
    try {
      const first = spawnSync(process.execPath, [cli.pathname, ...baseArguments, '--output', output], {
        encoding: 'utf8',
      })
      expect(first.status, first.stderr).toBe(0)
      expect(JSON.parse(await readFile(output, 'utf8'))).toMatchObject({ claim: 'none' })
      if (process.platform !== 'win32') expect((await stat(output)).mode & 0o077).toBe(0)

      const second = spawnSync(process.execPath, [cli.pathname, ...baseArguments, '--output', output], {
        encoding: 'utf8',
      })
      expect(second.status).not.toBe(0)
      expect(second.stderr).toMatch(/EEXIST|file already exists/)
    } finally {
      await rm(temporaryRoot, { recursive: true, force: true })
    }
  })
})
