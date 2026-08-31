// @vitest-environment jsdom
import { afterEach, describe, expect, it } from 'vitest'
import {
  hasAccessibleName,
  hasAuthorName,
  runAccessibilityAudit,
  runSyntheticAccessibilityExample,
} from '../src/client/audit.ts'

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

    const textButton = document.createElement('button')
    textButton.textContent = 'Save'
    const image = document.createElement('img')
    image.alt = ''
    document.body.append(textButton, image)
    expect(hasAccessibleName(textButton)).toBe(true)
    expect(hasAccessibleName(image)).toBe(true)
  })

  it('passes the patched DSH semantic baseline and reports regressions', () => {
    document.body.innerHTML = `
      <aside aria-label="Primary navigation"></aside>
      <main>
        <h1>DSH application</h1>
        <div role="list"><div><div role="listitem">Plugin</div></div></div>
        <div role="log" aria-label="Conversation messages"></div>
        <button aria-controls="menu" aria-expanded="true">Actions</button>
        <div id="menu" role="menu" aria-label="Actions">
          <button role="menuitem" tabindex="-1">Rename</button>
          <div role="separator"></div>
        </div>
        <div id="list" role="listbox" aria-label="Events" tabindex="0" aria-activedescendant="event-1">
          <span id="event-1" role="option" aria-selected="true">First event</span>
        </div>
        <div role="tree" aria-label="Sessions">
          <div role="treeitem" tabindex="0">Session</div>
          <div role="treeitem" tabindex="-1">Other session</div>
        </div>
        <div role="radiogroup" aria-label="Mode">
          <button role="radio" aria-checked="true" tabindex="0">Fast</button>
          <button role="radio" aria-checked="false" tabindex="-1">Careful</button>
        </div>
        <div role="tablist" aria-label="Views">
          <button role="tab" aria-selected="true" aria-controls="panel-a" tabindex="0">Chat</button>
          <button role="tab" aria-selected="false" aria-controls="panel-b" tabindex="-1">Trajectory</button>
        </div>
        <div id="panel-a" role="tabpanel">Chat panel</div>
        <div id="panel-b" role="tabpanel" hidden>Trajectory panel</div>
        <textarea aria-label="Message input"></textarea>
        <div role="separator" aria-label="Resize sidebar" tabindex="0"></div>
        <div role="separator" aria-label="Resize details" aria-orientation="vertical"
          aria-valuemin="200" aria-valuemax="800" aria-valuenow="400" tabindex="0"></div>
        <img alt="Project avatar">
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

  it('reports composite-widget, naming, image, and ARIA-reference regressions separately', () => {
    document.body.innerHTML = `
      <aside aria-label="Primary navigation"></aside><main>
        <h1>DSH application</h1>
        <button aria-label=""></button>
        <img>
        <div role="menu" aria-label="Actions"><button role="menuitem" tabindex="0">Bad item</button></div>
        <div id="list" role="listbox" aria-label="Options" tabindex="0" aria-activedescendant="missing">
          <span role="option">Choice</span>
        </div>
        <div role="radiogroup" aria-label="Mode">
          <button role="radio" tabindex="0">A</button><button role="radio" tabindex="0">B</button>
        </div>
        <div role="tablist" aria-label="Views">
          <button role="tab" aria-selected="true" aria-controls="missing-panel" tabindex="0">A</button>
          <button role="tab" aria-selected="false" tabindex="0">B</button>
        </div>
      </main>
    `

    const failed = runAccessibilityAudit().filter(result => !result.passed).map(result => result.id)
    expect(failed).toEqual([
      'controls', 'images', 'references', 'menus', 'listboxes', 'radio-keyboard', 'tabs',
    ])
  })

  it('treats absent optional surfaces and an empty session tree as not applicable', () => {
    document.body.innerHTML = `
      <aside aria-label="Primary navigation"></aside>
      <main><h1>DSH application</h1><div role="tree"><p>No sessions yet</p></div></main>
    `

    expect(runAccessibilityAudit().every(check => check.passed)).toBe(true)
  })

  it('reports missing headings, invalid native lists, orphaned list items, and nested controls', () => {
    document.body.innerHTML = `
      <aside aria-label="Primary navigation"></aside>
      <main>
        <ul><div><li>Wrapped plugin</li></div></ul>
        <div role="listitem">Orphaned plugin</div>
        <div role="button">Read <button>Open file</button></div>
      </main>
    `

    const failed = runAccessibilityAudit().filter(result => !result.passed).map(result => result.id)
    expect(failed).toEqual(['heading', 'lists', 'nested-interactive'])
  })

  it('provides a detached, deterministic one-defect human guidance exercise', () => {
    document.body.innerHTML = '<main><h1>Private current page</h1><button>Do not inspect me</button></main>'
    const result = runSyntheticAccessibilityExample()
    expect(result).toHaveLength(17)
    expect(result.filter(check => !check.passed)).toEqual([
      { id: 'controls', passed: false, affected: 1 },
    ])
    expect(document.body.textContent).toContain('Private current page')
    expect(document.body.textContent).toContain('Do not inspect me')
  })
})
