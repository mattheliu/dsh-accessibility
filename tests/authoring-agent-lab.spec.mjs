import { describe, expect, it } from 'vitest'
import { readFileSync } from 'node:fs'
import {
  assertEvidencePrivacy,
  AUTHORING_AGENT_LAB_PROTOCOL,
  parseHeadlessResult,
  validateAuthoringToolTrace,
} from '../scripts/authoring-agent-lab-lib.mjs'

let nextCallId = 0
function call(name, args, callId = `call-${String(++nextCallId)}`) {
  return { type: 'tool/call', data: { callId, name, arguments: JSON.stringify(args) } }
}

function result(callId, isError = false) {
  return {
    type: 'tool/result',
    data: {
      message: {
        source: { kind: 'tool', callId },
        content: [{ type: 'tool-result', toolCallId: callId, isError }],
      },
    },
  }
}

const validEvents = [
  call('a11y_check', { target: 'preview.authoring', contextSelector: 'main' }, 'audit-before'),
  result('audit-before'),
  call('read', { file_path: 'index.html' }, 'read-source'),
  result('read-source'),
  call('edit', { file_path: 'index.html', old_string: 'old', new_string: 'new' }, 'edit-source'),
  result('edit-source'),
  call('a11y_check', { target: 'preview.authoring', contextSelector: 'main' }, 'audit-after'),
  result('audit-after'),
]

describe('authoring agent lab evidence', () => {
  it('accepts only the bounded audit-read-edit-audit trace', () => {
    expect(AUTHORING_AGENT_LAB_PROTOCOL).toBe('dsh-a11y-authoring-agent-lab/0.1.0-draft')
    expect(validateAuthoringToolTrace(validEvents)).toEqual([
      'a11y_check', 'read', 'edit', 'a11y_check',
    ])
  })

  it('ships a machine-readable schema for the exact evidence protocol', () => {
    const schema = JSON.parse(readFileSync(new URL('../AUTHORING-AGENT-LAB.schema.json', import.meta.url), 'utf8'))
    expect(schema.properties.protocol.const).toBe(AUTHORING_AGENT_LAB_PROTOCOL)
    expect(schema.properties.task.properties.toolSequence.const).toEqual([
      'a11y_check', 'read', 'edit', 'a11y_check',
    ])
    expect(schema.$defs.beforeAudit.properties.failed.const).toBe(2)
    expect(schema.$defs.afterAudit.properties.failed.const).toBe(0)
  })

  it.each([
    [[call('read', { file_path: 'index.html' })], 'audit before'],
    [[...validEvents.slice(0, 2), call('bash', { command: 'true' })], 'out-of-scope tool'],
    [[call('a11y_check', { target: 'other', contextSelector: 'main' }, 'audit-before'), ...validEvents.slice(1)], 'unapproved target'],
    [[call('a11y_check', { target: 'preview.authoring', contextSelector: 'body' }, 'audit-before'), ...validEvents.slice(1)], 'unapproved context'],
    [[...validEvents.slice(0, 2), call('read', { file_path: 'private.txt' }, 'read-source'), ...validEvents.slice(3)], 'out-of-scope file'],
    [[...validEvents.slice(0, 5), result('edit-source', true), ...validEvents.slice(6)], 'failed tool'],
    [[validEvents[0], validEvents[1], validEvents[2], validEvents[3], validEvents[6], validEvents[7]], 'audit, read, edit'],
    [[...validEvents.slice(0, 6)], 'audit, read, edit'],
    [[{ type: 'tool/call', data: { callId: 'bad', name: 1, arguments: '{}' } }], 'name is invalid'],
    [[{ ...validEvents[0], data: { ...validEvents[0].data, arguments: '{' } }, ...validEvents.slice(1)], 'invalid JSON'],
    [[{ ...validEvents[0], data: { ...validEvents[0].data, arguments: '[]' } }, ...validEvents.slice(1)], 'must be an object'],
    [[...validEvents.slice(0, -1)], 'not paired'],
    [[...validEvents, result('unexpected')], 'not paired'],
  ])('rejects invalid durable tool traces', (events, message) => {
    expect(() => validateAuthoringToolTrace(events)).toThrow(message)
  })

  it('parses only a completed versioned headless result', () => {
    const record = {
      type: 'dsh-headless-result',
      schemaVersion: '1.0.0',
      status: 'completed',
      text: 'done',
      reason: { kind: 'completed' },
    }
    expect(parseHeadlessResult(`launcher line\n${JSON.stringify(record)}\n`)).toEqual(record)
    expect(() => parseHeadlessResult('{}')).toThrow('no versioned result')
    expect(() => parseHeadlessResult(JSON.stringify({ ...record, status: 'failed' }))).toThrow(
      'did not report a completed',
    )
  })

  it('rejects private values in otherwise bounded evidence', () => {
    expect(() => assertEvidencePrivacy({ protocol: AUTHORING_AGENT_LAB_PROTOCOL }, ['/private/run']))
      .not.toThrow()
    expect(() => assertEvidencePrivacy({ value: '/private/run' }, ['/private/run']))
      .toThrow('retained a private runtime value')
    expect(() => assertEvidencePrivacy({ value: 'safe' }, [''])).not.toThrow()
  })
})
