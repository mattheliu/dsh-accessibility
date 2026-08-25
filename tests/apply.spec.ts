import { describe, expect, it, vi } from 'vitest'
import { apply, inject } from '../src/client/index.tsx'
import { AccessibilitySection } from '../src/client/AccessibilitySection.tsx'

describe('client registration', () => {
  it('waits for the settings slot and registers the additive section', () => {
    const register = vi.fn(() => () => {})
    const localeRegister = vi.fn(() => () => {})
    const ctx = {
      effect: vi.fn((setup: () => unknown) => setup()),
      locale: {
        register: localeRegister,
        bind: () => (key: string) => key,
      },
      slots: {
        inject: vi.fn((name: string, setup: () => unknown) => {
          expect(name).toBe('settings.section')
          return setup()
        }),
        register,
      },
    }

    apply(ctx as never)

    expect(inject).toEqual(['slots', 'locale'])
    expect(localeRegister).toHaveBeenCalledWith('accessibility', expect.objectContaining({ zh: expect.any(Object), en: expect.any(Object) }))
    expect(register).toHaveBeenCalledWith({
      name: 'settings.section',
      id: 'accessibility',
      order: 40,
      label: expect.any(Function),
      locale: 'accessibility',
    }, AccessibilitySection)
  })
})
