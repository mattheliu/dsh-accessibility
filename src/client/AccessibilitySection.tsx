import { useEffect, useRef, useState } from 'react'
import type { CSSProperties } from 'react'
import type { PropsLocale, PropsRuntime } from '@deepseek-ai/dsh-client-ui-slots'
import type {} from '@deepseek-ai/dsh-client-ui-settings/client'
import { runAccessibilityAudit, runSyntheticAccessibilityExample } from './audit.ts'
import type { AccessibilityCheck } from './audit.ts'
import { redactedDiagnosticReportText } from './diagnostic-report.ts'
import { inspectFocusedElement, type FocusInspection } from './focus-inspector.ts'
import type { AccessibilityKey } from './locales.ts'

type AccessibilitySectionProps = PropsRuntime<'settings.section'> & PropsLocale<'accessibility'>

const sectionStyle: CSSProperties = {
  display: 'flex', flexDirection: 'column', gap: 16, color: 'var(--dsw-alias-label-primary)',
}
const cardStyle: CSSProperties = {
  padding: 16, border: '1px solid var(--dsw-alias-border-l2)', borderRadius: 12,
  background: 'var(--dsw-alias-bg-layer-1)',
}
const buttonStyle: CSSProperties = {
  minHeight: 36, padding: '8px 14px', border: '1px solid var(--dsw-alias-border-l2)',
  borderRadius: 8, background: 'var(--dsw-alias-bg-layer-2)', color: 'inherit', cursor: 'pointer',
}

type CopyState = 'idle' | 'success' | 'failure'

function checkHelpKey(id: AccessibilityCheck['id']): AccessibilityKey {
  return `check.help.${id}` as AccessibilityKey
}

