#!/usr/bin/env node
import { execFile as execFileCallback } from 'node:child_process'
import { mkdir, mkdtemp, readFile, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { promisify } from 'node:util'
import {
  buildAuthoringPackageInstallReport
} from './authoring-package-readiness-lib.mjs'
import { packAuthoringPackages, pnpmTarballOverrides } from './authoring-package-install-lib.mjs'
import { exactGitRevision } from './lab-source-state.mjs'

const execFile = promisify(execFileCallback)
const scriptRoot = dirname(fileURLToPath(import.meta.url))
const packageRoot = resolve(scriptRoot, '..')
const args = process.argv.slice(2)
if (args.length > 1) throw new Error('usage: node scripts/run-authoring-package-install.mjs [workspace-root]')
const workspaceRoot = resolve(args[0] ?? resolve(packageRoot, '..'))
const policy = JSON.parse(await readFile(resolve(packageRoot, 'AUTHORING-PACKAGES.json'), 'utf8'))
const labManifest = JSON.parse(await readFile(resolve(packageRoot, 'package.json'), 'utf8'))
const labRevision = await exactGitRevision(packageRoot, '@oh-my-dsh/dsh-accessibility authoring install lab')

let temporaryRoot
try {
  temporaryRoot = await mkdtemp(join(tmpdir(), 'dsh-a11y-authoring-install-'))
  const tarballRoot = join(temporaryRoot, 'tarballs')
  const consumerRoot = join(temporaryRoot, 'consumer')
  await mkdir(tarballRoot)
  await mkdir(consumerRoot)
  const packed = await packAuthoringPackages(policy, workspaceRoot, tarballRoot)

  const consumerManifest = {
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
  await writeFile(resolve(consumerRoot, 'package.json'), `${JSON.stringify(consumerManifest, null, 2)}\n`, { flag: 'wx' })
  await writeFile(resolve(consumerRoot, 'pnpm-workspace.yaml'), pnpmTarballOverrides(packed), { flag: 'wx' })
  await execFile(
    'pnpm',
    ['install', '--ignore-scripts', '--prefer-offline'],
    { cwd: consumerRoot, encoding: 'utf8', maxBuffer: 8 * 1024 * 1024 }
  )

  const importScript = `
const packages = ${JSON.stringify(packed.map(item => item.name))}
for (const name of packages) await import(name)
process.stdout.write(JSON.stringify({ imported: packages }))
`
  const { stdout: importOutput } = await execFile(
    process.execPath,
    ['--input-type=module', '--eval', importScript],
    { cwd: consumerRoot, encoding: 'utf8', maxBuffer: 1024 * 1024 }
  )
  const imported = JSON.parse(importOutput).imported
  if (imported.length !== packed.length) throw new Error('isolated consumer did not import every authoring package')

  const reportPackages = packed.map(({ tarballPath, ...item }) => item)
  process.stdout.write(`${JSON.stringify(buildAuthoringPackageInstallReport(reportPackages, {
    package: labManifest.name,
    version: labManifest.version,
    revision: labRevision
  }), null, 2)}\n`)
} finally {
  if (temporaryRoot !== undefined) await rm(temporaryRoot, { force: true, recursive: true })
}
