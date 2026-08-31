// @vitest-environment jsdom
import axe from 'axe-core'
import { cleanup, fireEvent, render, waitFor } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { AccessibilitySection } from '../src/client/AccessibilitySection.tsx'

function translate(key: string, params?: Record<string, unknown>) {
  const suffix = params === undefined ? '' : ` ${Object.values(params).join(' ')}`
  return `${key}${suffix}`
}

afterEach(() => {
  cleanup()
  document.body.replaceChildren()
  document.documentElement.removeAttribute('lang')
  document.title = ''
  Reflect.deleteProperty(navigator, 'clipboard')
})

describe('rendered accessibility settings section', () => {
  it('has no automatically detectable axe violations', async () => {
    document.documentElement.lang = 'en'
    document.title = 'DeepSeek Harness accessibility test'
    render(
      <>
        <nav aria-label="Primary navigation"><a href="#main">Conversation</a></nav>
        <main id="main">
          <h1>DeepSeek Harness</h1>
          <AccessibilitySection t={translate as never} />
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

  it('tracks the latest focus outside the inspector without persisting or exporting it', async () => {
    const view = render(
      <>
        <button aria-label="Private account control" aria-expanded="true">Account</button>
        <button aria-label="Second external control">Second</button>
        <main><h1>DeepSeek Harness</h1><AccessibilitySection t={translate as never} /></main>
      </>,
    )
    fireEvent.click(view.getByRole('button', { name: 'inspector.start' }))
    const target = view.getByRole('button', { name: 'Private account control' })
    target.focus()

    await waitFor(() => {
      expect(view.getByText('Private account control')).toBeTruthy()
      expect(view.getByText('aria-expanded=true')).toBeTruthy()
    })
    expect(view.container.textContent).toContain('button')
    fireEvent.click(view.getByRole('button', { name: 'inspector.stop' }))
    expect(view.getByText('inspector.status.off')).toBeTruthy()
    view.getByRole('button', { name: 'Second external control' }).focus()
    expect(view.getByText('Private account control')).toBeTruthy()
    expect(view.queryByText('Second external control', { selector: 'dd' })).toBeNull()
  })

  it('offers a deterministic guidance exercise without enabling current-page export', async () => {
    const view = render(
      <main><h1>Private current page</h1><AccessibilitySection t={translate as never} /></main>,
    )
    fireEvent.click(view.getByRole('button', { name: 'audit.example.run' }))
    expect(await view.findByText('audit.summary.fail 1 17')).toBeTruthy()
    expect(view.getByText('check.controls')).toBeTruthy()
    expect(view.getByText('audit.example.boundary')).toBeTruthy()
    expect(view.queryByRole('button', { name: 'audit.export.copy' })).toBeNull()
    fireEvent.click(view.getByText('audit.help.show'))
    expect(view.getByText('check.help.controls')).toBeTruthy()
  })

  it('copies only the allowlisted redacted report after an explicit action', async () => {
    const writeText = vi.fn().mockResolvedValue(undefined)
    Object.defineProperty(navigator, 'clipboard', {
      configurable: true,
      value: { writeText },
    })
    document.title = 'Private customer conversation'
    const view = render(
      <>
        <nav aria-label="Private workspace navigation"><a href="#main">Customer Alpha</a></nav>
        <main id="main">
          <h1>DeepSeek Harness</h1>
          <AccessibilitySection t={translate as never} />
        </main>
      </>,
    )

    fireEvent.click(view.getByRole('button', { name: 'audit.run' }))
    expect(writeText).not.toHaveBeenCalled()
    expect(view.queryByRole('button', { name: 'audit.export.copy' })).toBeNull()
    fireEvent.click(view.getByRole('button', { name: 'audit.export.prepare' }))
    expect(view.getByText('audit.export.preview')).toBeTruthy()
    expect(writeText).not.toHaveBeenCalled()
    fireEvent.click(await view.findByRole('button', { name: 'audit.export.copy' }))
    await waitFor(() => { expect(writeText).toHaveBeenCalledTimes(1) })
    const copied = writeText.mock.calls[0]?.[0] as string
    const report = JSON.parse(copied) as Record<string, unknown>
    expect(report).toMatchObject({
      protocol: 'dsh-accessibility-diagnostic/1.0.0-draft',
      scope: 'current-document-structure',
      claim: 'none',
    })
    expect(copied).not.toMatch(/Private customer|Customer Alpha|workspace navigation|localhost/iu)
    expect(view.getByText('audit.export.success')).toBeTruthy()

    writeText.mockRejectedValueOnce(new Error('denied'))
    fireEvent.click(view.getByRole('button', { name: 'audit.export.copy' }))
    await waitFor(() => { expect(view.getByText('audit.export.failure')).toBeTruthy() })
  })
})