/** Settings page contributed through DSH's canonical additive section slot. */
export function AccessibilitySection({ t }: AccessibilitySectionProps) {
  const [checks, setChecks] = useState<AccessibilityCheck[] | null>(null)
  const [exampleChecks, setExampleChecks] = useState<AccessibilityCheck[] | null>(null)
  const [reportPreview, setReportPreview] = useState<string | null>(null)
  const [copyState, setCopyState] = useState<CopyState>('idle')
  const [trackingFocus, setTrackingFocus] = useState(false)
  const [inspection, setInspection] = useState<FocusInspection | null>(null)
  const inspectorRef = useRef<HTMLElement>(null)
  const failed = checks?.filter(check => !check.passed).length ?? 0
  const exampleFailed = exampleChecks?.filter(check => !check.passed).length ?? 0
  const summary = checks === null
    ? t('audit.idle')
    : failed === 0
      ? t('audit.summary.pass', { count: checks.length })
      : t('audit.summary.fail', { failed, count: checks.length })

  useEffect(() => {
    if (!trackingFocus) return
    const inspect = (event: FocusEvent) => {
      const target = event.target
      if (!(target instanceof Element) || inspectorRef.current?.contains(target) === true) return
      setInspection(inspectFocusedElement(target))
    }
    document.addEventListener('focusin', inspect, true)
    return () => { document.removeEventListener('focusin', inspect, true) }
  }, [trackingFocus])

  async function copyReport(): Promise<void> {
    if (reportPreview === null) return
    try {
      const clipboard = globalThis.navigator?.clipboard
      if (clipboard === undefined) throw new Error('clipboard unavailable')
      await clipboard.writeText(reportPreview)
      setCopyState('success')
    } catch {
      setCopyState('failure')
    }
  }

  return (
    <section style={sectionStyle} aria-labelledby="dsh-accessibility-title">
      <div>
        <h2 id="dsh-accessibility-title" style={{ margin: 0 }}>{t('title')}</h2>
        <p>{t('intro')}</p>
        <p><strong>{t('compatibility')}</strong></p>
      </div>

      <section style={cardStyle} aria-labelledby="dsh-accessibility-audit-title">
        <h3 id="dsh-accessibility-audit-title" style={{ marginTop: 0 }}>{t('audit.title')}</h3>
        <p>{t('audit.description')}</p>
        <button type="button" style={buttonStyle} onClick={() => {
          setChecks(runAccessibilityAudit())
          setReportPreview(null)
          setCopyState('idle')
        }}>
          {t('audit.run')}
        </button>
        <p role="status" aria-live="polite">{summary}</p>
        {checks !== null && (
          <ul>
            {checks.map(check => (
              <li key={check.id}>
                <strong>{t(`check.${check.id}`)}</strong>: {t(check.passed ? 'audit.pass' : 'audit.fail')}
                {!check.passed && ` — ${t('check.affected', { count: check.affected })}`}
                {!check.passed && (
                  <details>
                    <summary>{t('audit.help.show')}</summary>
                    <p>{t(checkHelpKey(check.id))}</p>
                  </details>
                )}
              </li>
            ))}
          </ul>
        )}
        {checks !== null && (
          <div aria-labelledby="dsh-accessibility-export-title">
            <h4 id="dsh-accessibility-export-title">{t('audit.export.title')}</h4>
            <p>{t('audit.export.description')}</p>
            <button type="button" style={buttonStyle} onClick={() => {
              setReportPreview(redactedDiagnosticReportText(checks))
              setCopyState('idle')
            }}>
              {t('audit.export.prepare')}
            </button>
            {reportPreview !== null && (
              <div>
                <h5 id="dsh-accessibility-export-preview-title">{t('audit.export.preview')}</h5>
                <pre role="region" tabIndex={0} aria-labelledby="dsh-accessibility-export-preview-title">
                  {reportPreview}
                </pre>
                <button type="button" style={buttonStyle} onClick={() => { void copyReport() }}>
                  {t('audit.export.copy')}
                </button>
              </div>
            )}
            <p role="status" aria-live="polite">
              {copyState === 'success'
                ? t('audit.export.success')
                : copyState === 'failure'
                  ? t('audit.export.failure')
                  : ''}
            </p>
          </div>
        )}
        <div aria-labelledby="dsh-accessibility-example-title">
          <h4 id="dsh-accessibility-example-title">{t('audit.example.title')}</h4>
          <p>{t('audit.example.description')}</p>
          <button
            type="button"
            style={buttonStyle}
            onClick={() => { setExampleChecks(runSyntheticAccessibilityExample()) }}
          >
            {t('audit.example.run')}
          </button>
          {exampleChecks !== null && (
            <div>
              <p role="status" aria-live="polite">
                {t('audit.summary.fail', { failed: exampleFailed, count: exampleChecks.length })}
              </p>
              <ul>
                {exampleChecks.filter(check => !check.passed).map(check => (
                  <li key={check.id}>
                    <strong>{t(`check.${check.id}`)}</strong>: {t('audit.fail')}
                    {` — ${t('check.affected', { count: check.affected })}`}
                    <details>
                      <summary>{t('audit.help.show')}</summary>
                      <p>{t(checkHelpKey(check.id))}</p>
                    </details>
                  </li>
                ))}
              </ul>
              <p>{t('audit.example.boundary')}</p>
            </div>
          )}
        </div>
      </section>

      <section ref={inspectorRef} style={cardStyle} aria-labelledby="dsh-accessibility-inspector-title">
        <h3 id="dsh-accessibility-inspector-title" style={{ marginTop: 0 }}>{t('inspector.title')}</h3>
        <p>{t('inspector.description')}</p>
        <p>{t('inspector.privacy')}</p>
        <button
          type="button"
          style={buttonStyle}
          aria-pressed={trackingFocus}
          onClick={() => { setTrackingFocus(value => !value) }}
        >
          {t(trackingFocus ? 'inspector.stop' : 'inspector.start')}
        </button>
        <p role="status" aria-live="polite">
          {t(trackingFocus ? 'inspector.status.on' : 'inspector.status.off')}
        </p>
        {inspection === null
          ? <p>{t('inspector.empty')}</p>
          : (
              <div aria-labelledby="dsh-accessibility-inspector-result-title">
                <h4 id="dsh-accessibility-inspector-result-title">{t('inspector.result')}</h4>
                <dl>
                  <dt>{t('inspector.element')}</dt><dd><code>{inspection.element}</code></dd>
                  <dt>{t('inspector.role')}</dt><dd><code>{inspection.role}</code></dd>
                  <dt>{t('inspector.name')}</dt>
                  <dd>{inspection.name === null ? t('inspector.none') : inspection.name}</dd>
                  <dt>{t('inspector.nameSource')}</dt><dd><code>{inspection.nameSource}</code></dd>
                  <dt>{t('inspector.tabIndex')}</dt><dd><code>{inspection.tabIndex}</code></dd>
                  <dt>{t('inspector.states')}</dt>
                  <dd>
                    {inspection.states.length === 0
                      ? t('inspector.none')
                      : (
                          <ul>
                            {inspection.states.map(state => (
                              <li key={state.name}><code>{state.name}={state.value}</code></li>
                            ))}
                          </ul>
                        )}
                  </dd>
                </dl>
                <p>{t('inspector.limitation')}</p>
              </div>
            )}
      </section>

      <section style={cardStyle} aria-labelledby="dsh-accessibility-guide-title">
        <h3 id="dsh-accessibility-guide-title" style={{ marginTop: 0 }}>{t('guide.title')}</h3>
        <ol>
          <li>{t('guide.voiceover')}</li>
          <li>{t('guide.windows')}</li>
          <li>{t('guide.dialog')}</li>
          <li>{t('guide.composer')}</li>
          <li>{t('guide.resize')}</li>
          <li>{t('guide.menu')}</li>
          <li>{t('guide.questions')}</li>
          <li>{t('guide.timeline')}</li>
          <li>{t('guide.feedback')}</li>
        </ol>
        <a href="https://github.com/deepseek-ai/deepseek-harness/discussions/4546" target="_blank" rel="noreferrer">
          {t('discussion')}
        </a>
      </section>
    </section>
  )
}
