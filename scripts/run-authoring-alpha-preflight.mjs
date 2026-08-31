#!/usr/bin/env node
import { execFile as execFileCallback } from 'node:child_process'
import { mkdtemp, readFile, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { promisify } from 'node:util'
import {
  AUTHORING_ALPHA_PREFLIGHT_PROTOCOL,
  buildAuthoringPublicationLayers,
  classifyGitHubRepository,
  classifyNpmAuthentication,
  classifyNpmVersionLookup,
  classifyRemoteRevision,
} from './authoring-alpha-preflight-lib.mjs'
import { packAuthoringPackages } from './authoring-package-install-lib.mjs'
import { inspectAuthoringPackage, normalizeGitHubRepositoryIdentity } from './authoring-package-readiness-lib.mjs'
import { exactGitRevision } from './lab-source-state.mjs'

const execFile = promisify(execFileCallback)
const rawArguments = process.argv.slice(2)
const requireReady = rawArguments.includes('--require-ready')
const positional = rawArguments.filter(argument => argument !== '--require-ready')
if (positional.length > 1) {
  throw new Error('usage: node scripts/run-authoring-alpha-preflight.mjs [--require-ready] [workspace-root]')
}

const packageRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const workspaceRoot = resolve(positional[0] ?? resolve(packageRoot, '..'))
const manifest = JSON.parse(await readFile(join(packageRoot, 'package.json'), 'utf8'))
const policy = JSON.parse(await readFile(join(packageRoot, 'AUTHORING-PACKAGES.json'), 'utf8'))
const labRevision = await exactGitRevision(packageRoot, 'authoring alpha preflight')
const publicationLayers = buildAuthoringPublicationLayers(policy.packages)

async function command(commandName, args, cwd = workspaceRoot) {
  try {
    const { stdout } = await execFile(commandName, args, {
      cwd,
      encoding: 'utf8',
      maxBuffer: 4 * 1024 * 1024,
    })
    return { exitCode: 0, stdout }
  } catch (error) {
    return {
      exitCode: typeof error?.code === 'number' ? error.code : 1,
      stdout: String(error?.stdout ?? ''),
      stderr: String(error?.stderr ?? ''),
    }
  }
}

function diagnosticOutput(result) {
  return result.stdout.trim() !== '' ? result.stdout : result.stderr
}

function githubPath(publication) {
  const identity = normalizeGitHubRepositoryIdentity(publication.repository)
  if (identity === null) throw new Error('authoring publication policy contains an invalid GitHub repository')
  return identity.replace(/^github\.com\//u, '')
}

const npmAuthenticationResult = await command('npm', ['whoami', '--json', '--loglevel=silent'])
const npmAuthentication = classifyNpmAuthentication(
  npmAuthenticationResult.exitCode,
  diagnosticOutput(npmAuthenticationResult),
)
const inspections = await Promise.all(
  policy.packages.map(spec => inspectAuthoringPackage(workspaceRoot, spec)),
)
const inspectionByName = new Map(inspections.map(item => [item.name, item]))

const external = await Promise.all(policy.packages.map(async (spec) => {
  const sourceRoot = resolve(workspaceRoot, spec.directory)
  const inspection = inspectionByName.get(spec.name)
  const [registryResult, githubResult] = await Promise.all([
    command('npm', [
      'view', `${spec.name}@${spec.version}`, 'version', '--json', '--loglevel=silent',
    ], sourceRoot),
    command('gh', [
      'api', `repos/${githubPath(spec.publication)}`,
      '--jq', '{visibility,default_branch,archived}',
    ], sourceRoot),
  ])
  const github = classifyGitHubRepository(
    githubResult.exitCode,
    diagnosticOutput(githubResult),
    spec.publication,
  )
  let remoteRevision = 'unchecked'
  if (inspection.source.originConfigured) {
    const remoteResult = await command('git', [
      '-C', sourceRoot, 'ls-remote', 'origin', `refs/heads/${spec.publication.branch}`,
    ], sourceRoot)
    remoteRevision = classifyRemoteRevision(
      remoteResult.exitCode,
      remoteResult.stdout,
      inspection.source.revision,
    )
  }
  return {
    name: spec.name,
    registryVersion: classifyNpmVersionLookup(
      registryResult.exitCode,
      diagnosticOutput(registryResult),
      spec.version,
    ),
    github,
    remoteRevision,
  }
}))
const externalByName = new Map(external.map(item => [item.name, item]))

let temporaryRoot
let packed
try {
  temporaryRoot = await mkdtemp(join(tmpdir(), 'dsh-a11y-alpha-preflight-'))
  packed = await packAuthoringPackages(policy, workspaceRoot, temporaryRoot)
} finally {
  if (temporaryRoot !== undefined) await rm(temporaryRoot, { recursive: true, force: true })
}
const packedByName = new Map(packed.map(item => [item.name, item]))

const packages = policy.packages.map((spec) => {
  const inspection = inspectionByName.get(spec.name)
  const state = externalByName.get(spec.name)
  const tarball = packedByName.get(spec.name)
  return {
    name: spec.name,
    version: spec.version,
    role: spec.role,
    revision: inspection.source.revision,
    source: {
      clean: inspection.source.clean,
      originConfigured: inspection.source.originConfigured,
      originMatchesPolicy: inspection.source.originMatchesPolicy,
      remoteRevision: state.remoteRevision,
    },
    github: state.github,
    registryVersion: state.registryVersion,
    tarball: { integrity: tarball.integrity, filename: tarball.filename },
    readinessBlockers: inspection.blockers,
  }
})

const blockers = []
if (npmAuthentication === 'missing') blockers.push('npm.authentication-missing')
else if (npmAuthentication === 'unknown') blockers.push('npm.authentication-unknown')
for (const item of packages) {
  for (const blocker of item.readinessBlockers) blockers.push(`${item.name}: ${blocker}`)
  if (item.github.state === 'missing') blockers.push(`${item.name}: github.repository-missing`)
  else if (item.github.state === 'mismatch') blockers.push(`${item.name}: github.repository-policy-mismatch`)
  else if (item.github.state === 'unknown') blockers.push(`${item.name}: github.repository-lookup-failed`)
  if (item.source.originConfigured) {
    if (item.source.remoteRevision === 'missing') blockers.push(`${item.name}: source.remote-branch-missing`)
    else if (item.source.remoteRevision === 'mismatch') blockers.push(`${item.name}: source.remote-revision-mismatch`)
    else if (item.source.remoteRevision === 'unknown') blockers.push(`${item.name}: source.remote-lookup-failed`)
  }
  if (item.registryVersion === 'already-exists') blockers.push(`${item.name}: npm.version-already-exists`)
  else if (item.registryVersion === 'unknown') blockers.push(`${item.name}: npm.version-lookup-failed`)
}

const report = {
  protocol: AUTHORING_ALPHA_PREFLIGHT_PROTOCOL,
  generatedAt: new Date().toISOString(),
  evidence: 'release-preflight-only-no-publish-no-accessibility-claim',
  result: blockers.length === 0 ? 'pass' : 'blocked',
  lab: {
    package: String(manifest.name),
    version: String(manifest.version),
    revision: labRevision,
  },
  npm: {
    registry: 'https://registry.npmjs.org',
    authentication: npmAuthentication,
    distTag: 'alpha',
  },
  publicationLayers,
  packages,
  blockerCount: blockers.length,
  blockers,
  limitations: [
    'This command performs read-only remote checks and disposable local packing; it never creates repositories, pushes Git state, tags commits, or publishes packages.',
    'An available registry version is only a point-in-time lookup and does not reserve the package name or version.',
    'Release readiness is not WCAG conformance, assistive-technology evidence, or disabled-user validation.',
  ],
}
process.stdout.write(`${JSON.stringify(report, null, 2)}\n`)
if (requireReady && report.result !== 'pass') process.exitCode = 1
