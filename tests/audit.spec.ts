// @vitest-environment jsdom
import { afterEach, describe, expect, it } from 'vitest'
import { hasAuthorName, runAccessibilityAudit } from '../src/client/audit.ts'

afterEach(() => { document.body.replaceChildren() })

describe('accessibility diagnostics', () => {
  it('recognizes aria-label and aria-labelledby names', () => {
    const title = document.createElement('h2')
    title.id = 'title'
    title.textContent = 'Named'
    const labelled = document.createElement('div')
    labelled.setAttribute('aria-labelledby', 'title')
    const direct = document.createElement('div')
    direct.setAttribute('aria-label', 'Direct')
    document.body.append(title, labelled, direct)
    expect(hasAuthorName(labelled)).toBe(true)
    expect(hasAuthorName(direct)).toBe(true)
    expect(hasAuthorName(document.body)).toBe(false)
  })

  it('passes the patched DSH semantic baseline and reports regressions', () => {
    document.body.innerHTML = `
      <aside aria-label="Primary navigation"></aside>
      <main>
        <div role="log" aria-label="Conversation messages"></div>
        <div role="tree"><div role="treeitem" tabindex="0">Session</div></div>
        <textarea aria-label="Message input"></textarea>
        <div role="separator" aria-label="Resize sidebar" tabindex="0"></div>
      </main>
      <h2 id="dialog-title">Settings</h2>
      <div role="dialog" aria-labelledby="dialog-title"></div>
    `
    expect(runAccessibilityAudit().every(check => check.passed)).toBe(true)

    document.querySelector('textarea')?.removeAttribute('aria-label')
    document.querySelector('[role="treeitem"]')?.removeAttribute('tabindex')
    const failed = runAccessibilityAudit().filter(check => !check.passed).map(check => check.id)
    expect(failed).toEqual(['composer', 'tree-keyboard'])
  })

  it('treats absent optional surfaces and an empty session tree as not applicable', () => {
    document.body.innerHTML = `
      <aside aria-label="Primary navigation"></aside>
      <main><div role="tree"><p>No sessions yet</p></div></main>
    `

    expect(runAccessibilityAudit().every(check => check.passed)).toBe(true)
  })
})
