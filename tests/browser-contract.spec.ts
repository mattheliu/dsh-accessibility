import { describe, expect, it } from 'vitest'
import {
  NON_AT_BROWSER_PROTOCOL, parseCssTimeList, transitionCanMove,
} from '../scripts/browser-contract.e2e-helper.ts'

describe('non-AT browser evidence contract', () => {
  it('keeps a versioned draft protocol', () => {
    expect(NON_AT_BROWSER_PROTOCOL).toBe('dsh-non-at-browser/1.0.0-draft')
  })

  it('normalizes CSS time lists', () => {
    expect(parseCssTimeList('0s, 120ms, 0.25s')).toEqual([0, 120, 250])
    expect(parseCssTimeList('none')).toEqual([0])
  })

  it('distinguishes motion-capable transitions from paint-only transitions', () => {
    expect(transitionCanMove('transform')).toBe(true)
    expect(transitionCanMove('all')).toBe(true)
    expect(transitionCanMove('margin-left')).toBe(true)
    expect(transitionCanMove('opacity')).toBe(false)
    expect(transitionCanMove('background-color')).toBe(false)
  })
})
