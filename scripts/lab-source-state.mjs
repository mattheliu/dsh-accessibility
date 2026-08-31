import { spawnSync } from 'node:child_process'

function git(root, args, label) {
  const result = spawnSync('git', args, { cwd: root, encoding: 'utf8' })
  if (result.status !== 0) {
    const detail = String(result.stderr || result.stdout).trim()
    throw new Error(
      `${label} must be a readable Git checkout${detail === '' ? '' : `: ${detail}`}`,
    )
  }
  return String(result.stdout).trim()
}

/**
 * Resolve one evidence-bearing checkout to a full commit and reject any
 * tracked, staged, or untracked source that the revision cannot identify.
 */
export function exactGitRevision(root, label) {
  git(root, ['rev-parse', '--show-toplevel'], label)
  const revision = git(root, ['rev-parse', 'HEAD'], label)
  if (!/^[0-9a-f]{40}$/u.test(revision)) {
    throw new Error(`${label} did not resolve to a full Git commit`)
  }
  const changes = git(root, ['status', '--porcelain=v1', '--untracked-files=all'], label)
  if (changes !== '') {
    throw new Error(
      `${label} working tree must be clean before evidence collection; commit or remove every change`,
    )
  }
  return revision
}
