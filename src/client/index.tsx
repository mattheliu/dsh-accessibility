import type { ClientContext } from '@deepseek-ai/dsh-client-runtime/client'
import type {} from '@deepseek-ai/dsh-client-locale/client'
import type {} from '@deepseek-ai/dsh-client-ui-settings/client'
import { AccessibilitySection } from './AccessibilitySection.tsx'
import { en, zh, type AccessibilityKey } from './locales.ts'

declare module '@deepseek-ai/dsh-client-ui-slots' {
  interface LocaleNamespaceMap {
    accessibility: AccessibilityKey
  }
}

export { AccessibilitySection } from './AccessibilitySection.tsx'
export { hasAccessibleName, hasAuthorName, runAccessibilityAudit } from './audit.ts'
export type { AccessibilityCheck } from './audit.ts'
export type { AccessibilityKey } from './locales.ts'

export const inject = ['slots', 'locale']

/** Register the diagnostics page only after the Settings shell declares its slot. */
export function apply(ctx: ClientContext): void {
  ctx.effect(() => ctx.locale.register('accessibility', { zh, en }), 'dsh-accessibility: dictionaries')
  const t = ctx.locale.bind('accessibility')
  ctx.slots.inject('settings.section', () => ctx.slots.register({
    name: 'settings.section',
    id: 'accessibility',
    order: 40,
    label: () => t('nav'),
    locale: 'accessibility',
  }, AccessibilitySection))
}
