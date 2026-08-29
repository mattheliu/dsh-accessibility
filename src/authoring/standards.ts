import type { AccessibilityStandard, HumanReviewRequirement } from './types.js'

function wcag(criterion: string, level: 'A' | 'AA'): AccessibilityStandard {
  const slugByCriterion: Record<string, string> = {
    '1.1.1': 'non-text-content',
    '1.3.1': 'info-and-relationships',
    '1.4.2': 'audio-control',
    '1.4.3': 'contrast-minimum',
    '1.4.11': 'non-text-contrast',
    '2.1.1': 'keyboard',
    '2.2.1': 'timing-adjustable',
    '2.2.2': 'pause-stop-hide',
    '2.4.1': 'bypass-blocks',
    '2.4.2': 'page-titled',
    '2.4.4': 'link-purpose-in-context',
    '2.4.6': 'headings-and-labels',
    '2.4.7': 'focus-visible',
    '3.2.2': 'on-input',
    '3.3.2': 'labels-or-instructions',
    '4.1.2': 'name-role-value',
    '4.1.3': 'status-messages',
  }
  const slug = slugByCriterion[criterion]
  if (slug === undefined) throw new Error(`missing WCAG URL slug for ${criterion}`)
  return {
    id: `WCAG 2.2 SC ${criterion}`,
    level,
    url: `https://www.w3.org/WAI/WCAG22/Understanding/${slug}`,
  }
}

export const WCAG = {
  nonTextContent: wcag('1.1.1', 'A'),
  infoAndRelationships: wcag('1.3.1', 'A'),
  audioControl: wcag('1.4.2', 'A'),
  contrastMinimum: wcag('1.4.3', 'AA'),
  nonTextContrast: wcag('1.4.11', 'AA'),
  keyboard: wcag('2.1.1', 'A'),
  timingAdjustable: wcag('2.2.1', 'A'),
  pauseStopHide: wcag('2.2.2', 'A'),
  bypassBlocks: wcag('2.4.1', 'A'),
  pageTitled: wcag('2.4.2', 'A'),
  linkPurpose: wcag('2.4.4', 'A'),
  headingsAndLabels: wcag('2.4.6', 'AA'),
  focusVisible: wcag('2.4.7', 'AA'),
  onInput: wcag('3.2.2', 'A'),
  labelsOrInstructions: wcag('3.3.2', 'A'),
  nameRoleValue: wcag('4.1.2', 'A'),
  statusMessages: wcag('4.1.3', 'AA'),
} as const

export const HTML_STANDARD: AccessibilityStandard = {
  id: 'HTML Living Standard',
  level: 'specification',
  url: 'https://html.spec.whatwg.org/',
}

export const WAI_ARIA_STANDARD: AccessibilityStandard = {
  id: 'WAI-ARIA 1.2',
  level: 'specification',
  url: 'https://www.w3.org/TR/wai-aria-1.2/',
}

/** Human evidence that a static source validator cannot supply. */
export const HUMAN_REVIEW_REQUIREMENTS: readonly HumanReviewRequirement[] = [
  {
    id: 'alternative-quality',
    reason: 'Automation can detect a missing text alternative but cannot determine whether the supplied alternative communicates equivalent purpose.',
    standards: [WCAG.nonTextContent],
  },
  {
    id: 'contrast-and-visual-presentation',
    reason: 'Static HTML alone does not expose computed colors, focus indicators, zoom reflow, forced-colors behavior, or content hidden by layout.',
    standards: [WCAG.contrastMinimum, WCAG.nonTextContrast, WCAG.focusVisible],
  },
  {
    id: 'keyboard-and-dynamic-state',
    reason: 'Keyboard order, focus lifecycle, dynamic names and states, announcements, and timing require the rendered application and task execution.',
    standards: [WCAG.keyboard, WCAG.focusVisible, WCAG.nameRoleValue, WCAG.statusMessages],
  },
  {
    id: 'assistive-technology-interoperability',
    reason: 'Browser accessibility API mappings and spoken or braille output require named real assistive-technology combinations.',
    standards: [WCAG.nameRoleValue],
  },
  {
    id: 'disabled-user-task-validation',
    reason: 'Only consented disabled-user research can show whether representative tasks are independently effective, understandable, and safe.',
    standards: [],
  },
]

export const STATIC_CHECK_LIMITATIONS: readonly string[] = [
  'The engine reads static HTML only; it does not execute scripts or inspect a rendered DOM.',
  'The engine does not load CSS, images, media, network resources, project configuration, or third-party rule modules from the checked project.',
  'A passing automated outcome does not establish WCAG conformance, assistive-technology support, or usability by disabled people.',
  'Model explanations and repair suggestions are separate from this deterministic report and must be reviewed before any file is changed.',
]
