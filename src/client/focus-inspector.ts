export type FocusNameSource =
  | 'aria-label'
  | 'aria-labelledby'
  | 'label'
  | 'alt'
  | 'value'
  | 'title'
  | 'content'
  | 'none'

export interface FocusState {
  name: string
  value: string
}

/** Ephemeral local snapshot. It is deliberately excluded from report export. */
export interface FocusInspection {
  element: string
  role: string
  name: string | null
  nameSource: FocusNameSource
  tabIndex: number
  states: FocusState[]
}

const STATE_ATTRIBUTES = [
  'aria-expanded',
  'aria-selected',
  'aria-checked',
  'aria-pressed',
  'aria-current',
  'aria-disabled',
  'aria-invalid',
  'aria-busy',
  'aria-haspopup',
  'aria-valuenow',
  'aria-valuemin',
  'aria-valuemax',
  'aria-valuetext',
] as const

function boundedText(value: string | null | undefined): string | null {
  if (value === null || value === undefined) return null
  const normalized = value.replace(/[\u0000-\u001f\u007f-\u009f\s]+/gu, ' ').trim()
  if (normalized === '') return null
  return normalized.length <= 200 ? normalized : `${normalized.slice(0, 199)}…`
}

function referencedText(element: Element): string | null {
  const ids = element.getAttribute('aria-labelledby')?.trim()
  if (ids === undefined || ids === '') return null
  return boundedText(ids.split(/\s+/u)
    .map(id => element.ownerDocument.getElementById(id)?.textContent ?? '')
    .join(' '))
}

function labelText(element: Element): string | null {
  const wrapping = boundedText(element.closest('label')?.textContent)
  if (wrapping !== null) return wrapping
  const id = element.getAttribute('id')
  if (id === null || id === '') return null
  const associated = [...element.ownerDocument.querySelectorAll('label')]
    .find(label => label.htmlFor === id)
  return boundedText(associated?.textContent)
}

function focusName(element: Element): { name: string | null, source: FocusNameSource } {
  const ariaLabel = boundedText(element.getAttribute('aria-label'))
  if (ariaLabel !== null) return { name: ariaLabel, source: 'aria-label' }
  const labelledBy = referencedText(element)
  if (labelledBy !== null) return { name: labelledBy, source: 'aria-labelledby' }
  const label = labelText(element)
  if (label !== null) return { name: label, source: 'label' }
  if (element.matches('img')) {
    const alt = boundedText(element.getAttribute('alt'))
    return { name: alt, source: alt === null ? 'none' : 'alt' }
  }
  if (element.matches('input[type="image"]')) {
    const alt = boundedText(element.getAttribute('alt'))
    return { name: alt, source: alt === null ? 'none' : 'alt' }
  }
  if (element.matches('input[type="button"], input[type="submit"], input[type="reset"]')) {
    const value = boundedText(element.getAttribute('value'))
    if (value !== null) return { name: value, source: 'value' }
  }
  const title = boundedText(element.getAttribute('title'))
  if (title !== null) return { name: title, source: 'title' }
  if (element.matches('button, a[href], [role="button"], [role="link"], summary')) {
    const content = boundedText(element.textContent)
    if (content !== null) return { name: content, source: 'content' }
  }
  return { name: null, source: 'none' }
}

function implicitRole(element: Element): string {
  const tag = element.tagName.toLowerCase()
  if (tag === 'button') return 'button'
  if (tag === 'summary') return 'button'
  if (tag === 'a' && element.hasAttribute('href')) return 'link'
  if (tag === 'textarea') return 'textbox'
  if (tag === 'select') return element.hasAttribute('multiple') ? 'listbox' : 'combobox'
  if (tag === 'img') return 'img'
  if (tag === 'nav') return 'navigation'
  if (tag === 'main') return 'main'
  if (tag === 'dialog') return 'dialog'
  if (/^h[1-6]$/u.test(tag)) return 'heading'
  if (tag === 'ul' || tag === 'ol') return 'list'
  if (tag === 'li') return 'listitem'
  if (tag === 'input') {
    const type = element.getAttribute('type')?.toLowerCase() ?? 'text'
    if (type === 'checkbox') return 'checkbox'
    if (type === 'radio') return 'radio'
    if (['button', 'submit', 'reset', 'image'].includes(type)) return 'button'
    if (type === 'range') return 'slider'
    if (type === 'number') return 'spinbutton'
    if (type === 'search') return 'searchbox'
    if (type === 'hidden') return 'generic'
    return 'textbox'
  }
  return 'generic'
}

function exposedRole(element: Element): string {
  const explicit = element.getAttribute('role')?.trim().split(/\s+/u)[0]
  return explicit === undefined || explicit === '' ? implicitRole(element) : explicit
}

function states(element: Element): FocusState[] {
  const output = STATE_ATTRIBUTES.flatMap((attribute): FocusState[] => {
    const value = boundedText(element.getAttribute(attribute))
    return value === null ? [] : [{ name: attribute, value }]
  })
  if (element.matches(':disabled') && !output.some(state => state.name === 'aria-disabled')) {
    output.push({ name: 'disabled', value: 'true' })
  }
  if (element.matches('input:checked') && !output.some(state => state.name === 'aria-checked')) {
    output.push({ name: 'checked', value: 'true' })
  }
  return output
}

/** Inspect only the focused element's accessibility-facing surface. */
export function inspectFocusedElement(element: Element): FocusInspection {
  const name = focusName(element)
  const tabIndex = element instanceof HTMLElement ? element.tabIndex : -1
  return {
    element: element.tagName.toLowerCase(),
    role: exposedRole(element),
    name: name.name,
    nameSource: name.source,
    tabIndex,
    states: states(element),
  }
}
