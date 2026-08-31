/** Versioned evidence protocol emitted by the authoring agent lab. */
export const AUTHORING_AGENT_LAB_PROTOCOL = 'dsh-a11y-authoring-agent-lab/0.1.0-draft'

function object(value, message) {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) throw new Error(message)
  return value
}

function callArguments(event) {
  const data = object(event.data, 'tool call data is invalid')
  if (typeof data.arguments !== 'string') throw new Error('tool call arguments are invalid')
  try {
    return object(JSON.parse(data.arguments), 'tool call arguments must be an object')
  } catch (error) {
    if (error instanceof SyntaxError) throw new Error('tool call arguments are invalid JSON')
    throw error
  }
}

function containsTrueErrorFlag(value, seen = new Set()) {
  if (typeof value !== 'object' || value === null) return false
  if (seen.has(value)) return false
  seen.add(value)
  if (Array.isArray(value)) return value.some(item => containsTrueErrorFlag(item, seen))
  for (const [key, nested] of Object.entries(value)) {
    if (key === 'isError' && nested === true) return true
    if (containsTrueErrorFlag(nested, seen)) return true
  }
  return false
}

function callId(event, message) {
  const data = object(event.data, message)
  if (typeof data.callId !== 'string' || data.callId.length === 0) throw new Error(message)
  return data.callId
}

function resultCallId(event) {
  const data = object(event.data, 'tool result data is invalid')
  const message = object(data.message, 'tool result message is invalid')
  const source = object(message.source, 'tool result source is invalid')
  if (source.kind !== 'tool' || typeof source.callId !== 'string' || source.callId.length === 0) {
    throw new Error('tool result call id is invalid')
  }
  return source.callId
}

/** Validate the actual durable tool trace for the bounded authoring task. */
export function validateAuthoringToolTrace(events) {
  const calls = events.filter(event => event?.type === 'tool/call')
  const results = events.filter(event => event?.type === 'tool/result')
  const names = calls.map((event) => {
    const data = object(event.data, 'tool call data is invalid')
    if (typeof data.name !== 'string') throw new Error('tool call name is invalid')
    return data.name
  })
  const allowed = new Set(['a11y_check', 'read', 'edit'])
  if (names.some(name => !allowed.has(name))) throw new Error('authoring task used an out-of-scope tool')
  if (names[0] !== 'a11y_check') throw new Error('authoring task must audit before reading or editing')
  const requiredSequence = ['a11y_check', 'read', 'edit', 'a11y_check']
  if (names.length !== requiredSequence.length
    || names.some((name, index) => name !== requiredSequence[index])) {
    throw new Error(`authoring task must audit, read, edit, and re-audit in order; received ${names.join(' -> ')}`)
  }

  for (const [index, event] of calls.entries()) {
    const args = callArguments(event)
    if (names[index] === 'a11y_check') {
      if (args.target !== 'preview.authoring') {
        throw new Error('accessibility check used an unapproved target')
      }
      if (args.contextSelector !== 'main') {
        throw new Error('accessibility check used an unapproved context selector')
      }
    }
    if ((names[index] === 'read' || names[index] === 'edit') && args.file_path !== 'index.html') {
      throw new Error('authoring task accessed an out-of-scope file')
    }
  }

  const callIds = calls.map(event => callId(event, 'tool call id is invalid'))
  const resultIds = results.map(resultCallId)
  if (new Set(callIds).size !== callIds.length || new Set(resultIds).size !== resultIds.length
    || callIds.length !== resultIds.length || callIds.some(id => !resultIds.includes(id))) {
    throw new Error('authoring task tool calls and results are not paired')
  }
  if (results.some(event => containsTrueErrorFlag(event))) {
    throw new Error('authoring task contains a failed tool result')
  }
  return names
}

/** Parse and validate the one versioned final record printed by headless DSH. */
export function parseHeadlessResult(stdout) {
  const candidates = stdout.split(/\r?\n/u).map(line => line.trim()).filter(Boolean).reverse()
  for (const candidate of candidates) {
    if (!candidate.startsWith('{')) continue
    let value
    try {
      value = JSON.parse(candidate)
    } catch {
      continue
    }
    if (value?.type !== 'dsh-headless-result') continue
    if (value.schemaVersion !== '1.0.0' || value.status !== 'completed'
      || value.reason?.kind !== 'completed') {
      throw new Error('headless DSH did not report a completed versioned result')
    }
    return value
  }
  throw new Error('headless DSH emitted no versioned result')
}

/** Refuse an evidence record that accidentally retains a private runtime value. */
export function assertEvidencePrivacy(evidence, privateValues) {
  const serialized = JSON.stringify(evidence)
  for (const value of privateValues) {
    if (value !== '' && serialized.includes(value)) {
      throw new Error('authoring evidence retained a private runtime value')
    }
  }
}
