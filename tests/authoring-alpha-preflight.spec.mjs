import { readFile } from 'node:fs/promises'
import Ajv2020 from 'ajv/dist/2020.js'
import addFormats from 'ajv-formats'
import { describe, expect, it } from 'vitest'
import {
  AUTHORING_ALPHA_PREFLIGHT_PROTOCOL,
  buildAuthoringPublicationLayers,
  classifyGitHubRepository,
  classifyNpmAuthentication,
  classifyNpmVersionLookup,
  classifyRemoteRevision,
} from '../scripts/authoring-alpha-preflight-lib.mjs'

const publication = { visibility: 'public', branch: 'main' }

describe('authoring alpha release preflight', () => {
  it('derives stable dependency-first publication layers from the policy', async () => {
    const policy = JSON.parse(await readFile(new URL('../AUTHORING-PACKAGES.json', import.meta.url), 'utf8'))
    expect(buildAuthoringPublicationLayers(policy.packages)).toEqual([
      ['@oh-my-dsh/dsh-a11y-testkit'],
      ['@oh-my-dsh/dsh-a11y-authoring'],
      ['@oh-my-dsh/dsh-a11y-page-provider', '@oh-my-dsh/dsh-a11y-loopback-provider'],
      ['@oh-my-dsh/dsh-a11y-local-preview', '@oh-my-dsh/dsh-a11y-caller-page'],
    ])
  })

  it('rejects unknown dependencies, duplicates, and cycles', () => {
    const base = { version: '0.1.0-alpha.0', publication: {}, role: 'fixture' }
    expect(() => buildAuthoringPublicationLayers([
      { ...base, name: 'a', internalDependencies: { missing: '0.1.0-alpha.0' } },
    ])).toThrow('unknown authoring package')
    expect(() => buildAuthoringPublicationLayers([
      { ...base, name: 'a', internalDependencies: {} },
      { ...base, name: 'a', internalDependencies: {} },
    ])).toThrow('duplicate package')
    expect(() => buildAuthoringPublicationLayers([
      { ...base, name: 'a', internalDependencies: { b: '0.1.0-alpha.0' } },
      { ...base, name: 'b', internalDependencies: { a: '0.1.0-alpha.0' } },
    ])).toThrow('contains a cycle')
  })

  it('distinguishes registry availability, conflicts, and lookup failures', () => {
    expect(classifyNpmVersionLookup(1, JSON.stringify({ error: { code: 'E404' } }), '0.1.0-alpha.0'))
      .toBe('available')
    expect(classifyNpmVersionLookup(0, JSON.stringify('0.1.0-alpha.0'), '0.1.0-alpha.0'))
      .toBe('already-exists')
    expect(classifyNpmVersionLookup(1, JSON.stringify({ error: { code: 'E401' } }), '0.1.0-alpha.0'))
      .toBe('unknown')
  })

  it('retains only bounded npm, GitHub, and remote states', () => {
    expect(classifyNpmAuthentication(0, JSON.stringify('publisher'))).toBe('available')
    expect(classifyNpmAuthentication(1, JSON.stringify({ error: { code: 'E401' } }))).toBe('missing')
    expect(classifyGitHubRepository(1, JSON.stringify({ status: '404' }), publication)).toEqual({ state: 'missing' })
    expect(classifyGitHubRepository(0, JSON.stringify({
      visibility: 'public', default_branch: 'main', archived: false,
    }), publication)).toEqual({
      state: 'ready', visibility: 'public', defaultBranch: 'main', archived: false,
    })
    expect(classifyGitHubRepository(0, JSON.stringify({
      visibility: 'private', default_branch: 'main', archived: false,
    }), publication).state).toBe('mismatch')
    expect(classifyRemoteRevision(0, `${'a'.repeat(40)}\trefs/heads/main\n`, 'a'.repeat(40))).toBe('matches')
    expect(classifyRemoteRevision(0, '', 'a'.repeat(40))).toBe('missing')
    expect(classifyRemoteRevision(1, '', 'a'.repeat(40))).toBe('unknown')
  })

  it('ships a schema that separates release state from accessibility evidence', async () => {
    const schema = JSON.parse(await readFile(new URL('../AUTHORING-ALPHA-PREFLIGHT.schema.json', import.meta.url), 'utf8'))
    const ajv = new Ajv2020({ allErrors: true, strict: true })
    addFormats(ajv)
    const validate = ajv.compile(schema)
    const packageRecord = (name) => ({
      name,
      version: '0.1.0-alpha.0',
      role: 'fixture',
      revision: 'a'.repeat(40),
      source: {
        clean: true,
        originConfigured: false,
        originMatchesPolicy: false,
        remoteRevision: 'unchecked',
      },
      github: { state: 'missing' },
      registryVersion: 'available',
      tarball: {
        integrity: 'sha512-YWJjZA==',
        filename: `oh-my-dsh-${name.replace('@oh-my-dsh/', '')}-0.1.0-alpha.0.tgz`,
      },
      readinessBlockers: ['source.origin-remote-missing'],
    })
    const names = [
      '@oh-my-dsh/dsh-a11y-testkit',
      '@oh-my-dsh/dsh-a11y-authoring',
      '@oh-my-dsh/dsh-a11y-page-provider',
      '@oh-my-dsh/dsh-a11y-loopback-provider',
      '@oh-my-dsh/dsh-a11y-local-preview',
      '@oh-my-dsh/dsh-a11y-caller-page',
    ]
    const sample = {
      protocol: AUTHORING_ALPHA_PREFLIGHT_PROTOCOL,
      generatedAt: '2026-08-31T00:00:00.000Z',
      evidence: 'release-preflight-only-no-publish-no-accessibility-claim',
      result: 'blocked',
      lab: { package: '@oh-my-dsh/dsh-accessibility', version: '0.1.0-beta.6', revision: 'b'.repeat(40) },
      npm: { registry: 'https://registry.npmjs.org', authentication: 'missing', distTag: 'alpha' },
      publicationLayers: [[names[0]], [names[1]], [names[2], names[3]], [names[4], names[5]]],
      packages: names.map(packageRecord),
      blockerCount: 1,
      blockers: ['npm.authentication-missing'],
      limitations: ['one', 'two', 'not accessibility evidence'],
    }
    expect(schema.properties.protocol.const).toBe(AUTHORING_ALPHA_PREFLIGHT_PROTOCOL)
    expect(validate(sample), ajv.errorsText(validate.errors)).toBe(true)
    expect(sample.evidence).toContain('no-accessibility-claim')
  })

  it('keeps the runner read-only toward GitHub, Git, and npm publication state', async () => {
    const source = await readFile(new URL('../scripts/run-authoring-alpha-preflight.mjs', import.meta.url), 'utf8')
    expect(source).toContain("command('npm', ['whoami'")
    expect(source).toContain("'view', `${spec.name}@${spec.version}`")
    expect(source).toContain("command('gh', [")
    expect(source).toContain("'api', `repos/${githubPath(spec.publication)}`")
    expect(source).toContain("'ls-remote', 'origin'")
    expect(source).toContain('packAuthoringPackages(policy, workspaceRoot, temporaryRoot)')
    expect(source).not.toContain("'publish'")
    expect(source).not.toContain("'push'")
    expect(source).not.toContain("'tag'")
    expect(source).not.toContain("'repo', 'create'")
  })
})

