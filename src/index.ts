import type { Context } from '@deepseek-ai/cordis'
import { AccessibilityAuthoring } from './authoring/service.js'
import { createHtmlValidateEngine } from './authoring/html-validate-engine.js'
import { applyA11yCheckTool } from './authoring/tool.js'
import { Config, resolveAuthoringConfig } from './authoring/config.js'
import type { Config as AccessibilityConfig } from './authoring/config.js'

/** Node half: DSH discovers both the client manifest and optional Host capability. */
export const name = 'accessibility'

export { Config }
export type { AccessibilityConfig }
export * from './authoring/types.js'
export * from './authoring/service.js'
export * from './authoring/html-validate-engine.js'
export * from './authoring/tool.js'
export * from './authoring/report-schema.js'
export * from './authoring/standards.js'

/** Mount the registry; expose file access only when a profile explicitly opts in. */
export function apply(ctx: Context, config: AccessibilityConfig = {}): void {
  const resolved = resolveAuthoringConfig(config)
  const authoring = new AccessibilityAuthoring(ctx)
  authoring.registerEngine(createHtmlValidateEngine())
  if (resolved.enabled) {
    ctx.inject(['tools', 'fs'], scope => applyA11yCheckTool(scope, authoring, resolved))
  }
}
