/** Validate committed public human-evidence records and non-evidence templates. */
import { lstat, readFile, readdir } from 'node:fs/promises'
import { relative, resolve } from 'node:path'
import { validateHumanEvidenceRecord } from './human-evidence-lib.mjs'

const rawArguments = process.argv.slice(2)
const argumentsValue = rawArguments[0] === '--' ? rawArguments.slice(1) : rawArguments
if (argumentsValue.length === 0) {
  throw new Error('usage: node scripts/validate-human-evidence.mjs <json-file-or-directory> [...]')
}

async function collect(target) {
  const absolute = resolve(process.cwd(), target)
  const stats = await lstat(absolute)
  if (stats.isFile()) return absolute.endsWith('.json') ? [absolute] : []
  if (!stats.isDirectory()) return []
  const entries = await readdir(absolute, { withFileTypes: true })
  const nested = await Promise.all(entries
    .filter(entry => !entry.name.startsWith('.'))
    .map(entry => collect(resolve(absolute, entry.name))))
  return nested.flat()
}

const files = [...new Set((await Promise.all(argumentsValue.map(collect))).flat())].sort()
if (files.length === 0) throw new Error('human evidence validator found no JSON files')

const failures = []
for (const file of files) {
  let value
  try {
    value = JSON.parse(await readFile(file, 'utf8'))
  } catch (error) {
    failures.push(`${file}: invalid JSON: ${error instanceof Error ? error.message : String(error)}`)
    continue
  }
  const result = validateHumanEvidenceRecord(value)
  if (!result.valid) {
    failures.push(`${file}:\n${result.issues.map(issue => `  - ${issue}`).join('\n')}`)
    continue
  }
  const displayPath = relative(process.cwd(), file) || file
  process.stdout.write(`${displayPath}: valid ${result.recordType === 'template' ? 'non-evidence template' : `human evidence (claim: ${result.claim})`}\n`)
}

if (failures.length > 0) {
  throw new Error(`human evidence validation failed:\n${failures.join('\n')}`)
}
