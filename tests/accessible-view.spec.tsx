// @vitest-environment jsdom
import axe from 'axe-core'
import { act, cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
import type { ComponentProps } from 'react'
import type { ConversationSnapshot } from '@deepseek-ai/dsh-client-runtime/client'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { AccessibleView } from '../src/client/AccessibleView.tsx'
import { en } from '../src/client/locales.ts'

const userNode = {
  kind: 'user',
  seq: 1,
  time: Date.UTC(2026, 7, 30, 1, 2, 3),
  content: [
    { type: 'text', text: '# Visible prompt\n\nRun `pnpm test`.' },
    { type: 'image', attachment: { id: 'private-image' } },
  ],
  source: { username: 'private-user', cwd: '/private/workspace' },
} as const

const contextNode = {
  kind: 'context',
  seq: 2,
  time: Date.UTC(2026, 7, 30, 1, 2, 4),
  content: [{ type: 'text', text: 'Private context content' }],
  source: { env: 'SECRET_ENV' },
  provenance: { role: 'system', producer: 'fixture' },
  form: null,
} as const

const assistantNode = {
  kind: 'assistant',
  seq: 3,
  time: Date.UTC(2026, 7, 30, 1, 2, 5),
  turn: 1,
  step: 1,
  blocks: [
    { kind: 'text', text: '## Visible answer\n\nDone.' },
    { kind: 'reasoning', text: 'Private reasoning content' },
    { kind: 'tool-call', callId: 'call-1', name: 'read', argsRaw: '{"path":"/private/path"}' },
  ],
} as const

const toolNode = {
  kind: 'tool-result',
  seq: 4,
  time: Date.UTC(2026, 7, 30, 1, 2, 6),
  callId: 'call-1',
  call: { name: 'read', argsRaw: '{"path":"/private/path"}' },
  callTime: Date.UTC(2026, 7, 30, 1, 2, 5),
  content: [{ type: 'text', text: 'Private tool output' }],
  isError: false,
  callView: null,
  resultView: null,
  subCalls: [],
} as const

function snapshot(overrides: Partial<ConversationSnapshot> = {}): ConversationSnapshot {
  return {
    nodes: [userNode, contextNode, assistantNode, toolNode],
    running: false,
    partial: null,
    queue: [],
    pending: [],
    runningCalls: [],
    hasMore: true,
    loadingOlder: false,
    openState: 'open',
    promptError: null,
    removed: false,
    ...overrides,
  } as unknown as ConversationSnapshot
}

function translate(key: keyof typeof en, params?: Record<string, unknown>): string {
  let result: string = en[key]
  for (const [name, value] of Object.entries(params ?? {})) {
    result = result.replaceAll(`{${name}}`, String(value))
  }
  return result
}

function viewProps(value: ConversationSnapshot, loadOlder = vi.fn(async () => {})) {
  const selected: unknown[] = []
  const useSession = <S,>(selector: (current: ConversationSnapshot) => S): S => {
    const selection = selector(value)
    selected.push(selection)
    return selection
  }
  return {
    props: { useSession, loadOlder, t: translate } as unknown as ComponentProps<typeof AccessibleView>,
    selected,
    loadOlder,
  }
}

beforeEach(() => {
  document.documentElement.lang = 'en'
  Object.defineProperty(navigator, 'clipboard', {
    configurable: true,
    value: { writeText: vi.fn(async () => {}) },
  })
})

afterEach(() => {
  cleanup()
  document.body.replaceChildren()
  document.documentElement.removeAttribute('lang')
  vi.restoreAllMocks()
})

describe('AccessibleView', () => {
  it('requires explicit loading, preserves semantic content, and restores focus when cleared', async () => {
    const fixture = viewProps(snapshot())
    render(<AccessibleView {...fixture.props} />)

    expect(screen.queryByText('Visible prompt')).toBeNull()
    expect(screen.queryByText('Private context content')).toBeNull()
    expect(fixture.selected.at(-1)).toBeNull()

    const load = screen.getByRole('button', { name: 'Load reading view' })
    fireEvent.click(load)

    const heading = await screen.findByRole('heading', { level: 2, name: 'Accessible reading view' })
    await waitFor(() => { expect(document.activeElement).toBe(heading) })
    expect(screen.getByRole('heading', { name: 'Visible prompt' })).toBeTruthy()
    expect(screen.getByText('pnpm test')).toBeTruthy()
    expect(screen.getByText('Image attachment: this projection has no text alternative available to read.')).toBeTruthy()
    expect(screen.queryByText('Private context content')).toBeNull()
    expect(screen.queryByText('Private reasoning content')).toBeNull()
    expect(screen.queryByText('{"path":"/private/path"}')).toBeNull()
    expect(screen.queryByText('Private tool output')).toBeNull()

    fireEvent.click(screen.getByRole('button', { name: 'Clear reading view and return' }))
    const restored = await screen.findByRole('button', { name: 'Load reading view' })
    await waitFor(() => { expect(document.activeElement).toBe(restored) })
    expect(screen.queryByText('Visible prompt')).toBeNull()
    expect(fixture.selected.at(-1)).toBeNull()
  })

  it('mounts context, reasoning, tool arguments, and tool output only after separate disclosures', async () => {
    const fixture = viewProps(snapshot())
    render(<AccessibleView {...fixture.props} />)
    fireEvent.click(screen.getByRole('button', { name: 'Load reading view' }))

    fireEvent.click(await screen.findByRole('button', { name: 'Show context content' }))
    expect(screen.getByText('Private context content')).toBeTruthy()

    fireEvent.click(screen.getByRole('button', { name: 'Show reasoning content' }))
    expect(screen.getByText('Private reasoning content')).toBeTruthy()

    fireEvent.click(screen.getByRole('button', { name: 'Show tool arguments' }))
    expect(screen.getByText('{"path":"/private/path"}')).toBeTruthy()

    fireEvent.click(screen.getByRole('button', { name: 'Show tool output' }))
    expect(screen.getByText('Private tool output')).toBeTruthy()
  })

  it('copies only the addressed visible message and announces clipboard outcomes', async () => {
    const fixture = viewProps(snapshot())
    render(<AccessibleView {...fixture.props} />)
    fireEvent.click(screen.getByRole('button', { name: 'Load reading view' }))

    const copy = await screen.findByRole('button', {
      name: 'Copy visible message text from record 1, Your message',
    })
    fireEvent.click(copy)

    await waitFor(() => {
      expect(navigator.clipboard.writeText).toHaveBeenCalledWith('# Visible prompt\n\nRun `pnpm test`.')
    })
    expect((await screen.findByRole('status')).textContent).toBe('Message 1 was copied to the system clipboard.')
  })

  it('renders the in-progress assistant record at the end without turning the transcript into a live region', async () => {
    const fixture = viewProps(snapshot({
      running: true,
      partial: {
        turn: 2,
        step: 1,
        blocks: [{ kind: 'text', text: 'Streaming answer in progress' }],
      },
    }))
    render(<AccessibleView {...fixture.props} />)
    fireEvent.click(screen.getByRole('button', { name: 'Load reading view' }))

    const list = await screen.findByRole('list', { name: 'Conversation records in source order' })
    expect(list.getAttribute('aria-live')).toBe('off')
    expect(screen.getByText('Assistant response in progress').closest('article')?.getAttribute('aria-busy')).toBe('true')
    expect(screen.getByText('Streaming answer in progress')).toBeTruthy()
    expect(screen.getByRole('status').textContent).toContain('the assistant is responding')
  })

  it('supports history pagination and reports recoverable failures without raw error data', async () => {
    const loadOlder = vi.fn()
      .mockRejectedValueOnce(new Error('/private/path should not render'))
      .mockResolvedValueOnce(undefined)
    const fixture = viewProps(snapshot(), loadOlder)
    render(<AccessibleView {...fixture.props} />)
    fireEvent.click(screen.getByRole('button', { name: 'Load reading view' }))

    const older = await screen.findByRole('button', { name: 'Load older records' })
    fireEvent.click(older)
    expect(await screen.findByText('Older records could not be loaded. Retry or return to Chat.')).toBeTruthy()
    expect(screen.queryByText('/private/path should not render')).toBeNull()

    fireEvent.click(older)
    expect(await screen.findByText('The older-records request completed.')).toBeTruthy()
    expect(loadOlder).toHaveBeenCalledTimes(2)
  })

  it('ignores an older-history result after the reading view is cleared', async () => {
    let finishOlder: (() => void) | undefined
    const loadOlder = vi.fn(() => new Promise<void>((resolve) => { finishOlder = resolve }))
    const fixture = viewProps(snapshot(), loadOlder)
    render(<AccessibleView {...fixture.props} />)
    fireEvent.click(screen.getByRole('button', { name: 'Load reading view' }))

    const older = await screen.findByRole('button', { name: 'Load older records' })
    fireEvent.click(older)
    expect((screen.getByRole('button', { name: 'Loading older records…' }) as HTMLButtonElement).disabled).toBe(true)

    fireEvent.click(screen.getByRole('button', { name: 'Clear reading view and return' }))
    await act(async () => { finishOlder?.() })

    expect((await screen.findByRole('status')).textContent).toBe('Conversation content has not been loaded.')
    expect(screen.queryByText('The older-records request completed.')).toBeNull()
  })

  it('has no automatically detectable axe violations before or after loading', async () => {
    const fixture = viewProps(snapshot({ hasMore: false }))
    const { container } = render(<AccessibleView {...fixture.props} />)
    const initial = await axe.run(container, { rules: { 'color-contrast': { enabled: false } } })
    expect(initial.violations, JSON.stringify(initial.violations, null, 2)).toHaveLength(0)

    fireEvent.click(screen.getByRole('button', { name: 'Load reading view' }))
    await screen.findByRole('list', { name: 'Conversation records in source order' })
    const loaded = await axe.run(container, { rules: { 'color-contrast': { enabled: false } } })
    expect(loaded.violations, JSON.stringify(loaded.violations, null, 2)).toHaveLength(0)
  })
})
