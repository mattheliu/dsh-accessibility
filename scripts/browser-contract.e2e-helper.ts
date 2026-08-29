/** Reusable deterministic browser assertions for DSH accessibility evidence. */
import type { Locator, Page } from 'playwright'

export const NON_AT_BROWSER_PROTOCOL = 'dsh-non-at-browser/1.0.0-draft' as const

export interface ViewportEvidence {
  label: string
  clientWidth: number
  scrollWidth: number
  overflowDelta: number
  programmaticScrollX: number
}

export interface FocusEvidence {
  label: string
  active: boolean
  focusVisible: boolean
  visibleSamples: number
  sampledPoints: number
  viewportIntersection: {
    top: number
    right: number
    bottom: number
    left: number
  }
  outlineStyle: string
  outlineWidth: string
  boxShadow: string
}

export interface ForcedColorsEvidence {
  active: boolean
  visibleElements: number
  forcedColorAdjustNone: number
  controlSamples: Array<{
    tag: string
    color: string
    backgroundColor: string
    borderColor: string
    forcedColorAdjust: string
  }>
}

export interface ReducedMotionEvidence {
  reduce: boolean
  movingTransitions: Array<{ tag: string; property: string; durationMs: number }>
  movingAnimations: Array<{ tag: string; animationName: string; durationMs: number }>
  runningMotionAnimations: number
}

/** Parse a CSS comma-separated time list into milliseconds. */
export function parseCssTimeList(value: string): number[] {
  return value.split(',').map((part) => {
    const normalized = part.trim().toLowerCase()
    if (normalized.endsWith('ms')) return Number.parseFloat(normalized.slice(0, -2))
    if (normalized.endsWith('s')) return Number.parseFloat(normalized.slice(0, -1)) * 1000
    return Number.parseFloat(normalized)
  }).map(time => Number.isFinite(time) ? time : 0)
}

/** Return true when a transition property can create perceived movement. */
export function transitionCanMove(property: string): boolean {
  const normalized = property.trim().toLowerCase()
  return /^(?:all|transform|translate|scale|rotate|top|right|bottom|left|width|height|max-width|max-height|min-width|min-height|flex-basis)$/u
    .test(normalized)
    || /^(?:offset|inset|margin|padding|grid)(?:-|$)/u.test(normalized)
}

/** Prove the document does not acquire page-level horizontal scrolling. */
export async function assertNoHorizontalPageOverflow(page: Page, label: string): Promise<ViewportEvidence> {
  const evidence = await page.evaluate((subject): ViewportEvidence => {
    const root = document.documentElement
    const body = document.body
    const scrollWidth = Math.max(root.scrollWidth, body?.scrollWidth ?? 0)
    const clientWidth = root.clientWidth
    window.scrollTo({ left: 1_000_000, top: window.scrollY, behavior: 'auto' })
    const programmaticScrollX = window.scrollX
    window.scrollTo({ left: 0, top: window.scrollY, behavior: 'auto' })
    return {
      label: subject,
      clientWidth,
      scrollWidth,
      overflowDelta: scrollWidth - clientWidth,
      programmaticScrollX,
    }
  }, label)
  if (evidence.clientWidth <= 0) throw new Error(`${label}: viewport has no measurable width`)
  if (evidence.overflowDelta > 1 || evidence.programmaticScrollX > 1) {
    throw new Error(`${label}: page-level horizontal overflow ${JSON.stringify(evidence)}`)
  }
  return evidence
}

/**
 * Prove a focused control intersects the viewport and is topmost at one or
 * more sampled points. This enforces WCAG 2.2 SC 2.4.11's minimum boundary;
 * pixel-level focus-indicator contrast remains a separate visual check.
 */
export async function assertFocusNotObscured(locator: Locator, label: string): Promise<FocusEvidence> {
  await locator.waitFor({ state: 'visible' })
  await locator.scrollIntoViewIfNeeded()
  await locator.focus()
  const evidence = await locator.evaluate((element, subject): FocusEvidence => {
    const rect = element.getBoundingClientRect()
    const intersection = {
      top: Math.max(0, rect.top),
      right: Math.min(window.innerWidth, rect.right),
      bottom: Math.min(window.innerHeight, rect.bottom),
      left: Math.max(0, rect.left),
    }
    const width = Math.max(0, intersection.right - intersection.left)
    const height = Math.max(0, intersection.bottom - intersection.top)
    const points: Array<[number, number]> = []
    if (width > 0 && height > 0) {
      for (const xRatio of [0.1, 0.5, 0.9]) {
        for (const yRatio of [0.1, 0.5, 0.9]) {
          points.push([
            intersection.left + Math.max(0.5, width * xRatio),
            intersection.top + Math.max(0.5, height * yRatio),
          ])
        }
      }
    }
    const visibleSamples = points.filter(([x, y]) => {
      const top = document.elementFromPoint(
        Math.min(window.innerWidth - 0.5, x),
        Math.min(window.innerHeight - 0.5, y),
      )
      return top !== null && (top === element || element.contains(top) || top.contains(element))
    }).length
    const style = getComputedStyle(element)
    return {
      label: subject,
      active: document.activeElement === element,
      focusVisible: element.matches(':focus-visible'),
      visibleSamples,
      sampledPoints: points.length,
      viewportIntersection: intersection,
      outlineStyle: style.outlineStyle,
      outlineWidth: style.outlineWidth,
      boxShadow: style.boxShadow,
    }
  }, label)
  if (!evidence.active) throw new Error(`${label}: requested control did not receive focus`)
  if (!evidence.focusVisible) throw new Error(`${label}: focused control does not match :focus-visible`)
  const outlineWidth = Number.parseFloat(evidence.outlineWidth)
  if ((evidence.outlineStyle === 'none' || !(outlineWidth > 0)) && evidence.boxShadow === 'none') {
    throw new Error(`${label}: no observable outline or box-shadow focus indicator ${JSON.stringify(evidence)}`)
  }
  if (evidence.sampledPoints === 0 || evidence.visibleSamples === 0) {
    throw new Error(`${label}: focused control is entirely outside or obscured ${JSON.stringify(evidence)}`)
  }
  return evidence
}

