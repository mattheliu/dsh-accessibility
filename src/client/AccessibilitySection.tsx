import { useState } from 'react'
import type { CSSProperties } from 'react'
import type { PropsLocale, PropsRuntime } from '@deepseek-ai/dsh-client-ui-slots'
import type {} from '@deepseek-ai/dsh-client-ui-settings/client'
import { runAccessibilityAudit } from './audit.ts'
import type { AccessibilityCheck } from './audit.ts'

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

/** Settings page contributed through DSH's canonical additive section slot. */
export function AccessibilitySection({ t }: AccessibilitySectionProps) {
  const [checks, setChecks] = useState<AccessibilityCheck[] | null>(null)
  const failed = checks?.filter(check => !check.passed).length ?? 0
  const summary = checks === null
    ? t('audit.idle')
    : failed === 0
      ? t('audit.summary.pass', { count: checks.length })
      : t('audit.summary.fail', { failed, count: checks.length })

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
        <button type="button" style={buttonStyle} onClick={() => { setChecks(runAccessibilityAudit()) }}>
          {t('audit.run')}
        </button>
        <p role="status" aria-live="polite">{summary}</p>
        {checks !== null && (
          <ul>
            {checks.map(check => (
              <li key={check.id}>
                <strong>{t(`check.${check.id}`)}</strong>: {t(check.passed ? 'audit.pass' : 'audit.fail')}
                {!check.passed && ` — ${t('check.affected', { count: check.affected })}`}
              </li>
            ))}
          </ul>
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
