import { readFileSync } from 'node:fs'
import { spawnSync } from 'node:child_process'
import Ajv2020 from 'ajv/dist/2020.js'
import addFormats from 'ajv-formats'
import { describe, expect, it } from 'vitest'
import {
  PRIMARY_AT_PUBLIC_READINESS_PROTOCOL,
  verifyPrimaryAtPublicReadiness,
} from '../scripts/primary-at-public-readiness-lib.mjs'

const root = new URL('../', import.meta.url)
const campaign = JSON.parse(readFileSync(new URL('PRIMARY-AT-CAMPAIGN.json', root), 'utf8'))
const schema = JSON.parse(readFileSync(new URL('PRIMARY-AT-PUBLIC-READINESS.schema.json', root), 'utf8'))
const now = new Date('2026-08-31T12:00:00.000Z')

function successfulPublicFetch(overrides = new Map()) {
  return async (url, options) => {
    expect(options.headers).not.toHaveProperty('Authorization')
    expect(options).not.toHaveProperty('credentials')
    if (overrides.has(url)) return overrides.get(url)
    if (url.includes('/commit/')) {
      const sha = url.split('/').at(-1)
      return new Response(`public commit ${sha}`)
    }
    if (url.endsWith('/PRIMARY-AT-CAMPAIGN.json')) return new Response(JSON.stringify(campaign))
    if (url.endsWith('/PRIMARY-AT-CAMPAIGN.md') || url.endsWith('/PRIMARY-AT-CAMPAIGN.zh.md')) {
      return new Response(`${campaign.candidate.revision}\n${campaign.lab.revision}\npnpm run campaign:public:require`)
    }
    if (url.endsWith('/AT-CORE-LAB.md')) return new Response('dsh-core-at-lab/1.0.0-draft\npnpm run lab:at:core')
    if (url.endsWith('/assistive-technology-test.yml')) {
      return new Response('dsh-core-at-lab/1.0.0-draft\nA person directly operated the named assistive technology\nevery AT modality you claim')
    }
    if (url.endsWith('/assistive-technology-test-zh.yml')) {
      return new Response('dsh-core-at-lab/1.0.0-draft\n真人直接操作了具名辅助技术\n每种已声明辅助技术模态')
    }
    if (url.endsWith('/disabled-developer-task-result.yml')) {
      return new Response('disabled developer\n`a11y-user-validated`\nindependently, effectively, and safely')
    }
    if (url.endsWith('/disabled-developer-task-result-zh.yml')) {
      return new Response('残障开发者\n`a11y-user-validated`\n独立、有效、安全地完成')
    }
    if (url.includes('/discussions/16')) {
      return new Response(`${campaign.candidate.revision} ${campaign.lab.revision} dsh-core-at-lab/1.0.0-draft Do not begin until it says open zero human records`)
    }
    if (url.endsWith('/issues/1')) {
      return new Response(`${campaign.candidate.revision} ${campaign.lab.revision} dsh-core-at-lab/1.0.0-draft physical Windows person directly operating and listening`)
    }
    if (url.endsWith('/issues/2')) {
      return new Response(`${campaign.candidate.revision} ${campaign.lab.revision} dsh-core-at-lab/1.0.0-draft physical macOS person directly operating and listening`)
    }
    throw new Error(`unexpected URL: ${url}`)
  }
}

