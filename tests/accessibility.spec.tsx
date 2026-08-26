// @vitest-environment jsdom
import axe from 'axe-core'
import { cleanup, render } from '@testing-library/react'
import { afterEach, describe, expect, it } from 'vitest'
import { AccessibilitySection } from '../src/client/AccessibilitySection.tsx'

afterEach(() => {
  cleanup()
  document.body.replaceChildren()
  document.documentElement.removeAttribute('lang')
  document.title = ''
})

describe('rendered accessibility settings section', () => {
  it('has no automatically detectable axe violations', async () => {
    document.documentElement.lang = 'en'
    document.title = 'DeepSeek Harness accessibility test'
    const t = (key: string, params?: Record<string, unknown>) => {
      const suffix = params === undefined ? '' : ` ${Object.values(params).join(' ')}`
      return `${key}${suffix}`
    }

    render(
      <>
        <nav aria-label="Primary navigation"><a href="#main">Conversation</a></nav>
        <main id="main">
          <AccessibilitySection t={t as never} />
        </main>
      </>,
    )

    const result = await axe.run(document, {
      rules: {
        // jsdom has no layout or computed color pipeline; browser CI owns contrast.
        'color-contrast': { enabled: false },
      },
    })
    expect(result.violations, JSON.stringify(result.violations, null, 2)).toHaveLength(0)
  })
})
