/** Run the external-plugin browser scenario inside an exact DSH checkout. */
import { readFile, rm, writeFile } from 'node:fs/promises'
import { spawn } from 'node:child_process'
import { resolve, join } from 'node:path'

const [dshArgument, pluginArgument = '.'] = process.argv.slice(2)
if (dshArgument === undefined) {
  throw new Error('usage: node scripts/run-assembled-browser.mjs <dsh-checkout> [plugin-checkout]')
}

const invocationCwd = process.cwd()
const dshRoot = resolve(invocationCwd, dshArgument)
const pluginRoot = resolve(invocationCwd, pluginArgument)
const dshManifest = JSON.parse(await readFile(join(dshRoot, 'package.json'), 'utf8'))
const pluginManifest = JSON.parse(await readFile(join(pluginRoot, 'package.json'), 'utf8'))
if (dshManifest.version !== '0.1.1-rc.2') {
  throw new Error(`assembled browser requires DSH 0.1.1-rc.2, received ${String(dshManifest.version)}`)
}
if (pluginManifest.name !== '@oh-my-dsh/dsh-accessibility') {
  throw new Error('assembled browser received the wrong plugin package')
}
await readFile(join(pluginRoot, 'lib/client.js'), 'utf8')

const template = await readFile(join(pluginRoot, 'scripts/assembled-browser.e2e.template.ts'), 'utf8')
const relativeTarget = 'apps/web/tests/dsh-accessibility.external.e2e.ts'
const target = join(dshRoot, relativeTarget)

await writeFile(target, template, { flag: 'wx' })
let exitCode = 1
try {
  exitCode = await new Promise((resolveExit, reject) => {
    const child = spawn('pnpm', [
      'exec', 'vitest', 'run', relativeTarget, '--config', 'vitest.web.config.ts',
    ], {
      cwd: dshRoot,
      stdio: 'inherit',
      env: {
        ...process.env,
        DSH_SNAPSHOT: 'replay',
        DSH_ACCESSIBILITY_PLUGIN_ROOT: pluginRoot,
      },
    })
    child.once('error', reject)
    child.once('exit', (code, signal) => {
      if (signal !== null) reject(new Error(`assembled browser runner ended with signal ${signal}`))
      else resolveExit(code ?? 1)
    })
  })
} finally {
  await rm(target, { force: true })
}

if (exitCode !== 0) process.exitCode = exitCode
