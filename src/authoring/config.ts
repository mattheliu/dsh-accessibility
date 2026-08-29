import z from '@deepseek-ai/schemastery'

/** How an enabled authoring tool authorizes reads inside configured roots. */
export type AuthoringAccess = 'approval' | 'allowlist'

export interface AuthoringConfig {
  enabled?: boolean
  access?: AuthoringAccess
  allowedRoots?: string[]
  maxBytes?: number
  maxFindings?: number
}

export interface Config {
  authoring?: AuthoringConfig
}

/** DSH profile schema. Authoring stays disabled unless a profile opts in. */
export const Config: z<Config> = z.object({
  authoring: z.object({
    enabled: z.boolean().default(false),
    access: z.union(['approval', 'allowlist'] as const).default('approval'),
    allowedRoots: z.array(z.string()).default([]),
    maxBytes: z.number().min(1).default(1024 * 1024),
    maxFindings: z.number().min(1).default(200),
  }),
}) as z<Config>

export interface ResolvedAuthoringConfig {
  readonly enabled: boolean
  readonly access: AuthoringAccess
  readonly allowedRoots: readonly string[]
  readonly maxBytes: number
  readonly maxFindings: number
}

function positiveInteger(value: number, name: string): number {
  if (!Number.isSafeInteger(value) || value < 1) throw new Error(`${name} must be a positive safe integer`)
  return value
}

/** Apply security defaults and reject an enabled tool without a least-privilege root. */
export function resolveAuthoringConfig(config: Config = {}): ResolvedAuthoringConfig {
  const authoring = config.authoring ?? {}
  const enabled = authoring.enabled ?? false
  const access = authoring.access ?? 'approval'
  if (access !== 'approval' && access !== 'allowlist') throw new Error(`unsupported authoring access mode "${String(access)}"`)

  const allowedRoots = [...new Set((authoring.allowedRoots ?? []).map(root => root.trim()))]
  if (allowedRoots.some(root => root.length === 0)) throw new Error('authoring.allowedRoots cannot contain an empty path')
  if (enabled && allowedRoots.length === 0) {
    throw new Error('authoring.enabled requires at least one explicit authoring.allowedRoots entry')
  }

  return {
    enabled,
    access,
    allowedRoots,
    maxBytes: positiveInteger(authoring.maxBytes ?? 1024 * 1024, 'authoring.maxBytes'),
    maxFindings: positiveInteger(authoring.maxFindings ?? 200, 'authoring.maxFindings'),
  }
}
