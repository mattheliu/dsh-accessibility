/** Generate a catalog-owned, claim-none public human-evidence template. */
import { writeFile } from 'node:fs/promises'
import { extname, resolve } from 'node:path'
import { createHumanEvidenceTemplate } from './human-evidence-template-lib.mjs'

const usage = [
  'usage: node scripts/create-human-evidence-template.mjs',
  '  --protocol <versioned-protocol>',
  '  --tasks <all|claim-eligible|representative-core|safety-critical|comma-separated-task-ids>',
  '  --kind <assistive-technology-run|disabled-user-task-run>',
  '  --locale <language-tag>',
  '  [--output <new-json-file>]',
].join('\n')

const rawArguments = process.argv.slice(2)
const args = rawArguments[0] === '--' ? rawArguments.slice(1) : rawArguments
if (args.includes('--help')) {
  process.stdout.write(`${usage}\n`)
  process.exit(0)
}

const values = new Map()
for (let index = 0; index < args.length; index += 2) {
  const flag = args[index]
  const value = args[index + 1]
  if (!['--protocol', '--tasks', '--kind', '--locale', '--output'].includes(flag)) {
    throw new Error(`${usage}\nunknown option: ${String(flag)}`)
  }
  if (value === undefined || value.startsWith('--')) throw new Error(`${usage}\nmissing value for ${flag}`)
  if (values.has(flag)) throw new Error(`duplicate option: ${flag}`)
  values.set(flag, value)
}

for (const required of ['--protocol', '--tasks', '--kind', '--locale']) {
  if (!values.has(required)) throw new Error(`${usage}\nmissing required option: ${required}`)
}

const record = createHumanEvidenceTemplate({
  protocol: values.get('--protocol'),
  tasks: values.get('--tasks'),
  evidenceKind: values.get('--kind'),
  locale: values.get('--locale'),
})
const serialized = `${JSON.stringify(record, null, 2)}\n`
const output = values.get('--output')
if (output === undefined) {
  process.stderr.write('Generated a non-evidence template with claim:none; no human result or support claim was created.\n')
  process.stdout.write(serialized)
} else {
  if (extname(output) !== '.json') throw new Error('--output must name a new .json file')
  const target = resolve(process.cwd(), output)
  await writeFile(target, serialized, { flag: 'wx', mode: 0o600 })
  process.stdout.write(`${target}\n`)
  process.stderr.write('Wrote a private-permission non-evidence template; review and sanitize before committing it.\n')
}