describe('anonymous primary AT public readiness', () => {
  it('observes all five gates without credentials and emits a schema-valid non-evidence report', async () => {
    const report = await verifyPrimaryAtPublicReadiness(campaign, { fetch: successfulPublicFetch(), now })
    expect(report).toMatchObject({
      protocol: PRIMARY_AT_PUBLIC_READINESS_PROTOCOL,
      anonymous: true,
      readyToOpen: true,
      observationComplete: true,
      verdictScope: 'anonymous-public-availability-only-not-human-accessibility-evidence',
    })
    expect(report.gates).toHaveLength(5)
    expect(report.gates.every(gate => gate.observedStatus === 'ready')).toBe(true)
    expect(report.gates.every(gate => gate.manifestMatchesObservation === false)).toBe(true)
    const ajv = new Ajv2020({ allErrors: true, strict: true })
    addFormats(ajv)
    const validate = ajv.compile(schema)
    expect(validate(report), ajv.errorsText(validate.errors)).toBe(true)

    const impossible = structuredClone(report)
    impossible.gates[0].observedStatus = 'missing'
    expect(validate(impossible)).toBe(false)
  })

  it('accepts the exact checked-in default-branch and outreach handoff bodies', async () => {
    const fetch = async (url) => {
      if (url.includes('/commit/')) return new Response(`public commit ${url.split('/').at(-1)}`)
      const rawPrefix = 'https://raw.githubusercontent.com/omdsh-dev/dsh-accessibility/main/'
      if (url.startsWith(rawPrefix)) return new Response(readFileSync(new URL(url.slice(rawPrefix.length), root), 'utf8'))
      if (url.endsWith('/discussions/16')) {
        return new Response(readFileSync(new URL('outreach/primary-at/discussion-16.md', root), 'utf8'))
      }
      if (url.endsWith('/issues/1')) {
        return new Response(readFileSync(new URL('outreach/primary-at/issue-1-nvda.md', root), 'utf8'))
      }
      if (url.endsWith('/issues/2')) {
        return new Response(readFileSync(new URL('outreach/primary-at/issue-2-voiceover.md', root), 'utf8'))
      }
      throw new Error(`unexpected URL: ${url}`)
    }
    const report = await verifyPrimaryAtPublicReadiness(campaign, { fetch, now })
    expect(report).toMatchObject({ readyToOpen: true, observationComplete: true })
    expect(report.gates.every(gate => gate.observedStatus === 'ready')).toBe(true)
  })

  it('fails closed on stale content, unavailable revisions, and observation errors', async () => {
    const stale = new Map([
      [`https://github.com/omdsh-dev/deepseek-harness/commit/${campaign.candidate.revision}`, new Response('', { status: 404 })],
      ['https://github.com/omdsh-dev/dsh-accessibility/discussions/16', new Response('superseded campaign')],
      ['https://github.com/omdsh-dev/dsh-accessibility/issues/2', new Response('', { status: 503 })],
    ])
    const report = await verifyPrimaryAtPublicReadiness(campaign, { fetch: successfulPublicFetch(stale), now })
    expect(report).toMatchObject({ readyToOpen: false, observationComplete: false })
    expect(report.gates.find(gate => gate.id === 'core-revision-public').observedStatus).toBe('missing')
    expect(report.gates.find(gate => gate.id === 'discussion-current').observedStatus).toBe('missing')
    expect(report.gates.find(gate => gate.id === 'tracking-issues-current').observedStatus).toBe('error')
  })

  it('rejects an incomplete campaign gate inventory before making a request', async () => {
    const invalid = structuredClone(campaign)
    invalid.availabilityGates.pop()
    let requested = false
    await expect(verifyPrimaryAtPublicReadiness(invalid, { fetch: async () => { requested = true } }))
      .rejects.toThrow(/exactly these public gates/)
    expect(requested).toBe(false)
  })

  it('ships a strict CLI mode and rejects unknown arguments without making a request', () => {
    const packageManifest = JSON.parse(readFileSync(new URL('package.json', root), 'utf8'))
    expect(packageManifest.scripts['campaign:public:verify']).toContain('verify-primary-at-campaign-public.mjs')
    expect(packageManifest.scripts['campaign:public:require']).toContain('--require-openable')
    expect(packageManifest.files).toContain('PRIMARY-AT-PUBLIC-READINESS.schema.json')

    const cli = spawnSync(process.execPath, ['scripts/verify-primary-at-campaign-public.mjs', '--unknown'], {
      cwd: new URL('.', root),
      encoding: 'utf8',
    })
    expect(cli.status).toBe(2)
    expect(cli.stderr).toContain('Unknown argument')
    expect(cli.stdout).toBe('')
  })
})
