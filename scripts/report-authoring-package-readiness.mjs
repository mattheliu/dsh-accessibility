#!/usr/bin/env node
import { readFile } from 'node:fs/promises'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import {
  buildAuthoringPackageReadinessReport,
  inspectAuthoringPackage
} from './authoring-package-readiness-lib.mjs'

const scriptRoot = dirname(fileURLToPath(import.meta.url))
const packageRoot = resolve(scriptRoot, '..')
const args = process.argv.slice(2)
const requirePublishable = args.includes('--require-publishable')
const positional = args.filter(argument => argument !== '--require-publishable')
if (positional.length > 1) {
  throw new Error('usage: node scripts/report-authoring-package-readiness.mjs [--require-publishable] [workspace-root]')
}

const workspaceRoot = resolve(positional[0] ?? resolve(packageRoot, '..'))
const policy = JSON.parse(await readFile(resolve(packageRoot, 'AUTHORING-PACKAGES.json'), 'utf8'))
const packages = []
for (const spec of policy.packages) packages.push(await inspectAuthoringPackage(workspaceRoot, spec))
const report = buildAuthoringPackageReadinessReport(policy, packages)
process.stdout.write(`${JSON.stringify(report, null, 2)}\n`)
if (requirePublishable && !report.publishable) process.exitCode = 1
