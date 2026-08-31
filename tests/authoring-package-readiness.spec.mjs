import { readFile } from 'node:fs/promises'
import Ajv2020 from 'ajv/dist/2020.js'
import { describe, expect, it } from 'vitest'
import {
  AUTHORING_PACKAGE_READINESS_PROTOCOL,
  AUTHORING_PACKAGE_VERDICT_SCOPE,
  buildAuthoringPackageReadinessReport,
  evaluateAuthoringPackageManifest
} from '../scripts/authoring-package-readiness-lib.mjs'

const spec = {
  directory: 'dsh-a11y-example',
  name: '@oh-my-dsh/dsh-a11y-example',
  version: '0.1.0-alpha.0',
  role: 'test fixture',
  internalDependencies: { '@oh-my-dsh/dsh-a11y-testkit': '0.1.0-alpha.0' }
}

function publishableManifest() {
  return {
    name: spec.name,
    version: spec.version,
    private: false,
    type: 'module',
    license: 'MIT',
    repository: { type: 'git', url: 'git+https://github.com/omdsh-dev/dsh-a11y-example.git' },
    homepage: 'https://github.com/omdsh-dev/dsh-a11y-example#readme',
    bugs: { url: 'https://github.com/omdsh-dev/dsh-a11y-example/issues' },
    publishConfig: { access: 'public' },
    engines: { node: '>=22' },
    packageManager: 'pnpm@11.7.0',
    files: ['README.md', 'README.zh.md', 'SECURITY.md', 'LICENSE'],
    scripts: {
      clean: 'node scripts/clean.mjs',
      build: 'tsc',
      typecheck: 'tsc --noEmit',
      test: 'vitest run',
      'test:coverage': 'vitest run --coverage',
      prepack: 'pnpm run build'
    },
    dependencies: { '@oh-my-dsh/dsh-a11y-testkit': '0.1.0-alpha.0' }
  }
}

describe('authoring package publication readiness', () => {
  it('accepts only an exact, independently installable package manifest', () => {
    expect(evaluateAuthoringPackageManifest(publishableManifest(), spec)).toEqual([])
  })

  it('rejects private packages and source-local dependency protocols', () => {
    const manifest = publishableManifest()
    manifest.private = true
    manifest.dependencies['@oh-my-dsh/dsh-a11y-testkit'] = 'file:../dsh-a11y-testkit'
    expect(evaluateAuthoringPackageManifest(manifest, spec)).toEqual(expect.arrayContaining([
      'publication.private-must-be-false',
      'dependencies.@oh-my-dsh/dsh-a11y-testkit-must-be-0.1.0-alpha.0',
      'dependencies.@oh-my-dsh/dsh-a11y-testkit-must-not-use-local-protocol'
    ]))
  })

  it('keeps publication readiness separate from accessibility claims', () => {
    const report = buildAuthoringPackageReadinessReport(
      { protocol: AUTHORING_PACKAGE_READINESS_PROTOCOL },
      [{ ...spec, source: { revision: 'a'.repeat(40), clean: true, originConfigured: true }, blockers: [] }],
      '2026-08-31T00:00:00.000Z'
    )
    expect(report.publishable).toBe(true)
    expect(report.verdictScope).toBe(AUTHORING_PACKAGE_VERDICT_SCOPE)
    expect(report.limitations.join(' ')).toMatch(/not WCAG conformance/iu)
  })

  it('pins the complete six-package dependency graph', async () => {
    const policy = JSON.parse(await readFile(new URL('../AUTHORING-PACKAGES.json', import.meta.url), 'utf8'))
    const schema = JSON.parse(await readFile(new URL('../AUTHORING-PACKAGES.schema.json', import.meta.url), 'utf8'))
    const validate = new Ajv2020({ allErrors: true, strict: true }).compile(schema)
    expect(validate(policy), JSON.stringify(validate.errors)).toBe(true)
    expect(policy.protocol).toBe(AUTHORING_PACKAGE_READINESS_PROTOCOL)
    expect(policy.packages).toHaveLength(6)
    expect(new Set(policy.packages.map(item => item.name)).size).toBe(6)
    const known = new Set(policy.packages.map(item => item.name))
    for (const item of policy.packages) {
      expect(Object.keys(item.internalDependencies).every(name => known.has(name))).toBe(true)
    }
  })
})
