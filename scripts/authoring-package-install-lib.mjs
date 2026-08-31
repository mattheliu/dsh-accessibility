import { execFile as execFileCallback } from 'node:child_process'
import { mkdir, readFile, writeFile } from 'node:fs/promises'
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

export async function installAuthoringPackageConsumer(packed, consumerRoot) {
  await mkdir(consumerRoot)
  const manifest = {
    name: 'dsh-a11y-authoring-isolated-install-consumer',
    version: '0.0.0',
    private: true,
    type: 'module',
    packageManager: 'pnpm@11.7.0',
    dependencies: {
      '@deepseek-ai/cordis': '4.0.2',
      '@deepseek-ai/dsh-system-prompt': '0.1.2-alpha.2',
      '@deepseek-ai/dsh-tools': '0.1.2-alpha.2',
      playwright: '1.61.1',
      ...Object.fromEntries(packed.map(item => [item.name, item.version]))
    }
  }
  await writeFile(resolve(consumerRoot, 'package.json'), `${JSON.stringify(manifest, null, 2)}\n`, { flag: 'wx' })
  await writeFile(resolve(consumerRoot, 'pnpm-workspace.yaml'), pnpmTarballOverrides(packed), { flag: 'wx' })
  await execFile(
    'pnpm',
    ['install', '--ignore-scripts', '--prefer-offline'],
    { cwd: consumerRoot, encoding: 'utf8', maxBuffer: 8 * 1024 * 1024 }
  )
  return manifest
}
