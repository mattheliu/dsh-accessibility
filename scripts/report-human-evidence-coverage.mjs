/** Produce a privacy-minimized aggregate report from public human evidence. */
import { lstat, readFile, readdir } from 'node:fs/promises'
import { resolve } from 'node:path'
import { evaluateEvidenceCoverage } from './evidence-coverage-lib.mjs'

const rawArguments = process.argv.slice(2)
const requireBaseline = rawArguments.includes('--require-baseline')
const targets = rawArguments.filter(argument => argument !== '--require-baseline' && argument !== '--')
if (targets.length === 0) targets.push('evidence')

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

const files = [...new Set((await Promise.all(targets.map(collect))).flat())].sort()
if (files.length === 0) throw new Error('human evidence coverage found no JSON files')

const values = []
const parseFailures = []
for (const file of files) {
  try {
    values.push(JSON.parse(await readFile(file, 'utf8')))
  } catch (error) {
    parseFailures.push(`${file}: ${error instanceof Error ? error.message : String(error)}`)
  }
}
if (parseFailures.length > 0) throw new Error(`invalid evidence JSON:\n${parseFailures.join('\n')}`)

const result = evaluateEvidenceCoverage(values)
if (!result.valid) {
  throw new Error(`human evidence coverage validation failed:\n${result.issues.map(issue => `  - ${issue}`).join('\n')}`)
}
process.stdout.write(`${JSON.stringify(result.report, null, 2)}\n`)
if (requireBaseline && !result.report.baselineSatisfied) process.exitCode = 1
