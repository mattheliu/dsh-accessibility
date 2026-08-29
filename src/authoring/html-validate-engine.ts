import { HtmlValidate, Severity, ruleExists, version as htmlValidateVersion } from 'html-validate'
import type { ConfigData, Message } from 'html-validate'
import { HTML_STANDARD, WAI_ARIA_STANDARD, WCAG } from './standards.js'
import type {
  AccessibilityEngine,
  AccessibilityEngineFinding,
  AccessibilityStandard,
} from './types.js'

/** Versioned rule selection independent from the installed engine version. */
export const HTML_VALIDATE_CONFIG_VERSION = 'web-static-1' as const

const RULES = {
  'area-alt': 'error',
  'aria-hidden-body': 'error',
  'aria-label-misuse': 'error',
  'empty-heading': 'error',
  'empty-title': 'error',
  'hidden-focusable': 'error',
  'input-missing-label': 'error',
  'meta-refresh': 'error',
  'multiple-labeled-controls': 'error',
  'no-abstract-role': 'error',
  'no-autoplay': 'error',
  'no-implicit-button-type': 'warn',
  'no-missing-references': 'error',
  'no-multiple-main': 'error',
  'prefer-native-element': 'warn',
  'text-content': 'error',
  'unique-landmark': 'error',
  'wcag/h30': 'error',
  'wcag/h32': 'error',
  'wcag/h36': 'error',
  'wcag/h37': 'error',
  'wcag/h63': 'error',
  'wcag/h67': 'error',
  'wcag/h71': 'error',
} as const

/** Exact static rule set, exported so evidence can pin what one config version means. */
export const HTML_VALIDATE_RULES: Readonly<Record<keyof typeof RULES, 'error' | 'warn'>> = RULES

const STANDARDS: Readonly<Record<keyof typeof RULES, readonly AccessibilityStandard[]>> = {
  'area-alt': [WCAG.nonTextContent],
  'aria-hidden-body': [WCAG.infoAndRelationships, WCAG.nameRoleValue],
  'aria-label-misuse': [WAI_ARIA_STANDARD, WCAG.nameRoleValue],
  'empty-heading': [WCAG.infoAndRelationships, WCAG.headingsAndLabels],
  'empty-title': [WCAG.pageTitled],
  'hidden-focusable': [WCAG.keyboard, WCAG.nameRoleValue],
  'input-missing-label': [WCAG.infoAndRelationships, WCAG.labelsOrInstructions, WCAG.nameRoleValue],
  'meta-refresh': [WCAG.timingAdjustable],
  'multiple-labeled-controls': [WCAG.infoAndRelationships, WCAG.nameRoleValue],
  'no-abstract-role': [WAI_ARIA_STANDARD, WCAG.nameRoleValue],
  'no-autoplay': [WCAG.audioControl, WCAG.pauseStopHide],
  'no-implicit-button-type': [HTML_STANDARD],
  'no-missing-references': [HTML_STANDARD, WAI_ARIA_STANDARD],
  'no-multiple-main': [HTML_STANDARD, WCAG.infoAndRelationships],
  'prefer-native-element': [HTML_STANDARD, WCAG.nameRoleValue],
  'text-content': [WCAG.nameRoleValue],
  'unique-landmark': [WCAG.infoAndRelationships, WCAG.bypassBlocks],
  'wcag/h30': [WCAG.linkPurpose],
  'wcag/h32': [WCAG.onInput],
  'wcag/h36': [WCAG.nonTextContent],
  'wcag/h37': [WCAG.nonTextContent],
  'wcag/h63': [WCAG.infoAndRelationships],
  'wcag/h67': [WCAG.nonTextContent],
  'wcag/h71': [WCAG.infoAndRelationships, WCAG.labelsOrInstructions],
}

const CONFIG = {
  root: true,
  elements: ['html5'],
  rules: RULES,
} satisfies ConfigData

function validateRuleInventory(): void {
  const missing = Object.keys(RULES).filter(ruleId => !ruleExists(ruleId))
  if (missing.length > 0) {
    throw new Error(`html-validate ${htmlValidateVersion} is missing configured rules: ${missing.join(', ')}`)
  }
}

function findingFromMessage(message: Message): AccessibilityEngineFinding {
  const standards = STANDARDS[message.ruleId as keyof typeof RULES]
  if (standards === undefined) {
    throw new Error(`html-validate returned unversioned rule "${message.ruleId}"`)
  }
  if (message.severity !== Severity.ERROR && message.severity !== Severity.WARN) {
    throw new Error(`html-validate returned unsupported severity for "${message.ruleId}"`)
  }
  return {
    ruleId: message.ruleId,
    severity: message.severity === Severity.ERROR ? 'error' : 'warning',
    message: message.message,
    line: message.line,
    column: message.column,
    ...message.selector === null ? {} : { selector: message.selector },
    ...message.ruleUrl === undefined ? {} : { documentationUrl: message.ruleUrl },
    standards,
  }
}

/** Create the offline static-HTML engine. It never loads checked-project config or plugins. */
export function createHtmlValidateEngine(): AccessibilityEngine {
  validateRuleInventory()
  const validator = new HtmlValidate(CONFIG)
  return {
    id: 'html-validate',
    version: htmlValidateVersion,
    configVersion: HTML_VALIDATE_CONFIG_VERSION,
    targetKinds: ['web-static'],
    async check(source, signal) {
      signal?.throwIfAborted()
      const report = await validator.validateString(source.content, source.path)
      signal?.throwIfAborted()
      return {
        findings: report.results.flatMap(result => result.messages.map(findingFromMessage)),
      }
    },
  }
}
