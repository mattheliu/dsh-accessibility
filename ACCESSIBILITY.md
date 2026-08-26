# Accessibility support and verification

[简体中文](ACCESSIBILITY.zh.md)

This project targets operable, understandable DeepSeek Harness Web workflows for keyboard-only and screen-reader users. The companion diagnostics are additive evidence; the owning DSH components remain responsible for semantics, focus, keyboard models, and announcements.

## Supported core

- Official baseline: `@deepseek-ai/dsh@0.1.1-rc.2`.
- Complete patched build: [`dsh-v0.1.1-rc.2-a11y.3`](https://github.com/omdsh-dev/deepseek-harness/releases/tag/dsh-v0.1.1-rc.2-a11y.3).
- Upstream tracking: [deepseek-ai/deepseek-harness Discussion #4546](https://github.com/deepseek-ai/deepseek-harness/discussions/4546).

Installing this npm package into an unpatched official build adds diagnostics and guidance, but cannot replace missing core focus or composite-widget behavior.

## Assistive-technology matrix

| Platform | Browser | Assistive technology | Status |
| --- | --- | --- | --- |
| macOS | Chrome 151 | VoiceOver | Browser accessibility-tree and keyboard regression passed; complete spoken-output record pending |
| macOS | Safari 18.5 | VoiceOver | Native accessibility-tree and keyboard regression passed; complete spoken-output record pending |
| Windows 11 | Chrome / Firefox | NVDA | Automated Windows gate passed; physical screen-reader regression pending |
| Windows 11 | Edge / Chrome | JAWS | Automated Windows gate passed; physical screen-reader regression pending |
| Windows 11 | Edge | Narrator | Recommended compatibility signal; not a replacement for NVDA or JAWS |

## Recorded macOS evidence

The 2026-08-26 regression used macOS 15.5 (24F74), Chrome 151.0.7922.170, and Safari 18.5. On the patched production build, the native Safari accessibility tree exposed named navigation, main and complementary landmarks, conversation log and message articles, the Chat/Trajectory tab set, timeline composites, menus, dialogs, composer controls, and adjustable separators. Keyboard checks covered tab switching, menu dismissal, a forty-Tab modal-containment loop, collapsed-search exclusion and Escape restoration, and the named Settings trigger in the collapsed rail. The installed companion reported all fourteen deterministic diagnostics passing.

This evidence verifies browser mappings, exposed structure, and focus/key behavior available to the automation surface. It does not reliably capture every VoiceOver utterance or VoiceOver-cursor transition, so the matrix keeps the complete spoken-output record pending rather than upgrading this run into an assistive-technology certification.

## Required manual scenarios

1. Traverse landmarks and headings without visiting every control.
2. Open and close Settings, image previews, and nested dialogs; verify containment and focus return.
3. Enter the workspace and subagent trees once with Tab, then use Arrow, Home, End, Enter, and Space.
4. Operate model and action menus, submenus, typeahead, Escape, and Tab exit.
5. Operate command comboboxes and listboxes with active-descendant announcements.
6. Complete single- and multi-select questions, including custom text answers.
7. Read conversation articles, reasoning, tool output, code, tables, math, images, errors, and completion status.
8. Resize both panel separators from the keyboard and confirm value announcements.
9. Select trajectory rows and ranges, switch views, and leave composite widgets with one Tab.
10. Open feedback notes, traverse boundaries, submit or cancel, and verify returned focus.
11. Exercise offline, reconnecting, loading, authentication-error, interrupted, and retried states.
12. Repeat critical flows at 200% and 400% zoom and with reduced motion or forced colors enabled.

Record the browser, assistive-technology version, language, scenario, spoken result, focus result, and pass/fail outcome. Do not convert an automated DOM pass into a manual assistive-technology pass.

## Automated gates

- Fourteen deterministic semantic diagnostics in the installed settings page.
- Unit tests for names, references, landmarks, menus, listboxes, trees, radio groups, tabs, dialogs, and separators.
- axe-core regression for the rendered plugin settings surface.
- Cross-platform Node, type, unit, build, and package-content checks in GitHub Actions.
- The patched core retains its component, GUI, production-build, and browser-replay suites.

## Reporting

Report regressions through [GitHub Issues](https://github.com/omdsh-dev/dsh-accessibility/issues) and include the exact matrix row and scenario. Security-sensitive reports should follow [SECURITY.md](SECURITY.md).
