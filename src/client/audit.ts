/** One deterministic page-level accessibility diagnostic. */
export interface AccessibilityCheck {
  id: 'main' | 'navigation' | 'composer' | 'message-log' | 'tree-keyboard' | 'dialogs' | 'separators'
  passed: boolean
  affected: number
}

function textFromReferences(element: Element, ids: string): string {
  return ids.split(/\s+/u)
    .map(id => document.getElementById(id)?.textContent?.trim() ?? '')
    .filter(Boolean)
    .join(' ')
}

/** Whether an element has an author-provided accessible name. */
export function hasAuthorName(element: Element): boolean {
  const label = element.getAttribute('aria-label')?.trim()
  if (label !== undefined && label !== '') return true
  const labelledBy = element.getAttribute('aria-labelledby')?.trim()
  return labelledBy !== undefined && labelledBy !== '' && textFromReferences(element, labelledBy) !== ''
}

/** Inspect stable semantic contracts without relying on hashed CSS classes. */
export function runAccessibilityAudit(root: ParentNode = document): AccessibilityCheck[] {
  const composers = [...root.querySelectorAll('textarea')]
  const logs = [...root.querySelectorAll('[role="log"]')]
  const trees = [...root.querySelectorAll('[role="tree"]')]
  const dialogs = [...root.querySelectorAll('[role="dialog"]')]
  const separators = [...root.querySelectorAll('[role="separator"]')]
  const unnamedComposers = composers.filter(element => !hasAuthorName(element))
  const unnamedLogs = logs.filter(element => !hasAuthorName(element))
  const keyboardlessTrees = trees.filter(tree =>
    tree.querySelector('[role="treeitem"]') !== null
    && tree.querySelector('[role="treeitem"][tabindex="0"]') === null)
  const unnamedDialogs = dialogs.filter(element => !hasAuthorName(element))
  const unusableSeparators = separators.filter(element =>
    element.getAttribute('tabindex') !== '0' || !hasAuthorName(element))

  return [
    { id: 'main', passed: root.querySelector('main') !== null, affected: root.querySelector('main') === null ? 1 : 0 },
    {
      id: 'navigation',
      passed: root.querySelector('nav, aside[aria-label], aside[aria-labelledby]') !== null,
      affected: root.querySelector('nav, aside[aria-label], aside[aria-labelledby]') === null ? 1 : 0,
    },
    { id: 'composer', passed: unnamedComposers.length === 0, affected: unnamedComposers.length },
    { id: 'message-log', passed: unnamedLogs.length === 0, affected: unnamedLogs.length },
    { id: 'tree-keyboard', passed: trees.length === 0 || keyboardlessTrees.length === 0, affected: keyboardlessTrees.length },
    { id: 'dialogs', passed: unnamedDialogs.length === 0, affected: unnamedDialogs.length },
    { id: 'separators', passed: separators.length === 0 || unusableSeparators.length === 0, affected: unusableSeparators.length },
  ]
}
