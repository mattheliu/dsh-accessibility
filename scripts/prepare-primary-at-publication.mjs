#!/usr/bin/env node
/** Inspect exact local publication sources and anonymous public state without writing either. */
import { execFile } from 'node:child_process'
import { readFile } from 'node:fs/promises'
import { dirname, resolve } from 'node:path'
import { promisify } from 'node:util'
import { fileURLToPath } from 'node:url'
import {
  createPrimaryAtPublicationPreflight,
} from './primary-at-publication-preflight-lib.mjs'
import { verifyPrimaryAtPublicReadiness } from './primary-at-public-readiness-lib.mjs'

const execFileAsync = promisify(execFile)
const argumentsValue = process.argv.slice(2)
const requireLocalReady = argumentsValue.includes('--require-local-ready')
const positional = argumentsValue.filter(argument => argument !== '--require-local-ready')
if (positional.length !== 1) {
  process.stderr.write('usage: node scripts/prepare-primary-at-publication.mjs <dsh-checkout> [--require-local-ready]\n')
  process.exitCode = 2
} else {
  const labRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..')
  const coreRoot = resolve(process.cwd(), positional[0])
  const campaign = JSON.parse(await readFile(new URL('../PRIMARY-AT-CAMPAIGN.json', import.meta.url), 'utf8'))

  async function git(root, ...args) {
    const result = await execFileAsync('git', args, { cwd: root, maxBuffer: 4 * 1024 * 1024 })
    return result.stdout.trim()
  }

  async function containsRevision(root, requiredRevision) {
    try {
      await execFileAsync('git', ['merge-base', '--is-ancestor', requiredRevision, 'HEAD'], { cwd: root })
      return true
    } catch (error) {
      if (error?.code === 1) return false
      throw error
    }
  }

  function normalizeRemote(value) {
    return value.replace(/^git\+/, '').replace(/\.git$/u, '').replace(/^git@github\.com:/u, 'https://github.com/')
  }

  async function repositoryState(root, repository, requiredRevision) {
    const remoteNames = (await git(root, 'remote')).split(/\r?\n/u).filter(Boolean)
    const matchingRemoteNames = []
    for (const name of remoteNames) {
      const url = await git(root, 'remote', 'get-url', name)
      if (normalizeRemote(url) === repository) matchingRemoteNames.push(name)
    }
    return {
      repository,
      branch: await git(root, 'branch', '--show-current'),
      headRevision: await git(root, 'rev-parse', 'HEAD'),
      requiredRevision,
      clean: (await git(root, 'status', '--porcelain=v1', '--untracked-files=all')) === '',
      containsRequiredRevision: await containsRevision(root, requiredRevision),
      remoteMatches: matchingRemoteNames.length > 0,
      matchingRemoteNames,
    }
  }

  const [core, lab, labTrackedFiles, publicObservation] = await Promise.all([
    repositoryState(coreRoot, campaign.candidate.repository, campaign.candidate.revision),
    repositoryState(labRoot, campaign.lab.repository, campaign.lab.revision),
    git(labRoot, 'ls-tree', '-r', '--name-only', 'HEAD').then(output => output.split(/\r?\n/u).filter(Boolean)),
    verifyPrimaryAtPublicReadiness(campaign),
  ])
  const report = createPrimaryAtPublicationPreflight({
    campaign,
    core,
    lab,
    labTrackedFiles,
    publicObservation,
  })
  process.stdout.write(`${JSON.stringify(report, null, 2)}\n`)
  if (requireLocalReady && !report.localReady) {
    process.stderr.write('Primary AT publication sources are not locally ready; no external state was changed.\n')
    process.exitCode = 1
  }
}
