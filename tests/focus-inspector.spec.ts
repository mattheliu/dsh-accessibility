// @vitest-environment jsdom
import { afterEach, describe, expect, it } from 'vitest'
import { inspectFocusedElement } from '../src/client/focus-inspector.ts'

afterEach(() => { document.body.replaceChildren() })

describe('ephemeral focus inspector', () => {
  it('reports an explicit role, bounded accessible name, Tab position, and allowlisted states', () => {
    document.body.innerHTML = `
      <button id="private-id" class="hashed-private-class" role="menuitem"
        aria-label="  Open   account  " aria-expanded="true" aria-haspopup="menu"
        data-secret="never expose" tabindex="0">Ignored content</button>
    `
    const button = document.querySelector('button')!
    const result = inspectFocusedElement(button)
    expect(result).toEqual({
      element: 'button',
      role: 'menuitem',
      name: 'Open account',
      nameSource: 'aria-label',
      tabIndex: 0,
      states: [
        { name: 'aria-expanded', value: 'true' },
        { name: 'aria-haspopup', value: 'menu' },
      ],
    })
    expect(JSON.stringify(result)).not.toMatch(/private-id|hashed-private-class|never expose/iu)
  })

  it('resolves labelledby, wrapping labels, associated labels, alternatives, titles, and content', () => {
    document.body.innerHTML = `
      <span id="name">Account settings</span>
      <div role="button" aria-labelledby="name"></div>
      <label>Search <input id="wrapped"></label>
      <label for="separate">Email</label><input id="separate">
      <img id="image" alt="Project diagram">
      <div id="titled" title="More details"></div>
      <a id="link" href="#target">Read documentation</a>
      <img id="decorative" alt="">
    `
    expect(inspectFocusedElement(document.querySelector('[role="button"]')!)).toMatchObject({
      name: 'Account settings', nameSource: 'aria-labelledby',
    })
    expect(inspectFocusedElement(document.querySelector('#wrapped')!)).toMatchObject({
      name: 'Search', nameSource: 'label', role: 'textbox',
    })
    expect(inspectFocusedElement(document.querySelector('#separate')!)).toMatchObject({
      name: 'Email', nameSource: 'label',
    })
    expect(inspectFocusedElement(document.querySelector('#image')!)).toMatchObject({
      name: 'Project diagram', nameSource: 'alt', role: 'img',
    })
    expect(inspectFocusedElement(document.querySelector('#titled')!)).toMatchObject({
      name: 'More details', nameSource: 'title', role: 'generic',
    })
    expect(inspectFocusedElement(document.querySelector('#link')!)).toMatchObject({
      name: 'Read documentation', nameSource: 'content', role: 'link',
    })
    expect(inspectFocusedElement(document.querySelector('#decorative')!)).toMatchObject({
      name: null, nameSource: 'none',
    })
  })

  it('infers common native roles and native checked or disabled states', () => {
    document.body.innerHTML = `
      <input id="check" type="checkbox" checked disabled>
      <input id="radio" type="radio">
      <input id="submit" type="submit" value="Save">
      <input id="image-input" type="image" alt="Upload image">
      <input id="range" type="range"><input id="number" type="number">
      <input id="search" type="search"><input id="hidden" type="hidden">
      <textarea id="text"></textarea>
      <select id="combo"></select><select id="list" multiple></select>
      <nav></nav><main></main><dialog></dialog><h2>Heading</h2><ol></ol><li>Item</li>
    `
    expect(inspectFocusedElement(document.querySelector('#check')!)).toMatchObject({
      role: 'checkbox',
      states: [{ name: 'disabled', value: 'true' }, { name: 'checked', value: 'true' }],
    })
    expect(inspectFocusedElement(document.querySelector('#radio')!).role).toBe('radio')
    expect(inspectFocusedElement(document.querySelector('#submit')!)).toMatchObject({
      role: 'button', name: 'Save', nameSource: 'value',
    })
    expect(inspectFocusedElement(document.querySelector('#image-input')!)).toMatchObject({
      role: 'button', name: 'Upload image', nameSource: 'alt',
    })
    expect(inspectFocusedElement(document.querySelector('#range')!).role).toBe('slider')
    expect(inspectFocusedElement(document.querySelector('#number')!).role).toBe('spinbutton')
    expect(inspectFocusedElement(document.querySelector('#search')!).role).toBe('searchbox')
    expect(inspectFocusedElement(document.querySelector('#hidden')!).role).toBe('generic')
    expect(inspectFocusedElement(document.querySelector('#text')!).role).toBe('textbox')
    expect(inspectFocusedElement(document.querySelector('#combo')!).role).toBe('combobox')
    expect(inspectFocusedElement(document.querySelector('#list')!).role).toBe('listbox')
    expect(inspectFocusedElement(document.querySelector('nav')!).role).toBe('navigation')
    expect(inspectFocusedElement(document.querySelector('main')!).role).toBe('main')
    expect(inspectFocusedElement(document.querySelector('dialog')!).role).toBe('dialog')
    expect(inspectFocusedElement(document.querySelector('h2')!).role).toBe('heading')
    expect(inspectFocusedElement(document.querySelector('ol')!).role).toBe('list')
    expect(inspectFocusedElement(document.querySelector('li')!).role).toBe('listitem')
  })

  it('bounds control characters and long text without exposing element markup', () => {
    const button = document.createElement('button')
    button.textContent = `  Save\u0000  ${'x'.repeat(300)}`
    document.body.append(button)
    const result = inspectFocusedElement(button)
    expect(result.name).toHaveLength(200)
    expect(result.name).toMatch(/^Save x+/u)
    expect(result.name?.endsWith('…')).toBe(true)
    expect(JSON.stringify(result)).not.toContain('<button')
  })
})
