#!/usr/bin/env node
/** Print anonymous public availability; never mutates the campaign or creates AT evidence. */
import { readFile } from 'node:fs/promises'
import { verifyPrimaryAtPublicReadiness } from './primary-at-public-readiness-lib.mjs'

const allowed = new Set(['--require-openable'])
const unknown = process.argv.slice(2).filter(argument => !allowed.has(argument))
if (unknown.length > 0) {
  process.stderr.write(`Unknown argument(s): ${unknown.join(', ')}\n`)
  process.exitCode = 2
} else {
  const campaign = JSON.parse(await readFile(new URL('../PRIMARY-AT-CAMPAIGN.json', import.meta.url), 'utf8'))
  const report = await verifyPrimaryAtPublicReadiness(campaign)
  process.stdout.write(`${JSON.stringify(report, null, 2)}\n`)
  if (process.argv.includes('--require-openable') && !report.readyToOpen) {
    process.stderr.write('Primary AT campaign is not anonymously public and openable; no human evidence or support claim was created.\n')
    process.exitCode = 1
  }
}
