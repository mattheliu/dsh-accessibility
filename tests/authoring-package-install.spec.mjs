import { describe, expect, it } from 'vitest'
import {
  buildAuthoringPackageInstallReport,
  evaluateAuthoringPackageDependencyGraph
} from '../scripts/authoring-package-readiness-lib.mjs'

const spec = {
  name: '@oh-my-dsh/dsh-a11y-composition',
  version: '0.1.0-alpha.0',
  internalDependencies: { '@oh-my-dsh/dsh-a11y-testkit': '0.1.0-alpha.0' }
}

describe('authoring package isolated install evidence', () => {
  it('allows a private prerelease source only when its packed dependency graph is registry-independent', () => {
    const manifest = {
      name: spec.name,
      version: spec.version,
      private: true,
      dependencies: { '@oh-my-dsh/dsh-a11y-testkit': '0.1.0-alpha.0' }
    }
    expect(evaluateAuthoringPackageDependencyGraph(manifest, spec)).toEqual([])
    manifest.dependencies['@oh-my-dsh/dsh-a11y-testkit'] = 'file:../dsh-a11y-testkit'
    expect(evaluateAuthoringPackageDependencyGraph(manifest, spec)).toEqual(expect.arrayContaining([
      'dependencies.@oh-my-dsh/dsh-a11y-testkit-must-be-0.1.0-alpha.0',
      'dependencies.@oh-my-dsh/dsh-a11y-testkit-must-not-use-local-protocol'
    ]))
  })

  it('labels isolated installation separately from npm and human evidence', () => {
    const packages = [{
      name: spec.name,
      version: spec.version,
      revision: 'a'.repeat(40),
      integrity: 'sha512-example',
      filename: 'example.tgz'
    }]
    const report = buildAuthoringPackageInstallReport(packages, '2026-08-31T00:00:00.000Z')
    expect(report.result).toBe('pass')
    expect(report.evidence).toBe('automated-isolated-tarball-install-not-at-evidence')
    expect(report.limitations.join(' ')).toMatch(/not publication to or availability from npm/iu)
    expect(report.limitations.join(' ')).toMatch(/not WCAG conformance/iu)
  })
})
