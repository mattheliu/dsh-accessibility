import { describe, expect, it, vi } from 'vitest'
import { apply, inject } from '../src/client/index.tsx'
import { AccessibilitySection } from '../src/client/AccessibilitySection.tsx'

describe('client registration', () => {
  it('waits for the owned slots and registers additive settings and conversation entries', async () => {
    const register = vi.fn(() => () => {})
    const localeRegister = vi.fn(() => () => {})
    const loadOlder = vi.fn(async () => {})
    const ctx = {
      effect: vi.fn((setup: () => unknown) => setup()),
      locale: {
        register: localeRegister,
        bind: () => (key: string) => key,
      },
      slots: {
        inject: vi.fn((name: string, setup: () => unknown) => {
          expect(['settings.section', 'conversation.view']).toContain(name)
          return setup()
        }),
        register,
      },
      sessions: {
        binding: vi.fn(() => ({ session: { loadOlder } })),
      },
    }

    apply(ctx as never)

    expect(inject).toEqual(['slots', 'locale', 'sessions'])
    expect(localeRegister).toHaveBeenCalledWith('accessibility', expect.objectContaining({ zh: expect.any(Object), en: expect.any(Object) }))
    expect(register).toHaveBeenCalledWith({
      name: 'settings.section',
      id: 'accessibility',
      order: 40,
      label: expect.any(Function),
      locale: 'accessibility',
    }, AccessibilitySection)
    expect(register).toHaveBeenCalledWith(expect.objectContaining({
      name: 'conversation.view',
      id: 'accessible',
      order: 40,
      label: expect.any(Function),
      locale: 'accessibility',
      inject: expect.any(Function),
    }), expect.any(Function))

    const viewOptions = register.mock.calls.find(([options]) => options.name === 'conversation.view')?.[0] as any
    const injected = viewOptions.inject('session-1')
    await injected.loadOlder()
    expect(ctx.sessions.binding).toHaveBeenCalledWith('session-1')
    expect(loadOlder).toHaveBeenCalledOnce()
  })
})
