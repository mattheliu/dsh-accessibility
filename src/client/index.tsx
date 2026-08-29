import type { ClientContext } from '@deepseek-ai/dsh-client-runtime/client'
import type {} from '@deepseek-ai/dsh-client-locale/client'
import type {} from '@deepseek-ai/dsh-client-ui-conversation/client'
import type {} from '@deepseek-ai/dsh-client-ui-settings/client'
import { AccessibilitySection } from './AccessibilitySection.tsx'
import { AccessibleView, type AccessibleViewInjected } from './AccessibleView.tsx'
import { en, zh, type AccessibilityKey } from './locales.ts'

declare module '@deepseek-ai/dsh-client-ui-slots' {
  interface LocaleNamespaceMap {
    accessibility: AccessibilityKey
  }
}

export { AccessibilitySection } from './AccessibilitySection.tsx'
export { AccessibleView } from './AccessibleView.tsx'
export { conversationNodeKey, messageClipboardText } from './accessible-conversation.ts'
export { hasAccessibleName, hasAuthorName, runAccessibilityAudit } from './audit.ts'
export type { AccessibilityCheck } from './audit.ts'
export type { AccessibilityKey } from './locales.ts'

export const inject = ['slots', 'locale', 'sessions']

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

  ctx.slots.inject('conversation.view', () => ctx.slots.register({
    name: 'conversation.view',
    id: 'accessible',
    order: 40,
    label: () => t('view.nav'),
    locale: 'accessibility',
    inject: (sessionId): AccessibleViewInjected => ({
      loadOlder: async () => {
        const binding = ctx.sessions.binding(sessionId)
        if (binding === undefined) throw new Error('dsh-accessibility: session is unavailable')
        await binding.session.loadOlder()
      },
    }),
  }, AccessibleView))
}
