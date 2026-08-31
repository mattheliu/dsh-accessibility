/** Versioned non-publishing preflight for the six accessibility authoring packages. */
export const AUTHORING_ALPHA_PREFLIGHT_PROTOCOL = 'dsh-a11y-authoring-alpha-preflight/0.1.0-draft'

function json(stdout) {
  try {
    return JSON.parse(stdout)
  } catch {
    return null
  }
}

/** Derive stable dependency-first publication layers and reject an invalid graph. */
export function buildAuthoringPublicationLayers(packages) {
  if (!Array.isArray(packages) || packages.length === 0) {
    throw new Error('authoring publication policy must contain packages')
  }
  const order = new Map()
  const byName = new Map()
  for (const [index, item] of packages.entries()) {
    if (typeof item?.name !== 'string' || byName.has(item.name)) {
      throw new Error('authoring publication policy contains an invalid or duplicate package')
    }
    order.set(item.name, index)
    byName.set(item.name, item)
  }

  const dependencies = new Map()
  const dependents = new Map([...byName.keys()].map(name => [name, []]))
  for (const item of packages) {
    const names = Object.keys(item.internalDependencies ?? {})
    for (const name of names) {
      if (!byName.has(name)) throw new Error(`${item.name} depends on an unknown authoring package`)
      dependents.get(name).push(item.name)
    }
    dependencies.set(item.name, new Set(names))
  }

  const layers = []
  let ready = packages.filter(item => dependencies.get(item.name).size === 0).map(item => item.name)
  let emitted = 0
  while (ready.length > 0) {
    const layer = [...ready].sort((left, right) => order.get(left) - order.get(right))
    layers.push(layer)
    emitted += layer.length
    const next = new Set()
    for (const name of layer) {
      for (const dependent of dependents.get(name)) {
        const remaining = dependencies.get(dependent)
        remaining.delete(name)
        if (remaining.size === 0) next.add(dependent)
      }
    }
    ready = [...next]
  }
  if (emitted !== packages.length) throw new Error('authoring publication dependency graph contains a cycle')
  return layers
}

/** Classify one exact public-registry version lookup without retaining npm diagnostics. */
export function classifyNpmVersionLookup(exitCode, stdout, expectedVersion) {
  const value = json(stdout)
  if (exitCode === 0 && value === expectedVersion) return 'already-exists'
  if (exitCode !== 0 && value?.error?.code === 'E404') return 'available'
  return 'unknown'
}

/** Classify local npm publisher credentials without retaining the account name. */
export function classifyNpmAuthentication(exitCode, stdout) {
  const value = json(stdout)
  if (exitCode === 0 && typeof value === 'string' && value.length > 0) return 'available'
  if (exitCode !== 0 && (value?.error?.code === 'E401' || value?.error?.code === 'E403')) return 'missing'
  return 'unknown'
}

/** Classify the expected GitHub repository without exposing arbitrary API output. */
export function classifyGitHubRepository(exitCode, output, publication) {
  const value = json(output)
  if (exitCode !== 0) {
    const status = value?.status ?? value?.error?.status
    const missing = status === '404' || status === 404
      || /(?:HTTP 404|"status"\s*:\s*"?404"?)/iu.test(output)
    return { state: missing ? 'missing' : 'unknown' }
  }
  if (typeof value !== 'object' || value === null || Array.isArray(value)) return { state: 'unknown' }
  const visibility = typeof value.visibility === 'string' ? value.visibility : null
  const defaultBranch = typeof value.default_branch === 'string' ? value.default_branch : null
  const archived = typeof value.archived === 'boolean' ? value.archived : null
  const ready = visibility === publication.visibility
    && defaultBranch === publication.branch
    && archived === false
  return {
    state: ready ? 'ready' : 'mismatch',
    visibility,
    defaultBranch,
    archived,
  }
}

/** Classify whether the policy branch on origin contains the exact local revision. */
export function classifyRemoteRevision(exitCode, stdout, expectedRevision) {
  if (exitCode !== 0) return 'unknown'
  const revisions = stdout.split(/\r?\n/u)
    .map(line => line.trim().split(/\s+/u)[0])
    .filter(Boolean)
  if (revisions.length === 0) return 'missing'
  return revisions.length === 1 && revisions[0] === expectedRevision ? 'matches' : 'mismatch'
}
