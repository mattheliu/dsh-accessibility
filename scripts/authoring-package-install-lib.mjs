import { execFile as execFileCallback } from 'node:child_process'
import { readFile } from 'node:fs/promises'
import { basename, resolve } from 'node:path'
import { promisify } from 'node:util'
import { evaluateAuthoringPackageDependencyGraph } from './authoring-package-readiness-lib.mjs'
import { exactGitRevision } from './lab-source-state.mjs'

const execFile = promisify(execFileCallback)

export async function packAuthoringPackages(policy, workspaceRoot, tarballRoot) {
  const packed = []
  for (const spec of policy.packages) {
    const sourceRoot = resolve(workspaceRoot, spec.directory)
    const revision = await exactGitRevision(sourceRoot, spec.name)
    const manifest = JSON.parse(await readFile(resolve(sourceRoot, 'package.json'), 'utf8'))
    const dependencyIssues = evaluateAuthoringPackageDependencyGraph(manifest, spec)
    if (dependencyIssues.length !== 0) {
      throw new Error(`${spec.name} is not registry-independent: ${dependencyIssues.join(', ')}`)
    }
    const { stdout } = await execFile(
      'npm',
      ['pack', '--json', '--pack-destination', tarballRoot],
      { cwd: sourceRoot, encoding: 'utf8', maxBuffer: 4 * 1024 * 1024 }
    )
    const result = JSON.parse(stdout)[0]
    if (result?.name !== spec.name || result?.version !== spec.version || typeof result?.filename !== 'string') {
      throw new Error(`${spec.name} produced an unexpected npm pack result`)
    }
    packed.push({
      name: spec.name,
      version: spec.version,
      revision,
      integrity: result.integrity,
      filename: basename(result.filename),
      tarballPath: resolve(tarballRoot, result.filename)
    })
  }
  return packed
}

function yamlQuote(value) {
  return `'${value.replaceAll("'", "''")}'`
}

export function pnpmTarballOverrides(packed) {
  return [
    'overrides:',
    ...packed.map(item => `  ${yamlQuote(item.name)}: ${yamlQuote(`file:${item.tarballPath}`)}`),
    ''
  ].join('\n')
}