/** Inspect forced-color participation without treating emulation as an OS result. */
export async function inspectForcedColors(root: Locator): Promise<ForcedColorsEvidence> {
  const evidence = await root.evaluate((element): ForcedColorsEvidence => {
    const nodes = [element, ...element.querySelectorAll<HTMLElement>('*')]
      .filter(node => node.getClientRects().length > 0)
    const suppressed = nodes.filter(node => getComputedStyle(node).forcedColorAdjust === 'none')
    const controls = nodes.filter(node => node.matches('button, a[href], input, select, textarea, [tabindex]'))
    return {
      active: matchMedia('(forced-colors: active)').matches,
      visibleElements: nodes.length,
      forcedColorAdjustNone: suppressed.length,
      controlSamples: controls.slice(0, 12).map((node) => {
        const style = getComputedStyle(node)
        return {
          tag: node.tagName.toLowerCase(),
          color: style.color,
          backgroundColor: style.backgroundColor,
          borderColor: style.borderColor,
          forcedColorAdjust: style.forcedColorAdjust,
        }
      }),
    }
  })
  if (!evidence.active) throw new Error('forced-colors emulation did not become active')
  if (evidence.visibleElements === 0) throw new Error('forced-colors inspection root is not visible')
  if (evidence.forcedColorAdjustNone > 0) {
    throw new Error(`visible candidate content opts out of forced colors ${JSON.stringify(evidence)}`)
  }
  return evidence
}

/** Find motion-capable CSS and active keyframe motion under reduced motion. */
export async function inspectReducedMotion(root: Locator): Promise<ReducedMotionEvidence> {
  const evidence = await root.evaluate((element): ReducedMotionEvidence => {
    const nodes = [element, ...element.querySelectorAll<HTMLElement>('*')]
      .filter(node => node.getClientRects().length > 0)
    const parseTimes = (value: string): number[] => value.split(',').map((part) => {
      const normalized = part.trim().toLowerCase()
      if (normalized.endsWith('ms')) return Number.parseFloat(normalized.slice(0, -2))
      if (normalized.endsWith('s')) return Number.parseFloat(normalized.slice(0, -1)) * 1000
      return Number.parseFloat(normalized)
    }).map(time => Number.isFinite(time) ? time : 0)
    const canMove = (property: string): boolean => {
      const normalized = property.trim().toLowerCase()
      return /^(?:all|transform|translate|scale|rotate|top|right|bottom|left|width|height|max-width|max-height|min-width|min-height|flex-basis)$/u
        .test(normalized)
        || /^(?:offset|inset|margin|padding|grid)(?:-|$)/u.test(normalized)
    }
    const movingTransitions: ReducedMotionEvidence['movingTransitions'] = []
    const movingAnimations: ReducedMotionEvidence['movingAnimations'] = []
    for (const node of nodes) {
      const style = getComputedStyle(node)
      const properties = style.transitionProperty.split(',').map(value => value.trim())
      const durations = parseTimes(style.transitionDuration)
      properties.forEach((property, index) => {
        const durationMs = durations[index % Math.max(1, durations.length)] ?? 0
        if (durationMs > 10 && canMove(property)) {
          movingTransitions.push({ tag: node.tagName.toLowerCase(), property, durationMs })
        }
      })
      const names = style.animationName.split(',').map(value => value.trim())
      const animationDurations = parseTimes(style.animationDuration)
      names.forEach((animationName, index) => {
        const durationMs = animationDurations[index % Math.max(1, animationDurations.length)] ?? 0
        if (animationName !== 'none' && durationMs > 10) {
          movingAnimations.push({ tag: node.tagName.toLowerCase(), animationName, durationMs })
        }
      })
    }
    let runningMotionAnimations = 0
    for (const animation of element.getAnimations({ subtree: true })) {
      const effect = animation.effect
      if (!(effect instanceof KeyframeEffect)) continue
      const keyframes = effect.getKeyframes()
      if (keyframes.some(frame => Object.keys(frame)
        .filter(key => !['offset', 'computedOffset', 'easing', 'composite'].includes(key))
        .some(canMove))) runningMotionAnimations += 1
    }
    return {
      reduce: matchMedia('(prefers-reduced-motion: reduce)').matches,
      movingTransitions,
      movingAnimations,
      runningMotionAnimations,
    }
  })
  if (!evidence.reduce) throw new Error('reduced-motion emulation did not become active')
  if (evidence.movingTransitions.length > 0 || evidence.movingAnimations.length > 0
    || evidence.runningMotionAnimations > 0) {
    throw new Error(`candidate retains non-essential motion under reduce ${JSON.stringify(evidence)}`)
  }
  return evidence
}
