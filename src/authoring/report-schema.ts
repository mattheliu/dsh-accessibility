import type { ValueSchemaSpec } from '@deepseek-ai/dsh-tools'

const standard = {
  type: 'object',
  additionalProperties: false,
  properties: {
    id: { type: 'string', required: true },
    level: { type: 'string', required: true },
    url: { type: 'string', required: true },
  },
} as const

/** Enforced canonical-output schema for report version 1.0.0. */
export const A11Y_CHECK_OUTPUT_SCHEMA = {
  type: 'object',
  additionalProperties: false,
  properties: {
    schemaVersion: { type: 'string', const: '1.0.0', required: true },
    target: {
      type: 'object',
      required: true,
      additionalProperties: false,
      properties: {
        kind: { type: 'string', const: 'web-static', required: true },
        path: { type: 'string', required: true },
        sha256: { type: 'string', required: true },
        byteLength: { type: 'integer', required: true },
      },
    },
    authorization: {
      type: 'object',
      required: true,
      additionalProperties: false,
      properties: {
        mode: { type: 'string', enum: ['configured-root', 'configured-root+approval'], required: true },
        configuredRootCount: { type: 'integer', required: true },
        approval: { type: 'string', enum: ['not-required', 'allowed-once'], required: true },
        readOnly: { type: 'boolean', const: true, required: true },
        network: { type: 'string', const: 'none', required: true },
      },
    },
    engines: {
      type: 'array',
      required: true,
      items: {
        type: 'object',
        additionalProperties: false,
        properties: {
          id: { type: 'string', required: true },
          version: { type: 'string', required: true },
          configVersion: { type: 'string', required: true },
          findingCount: { type: 'integer', required: true },
        },
      },
    },
    outcome: { type: 'string', enum: ['pass', 'pass-with-warnings', 'fail'], required: true },
    summary: {
      type: 'object',
      required: true,
      additionalProperties: false,
      properties: {
        errors: { type: 'integer', required: true },
        warnings: { type: 'integer', required: true },
        totalFindings: { type: 'integer', required: true },
      },
    },
    findings: {
      type: 'array',
      required: true,
      items: {
        type: 'object',
        additionalProperties: false,
        properties: {
          id: { type: 'string', required: true },
          engineId: { type: 'string', required: true },
          ruleId: { type: 'string', required: true },
          severity: { type: 'string', enum: ['error', 'warning'], required: true },
          message: { type: 'string', required: true },
          line: { type: 'integer', required: true },
          column: { type: 'integer', required: true },
          selector: { type: 'string' },
          documentationUrl: { type: 'string' },
          standards: { type: 'array', required: true, items: standard },
        },
      },
    },
    findingsTruncated: { type: 'boolean', required: true },
    evidence: {
      type: 'object',
      required: true,
      additionalProperties: false,
      properties: {
        automated: { type: 'string', const: 'completed', required: true },
        assistiveTechnology: { type: 'string', const: 'not-run', required: true },
        disabledUser: { type: 'string', const: 'not-run', required: true },
      },
    },
    uncertainty: {
      type: 'object',
      required: true,
      additionalProperties: false,
      properties: {
        automatedCoverage: { type: 'string', const: 'partial', required: true },
        renderedBehavior: { type: 'string', const: 'not-observed', required: true },
        humanJudgment: { type: 'string', const: 'required', required: true },
      },
    },
    humanReviewRequired: {
      type: 'array',
      required: true,
      items: {
        type: 'object',
        additionalProperties: false,
        properties: {
          id: { type: 'string', required: true },
          reason: { type: 'string', required: true },
          standards: { type: 'array', required: true, items: standard },
        },
      },
    },
    limitations: { type: 'array', required: true, items: { type: 'string' } },
    certification: { type: 'boolean', const: false, required: true },
  },
} as const satisfies ValueSchemaSpec
