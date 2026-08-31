import { execFile as execFileCallback } from 'node:child_process'
import { readFile } from 'node:fs/promises'
import { resolve } from 'node:path'
import { promisify } from 'node:util'

export const AUTHORING_PACKAGE_READINESS_PROTOCOL = 'dsh-a11y-authoring-package-readiness/0.1.0-draft'
export const AUTHORING_PACKAGE_VERDICT_SCOPE = 'package-publication-prerequisites-only-not-accessibility-conformance'

const execFile = promisify(execFileCallback)
const requiredFiles = ['README.md', 'README.zh.md', 'SECURITY.md', 'LICENSE']
const requiredScripts = ['clean', 'build', 'typecheck', 'test', 'test:coverage', 'prepack']
const localDependency = /^(?:file|link|workspace):/u

function hasOwn(object, key) {
  return Object.prototype.hasOwnProperty.call(object ?? {}, key)
}

export function evaluateAuthoringPackageDependencyGraph(manifest, spec) {
  const blockers = []
  if (manifest === null || typeof manifest !== 'object' || Array.isArray(manifest)) {
    return ['manifest.invalid-or-missing']
  }

  if (manifest.name !== spec.name) blockers.push(`manifest.name-must-be-${spec.name}`)
  if (manifest.version !== spec.version) blockers.push(`manifest.version-must-be-${spec.version}`)
  const internalDependencies = spec.internalDependencies ?? {}
  for (const [name, version] of Object.entries(internalDependencies)) {
    const declared = manifest.dependencies?.[name]
    if (declared !== version) blockers.push(`dependencies.${name}-must-be-${version}`)
  }

  for (const group of ['dependencies', 'optionalDependencies', 'peerDependencies']) {
    for (const [name, version] of Object.entries(manifest[group] ?? {})) {
      if (typeof version === 'string' && localDependency.test(version)) {
        blockers.push(`${group}.${name}-must-not-use-local-protocol`)
      }
    }
  }

  const expectedInternal = new Set(Object.keys(internalDependencies))
  for (const group of ['dependencies', 'optionalDependencies', 'peerDependencies']) {
    for (const name of Object.keys(manifest[group] ?? {})) {
      if (name.startsWith('@oh-my-dsh/dsh-a11y-') && !expectedInternal.has(name)) {
        blockers.push(`${group}.${name}-is-not-in-versioned-graph`)
      }
    }
  }

  return [...new Set(blockers)].sort()
}

export function evaluateAuthoringPackageManifest(manifest, spec) {
  const blockers = evaluateAuthoringPackageDependencyGraph(manifest, spec)
  if (blockers.includes('manifest.invalid-or-missing')) return blockers

  if (manifest.private !== false) blockers.push('publication.private-must-be-false')
  if (manifest.license !== 'MIT') blockers.push('metadata.license-must-be-MIT')
  if (manifest.type !== 'module') blockers.push('metadata.type-must-be-module')
  if (typeof manifest.repository?.url !== 'string' || manifest.repository.url.length === 0) {
    blockers.push('metadata.repository-missing')
  }
  if (typeof manifest.homepage !== 'string' || manifest.homepage.length === 0) blockers.push('metadata.homepage-missing')
  if (typeof manifest.bugs?.url !== 'string' || manifest.bugs.url.length === 0) blockers.push('metadata.bugs-missing')
  if (manifest.publishConfig?.access !== 'public') blockers.push('publication.publishConfig-access-must-be-public')

  const files = new Set(Array.isArray(manifest.files) ? manifest.files : [])
  for (const file of requiredFiles) {
    if (!files.has(file)) blockers.push(`package-files.missing-${file}`)
  }
  for (const script of requiredScripts) {
    if (typeof manifest.scripts?.[script] !== 'string' || manifest.scripts[script].length === 0) {
      blockers.push(`scripts.missing-${script}`)
    }
  }

  if (!hasOwn(manifest, 'engines')) blockers.push('metadata.engines-missing')
  if (typeof manifest.packageManager !== 'string' || manifest.packageManager.length === 0) {
    blockers.push('metadata.packageManager-missing')
  }
  return [...new Set(blockers)].sort()
}

export function buildAuthoringPackageInstallReport(packages, generatedAt = new Date().toISOString()) {
  return {
    protocol: 'dsh-a11y-authoring-isolated-install/0.1.0-draft',
    generatedAt,
    evidence: 'automated-isolated-tarball-install-not-at-evidence',
    result: 'pass',
    packages,
    consumer: {
      topLevelCompositions: [
        '@oh-my-dsh/dsh-a11y-local-preview',
        '@oh-my-dsh/dsh-a11y-caller-page'
      ],
      importedPackageCount: packages.length,
      internalResolution: 'exact-version package manifests overridden only by freshly packed tarballs in the disposable consumer'
    },
    limitations: [
      'This proves isolated package assembly and module loading, not publication to or availability from npm.',
      'This automated install is not WCAG conformance, assistive-technology evidence, or disabled-user validation.'
    ]
  }
}

async function gitValue(root, args) {
  try {
    const { stdout } = await execFile('git', ['-C', root, ...args], { encoding: 'utf8' })
    return stdout.trim()
  } catch {
    return null
  }
}

export async function inspectAuthoringPackage(workspaceRoot, spec) {
  const root = resolve(workspaceRoot, spec.directory)
  let manifest = null
  try {
    manifest = JSON.parse(await readFile(resolve(root, 'package.json'), 'utf8'))
  } catch {}

  const revision = await gitValue(root, ['rev-parse', '--verify', 'HEAD'])
  const status = await gitValue(root, ['status', '--porcelain=v1', '--untracked-files=all'])
  const origin = await gitValue(root, ['config', '--get', 'remote.origin.url'])
  const blockers = evaluateAuthoringPackageManifest(manifest, spec)
  if (!/^[0-9a-f]{40}$/u.test(revision ?? '')) blockers.push('source.exact-git-revision-missing')
  if (status === null) blockers.push('source.git-worktree-unavailable')
  else if (status.length !== 0) blockers.push('source.git-worktree-must-be-clean')
  if (origin === null || origin.length === 0) blockers.push('source.origin-remote-missing')

  return {
    name: spec.name,
    version: spec.version,
    role: spec.role,
    source: {
      revision: /^[0-9a-f]{40}$/u.test(revision ?? '') ? revision : null,
      clean: status === '',
      originConfigured: origin !== null && origin.length > 0
    },
    blockers: [...new Set(blockers)].sort()
  }
}

export function buildAuthoringPackageReadinessReport(policy, packages, generatedAt = new Date().toISOString()) {
  if (policy?.protocol !== AUTHORING_PACKAGE_READINESS_PROTOCOL) throw new Error('unsupported authoring package policy protocol')
  const blockers = packages.flatMap(item => item.blockers.map(blocker => `${item.name}: ${blocker}`))
  return {
    protocol: AUTHORING_PACKAGE_READINESS_PROTOCOL,
    generatedAt,
    verdictScope: AUTHORING_PACKAGE_VERDICT_SCOPE,
    publishable: blockers.length === 0,
    blockerCount: blockers.length,
    packages,
    blockers,
    limitations: [
      'This report checks source and npm publication prerequisites; it does not execute package tests or installation tests.',
      'Package publication readiness is not WCAG conformance, assistive-technology evidence, or disabled-user validation.'
    ]
  }
}
