/** Version of the stable JSON report returned by the authoring service and tool. */
export const A11Y_CHECK_REPORT_VERSION = '1.0.0' as const

/** Static content accepted by the first authoring engine. */
export interface WebStaticSource {
  readonly kind: 'web-static'
  readonly path: string
  readonly content: string
}

/** Declaration-merging seam for trusted plugins that add reviewed source kinds. */
export interface AccessibilitySourceMap {
  'web-static': WebStaticSource
}

/** Source kinds are intentionally extensible through future engine providers. */
export type AccessibilitySource = AccessibilitySourceMap[keyof AccessibilitySourceMap]

/** One standards reference attached to a deterministic finding or manual review item. */
export interface AccessibilityStandard {
  readonly id: string
  readonly level: string
  readonly url: string
}

/** A deterministic engine finding before the service assigns a stable report id. */
export interface AccessibilityEngineFinding {
  readonly ruleId: string
  readonly severity: 'error' | 'warning'
  readonly message: string
  readonly line: number
  readonly column: number
  readonly selector?: string
  readonly documentationUrl?: string
  readonly standards: readonly AccessibilityStandard[]
}

/** Result from one deterministic engine provider. */
export interface AccessibilityEngineResult {
  readonly findings: readonly AccessibilityEngineFinding[]
}

/**
 * Trusted extension registered by an installed Host plugin. Engines receive only
 * content that an owning consumer has already authorized and read.
 */
export interface AccessibilityEngine {
  readonly id: string
  readonly version: string
  readonly configVersion: string
  readonly targetKinds: readonly (keyof AccessibilitySourceMap & string)[]
  check(source: AccessibilitySource, signal?: AbortSignal): Promise<AccessibilityEngineResult>
}

/** One report finding with its provider identity and stable within-report id. */
export interface AccessibilityFinding extends AccessibilityEngineFinding {
  readonly id: string
  readonly engineId: string
}

/** A check that still needs human judgment, browser behavior, AT, or user evidence. */
export interface HumanReviewRequirement {
  readonly id: string
  readonly reason: string
  readonly standards: readonly AccessibilityStandard[]
}

/** Permission evidence supplied by the consumer that read the source. */
export interface AccessibilityAuthorization {
  readonly mode: 'configured-root' | 'configured-root+approval'
  readonly configuredRootCount: number
  readonly approval: 'not-required' | 'allowed-once'
  readonly readOnly: true
  readonly network: 'none'
}

/** Content identity needed to reproduce a report against the same authorized input. */
export interface AccessibilityInputEvidence {
  readonly sha256: string
  readonly byteLength: number
}

/** Inputs the service needs to produce the complete versioned report. */
export interface AccessibilityCheckRequest {
  readonly source: AccessibilitySource
  readonly inputEvidence: AccessibilityInputEvidence
  readonly authorization: AccessibilityAuthorization
  readonly maxFindings: number
}

/** Exact deterministic engine identity recorded in a report. */
export interface AccessibilityEngineEvidence {
  readonly id: string
  readonly version: string
  readonly configVersion: string
  readonly findingCount: number
}

/** Versioned result returned by `a11y_check`. */
export interface AccessibilityCheckReport {
  readonly schemaVersion: typeof A11Y_CHECK_REPORT_VERSION
  readonly target: {
    readonly kind: AccessibilitySource['kind']
    readonly path: string
    readonly sha256: string
    readonly byteLength: number
  }
  readonly authorization: AccessibilityAuthorization
  readonly engines: readonly AccessibilityEngineEvidence[]
  readonly outcome: 'pass' | 'pass-with-warnings' | 'fail'
  readonly summary: {
    readonly errors: number
    readonly warnings: number
    readonly totalFindings: number
  }
  readonly findings: readonly AccessibilityFinding[]
  readonly findingsTruncated: boolean
  readonly evidence: {
    readonly automated: 'completed'
    readonly assistiveTechnology: 'not-run'
    readonly disabledUser: 'not-run'
  }
  readonly uncertainty: {
    readonly automatedCoverage: 'partial'
    readonly renderedBehavior: 'not-observed'
    readonly humanJudgment: 'required'
  }
  readonly humanReviewRequired: readonly HumanReviewRequirement[]
  readonly limitations: readonly string[]
  readonly certification: false
}
