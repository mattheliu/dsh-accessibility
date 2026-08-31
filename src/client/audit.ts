/** Stable order and identifier set for the versioned diagnostic report. */
export const ACCESSIBILITY_CHECK_IDS = [
  'main',
  'navigation',
  'heading',
  'controls',
  'images',
  'lists',
  'nested-interactive',
  'references',
  'composer',
  'message-log',
  'menus',
  'listboxes',
  'tree-keyboard',
  'radio-keyboard',
  'tabs',
  'dialogs',
  'separators',
] as const

export type AccessibilityCheckId = typeof ACCESSIBILITY_CHECK_IDS[number]

/** One deterministic page-level accessibility diagnostic. */
export interface AccessibilityCheck {
  id: AccessibilityCheckId
  passed: boolean
  affected: number
}

function textFromReferences(element: Element, ids: string): string {
  return ids.split(/\s+/u)
    .map(id => element.ownerDocument.getElementById(id)?.textContent?.trim() ?? '')
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

function hasAssociatedLabel(element: Element): boolean {
  if (element.closest('label') !== null) return true
  const id = element.getAttribute('id')
  if (id === null || id === '') return false
  return [...element.ownerDocument.querySelectorAll('label')]
    .some(label => label.htmlFor === id && (label.textContent?.trim() ?? '') !== '')
}

/** Conservative accessible-name approximation for the native controls DSH uses. */
export function hasAccessibleName(element: Element): boolean {
  if (hasAuthorName(element)) return true
  if (element.matches('img')) return element.hasAttribute('alt')
  if (element.matches('input, textarea, select') && hasAssociatedLabel(element)) return true
  const title = element.getAttribute('title')?.trim()
  if (title !== undefined && title !== '') return true
  return (element.textContent?.trim() ?? '') !== ''
}

function inAuditScope(element: Element): boolean {
  return !element.matches('[hidden], input[type="hidden"]')
    && element.closest('[aria-hidden="true"]') === null
}

function scoped(root: ParentNode, selector: string): Element[] {
  return [...root.querySelectorAll(selector)].filter(inAuditScope)
}

function unique(elements: readonly Element[]): Element[] {
  return [...new Set(elements)]
}

function directRoleDescendants(element: Element, role: 'menuitem' | 'option'): Element[] {
  const ownerRole = role === 'menuitem' ? 'menu' : 'listbox'
  return [...element.querySelectorAll(`[role="${role}"]`)]
    .filter(candidate => candidate.closest(`[role="${ownerRole}"]`) === element)
    .filter(inAuditScope)
}

function isEnabled(element: Element): boolean {
  return !element.matches(':disabled, [aria-disabled="true"]')
}

function tabIndexOf(element: Element): number | null {
  const value = element.getAttribute('tabindex')
  if (value === null) return null
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : null
}

function referencesMissing(element: Element, attribute: string): boolean {
  if (attribute === 'aria-controls' && element.getAttribute('aria-expanded') === 'false') return false
  const ids = element.getAttribute(attribute)?.trim()
  if (ids === undefined || ids === '') return false
  return ids.split(/\s+/u).some(id => element.ownerDocument.getElementById(id) === null)
}

function check(id: AccessibilityCheckId, affected: readonly unknown[]): AccessibilityCheck {
  return { id, passed: affected.length === 0, affected: affected.length }
}

/** Inspect stable semantic contracts without relying on generated CSS classes. */
export function runAccessibilityAudit(root: ParentNode = document): AccessibilityCheck[] {
  const composers = scoped(root, 'textarea')
  const logs = scoped(root, '[role="log"]')
  const trees = scoped(root, '[role="tree"]')
  const dialogs = scoped(root, '[role="dialog"], [role="alertdialog"]')
  const menus = scoped(root, '[role="menu"]')
  const listboxes = scoped(root, '[role="listbox"]')
  const radioGroups = scoped(root, '[role="radiogroup"]')
  const tabLists = scoped(root, '[role="tablist"]')
  const adjustableSeparators = scoped(root, '[role="separator"][aria-orientation]')
  const controls = scoped(root, 'button, [role="button"], a[href], input, select')
  const images = scoped(root, 'img, [role="img"]')
  const references = scoped(root, '[aria-labelledby], [aria-describedby], [aria-controls], [aria-activedescendant]')
  const levelOneHeadings = scoped(root, 'h1, [role="heading"][aria-level="1"]')

  const invalidNativeLists = scoped(root, 'ul, ol').filter(list => (
    [...list.children].some(child => !child.matches('li, script, template'))
  ))
  const orphanedListItems = scoped(root, 'li, [role="listitem"]').filter((item) => {
    if (item.matches('li')) return item.closest('ul, ol, menu') === null
    return item.closest('[role="list"], ul, ol, menu') === null
  })

  const interactiveSelector = [
    'button',
    'a[href]',
    '[role="button"]',
    '[role="link"]',
    '[role="checkbox"]',
    '[role="menuitem"]',
    '[role="menuitemradio"]',
    '[role="menuitemcheckbox"]',
    '[role="radio"]',
    '[role="switch"]',
    '[role="tab"]',
  ].join(', ')
  const nestedInteractive = scoped(root, interactiveSelector).filter(element => (
    scoped(element, interactiveSelector).length > 0
  ))

  const unnamedControls = controls.filter(element => !hasAccessibleName(element))
  const unnamedImages = images.filter(element => !hasAccessibleName(element))
  const brokenReferences = references.filter(element => (
    referencesMissing(element, 'aria-labelledby')
    || referencesMissing(element, 'aria-describedby')
    || referencesMissing(element, 'aria-controls')
    || referencesMissing(element, 'aria-activedescendant')
  ))
  const unnamedComposers = composers.filter(element => !hasAccessibleName(element))
  const unnamedLogs = logs.filter(element => !hasAuthorName(element))

  const brokenMenus = menus.filter((menu) => {
    const items = [...menu.querySelectorAll('[role="menuitem"], [role="menuitemradio"], [role="menuitemcheckbox"]')]
      .filter(candidate => candidate.closest('[role="menu"]') === menu)
      .filter(inAuditScope)
      .filter(isEnabled)
    return !hasAuthorName(menu) || items.some(item => tabIndexOf(item) !== -1)
  })
  const brokenListboxes = listboxes.filter((listbox) => {
    const options = directRoleDescendants(listbox, 'option').filter(isEnabled)
    const controllers = [
      listbox,
      ...controls.filter(element => (
        element.getAttribute('aria-controls')?.split(/\s+/u).includes(listbox.id) === true
      )),
    ]
    const controller = controllers.find(element => tabIndexOf(element) === 0
      || element.matches('input:not(:disabled), textarea:not(:disabled), button:not(:disabled)'))
    const activeId = controller?.getAttribute('aria-activedescendant')
    return !hasAuthorName(listbox)
      || options.some(option => !hasAccessibleName(option))
      || (options.length > 0 && (
        controller === undefined
        || activeId === null
        || activeId === undefined
        || listbox.ownerDocument.getElementById(activeId)?.closest('[role="listbox"]') !== listbox
      ))
  })
  const keyboardlessTrees = trees.filter((tree) => {
    const managed = [...tree.querySelectorAll('[role="treeitem"]')]
      .filter(candidate => candidate.closest('[role="tree"]') === tree)
      .filter(inAuditScope)
      .filter(isEnabled)
    return managed.length > 0 && (
      managed.some(item => tabIndexOf(item) === null)
      || managed.filter(item => tabIndexOf(item) === 0).length !== 1
    )
  })
  const brokenRadioGroups = radioGroups.filter((group) => {
    const radios = [...group.querySelectorAll('[role="radio"]')]
      .filter(candidate => candidate.closest('[role="radiogroup"]') === group)
      .filter(inAuditScope)
      .filter(isEnabled)
    return !hasAuthorName(group)
      || radios.some(radio => !hasAccessibleName(radio))
      || (radios.length > 0 && radios.filter(radio => tabIndexOf(radio) === 0).length !== 1)
  })
  const brokenTabLists = tabLists.filter((tabList) => {
    const tabs = [...tabList.querySelectorAll('[role="tab"]')]
      .filter(tab => tab.closest('[role="tablist"]') === tabList)
      .filter(inAuditScope)
      .filter(isEnabled)
    return !hasAuthorName(tabList)
      || tabs.some(tab => !hasAccessibleName(tab) || referencesMissing(tab, 'aria-controls'))
      || (tabs.length > 0 && (
        tabs.filter(tab => tab.getAttribute('aria-selected') === 'true').length !== 1
        || tabs.filter(tab => tabIndexOf(tab) === 0).length !== 1
      ))
  })
  const unnamedDialogs = dialogs.filter(element => !hasAuthorName(element))
  const unusableSeparators = adjustableSeparators.filter(element => (
    tabIndexOf(element) !== 0
    || !hasAuthorName(element)
    || !element.hasAttribute('aria-valuemin')
    || !element.hasAttribute('aria-valuemax')
    || !element.hasAttribute('aria-valuenow')
  ))

  const mainMissing = root.querySelector('main') === null ? [root] : []
  const navigationMissing = root.querySelector('nav, aside[aria-label], aside[aria-labelledby]') === null ? [root] : []
  const invalidHeading = levelOneHeadings.length === 1 && hasAccessibleName(levelOneHeadings[0]!)
    ? []
    : levelOneHeadings.length === 0 ? [root] : levelOneHeadings
  return [
    check('main', mainMissing),
    check('navigation', navigationMissing),
    check('heading', invalidHeading),
    check('controls', unnamedControls),
    check('images', unnamedImages),
    check('lists', unique([...invalidNativeLists, ...orphanedListItems])),
    check('nested-interactive', nestedInteractive),
    check('references', brokenReferences),
    check('composer', unnamedComposers),
    check('message-log', unnamedLogs),
    check('menus', brokenMenus),
    check('listboxes', brokenListboxes),
    check('tree-keyboard', keyboardlessTrees),
    check('radio-keyboard', brokenRadioGroups),
    check('tabs', brokenTabLists),
    check('dialogs', unnamedDialogs),
    check('separators', unusableSeparators),
  ]
}
