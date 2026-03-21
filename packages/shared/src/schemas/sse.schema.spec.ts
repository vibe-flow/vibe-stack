import { describe, it, expect } from 'vitest'
import {
  SseActionSchema,
  EntityChangedEventSchema,
  HeartbeatEventSchema,
  SseEventSchema,
} from './sse.schema'

describe('SseActionSchema', () => {
  it('accepts valid actions', () => {
    expect(SseActionSchema.parse('create')).toBe('create')
    expect(SseActionSchema.parse('update')).toBe('update')
    expect(SseActionSchema.parse('delete')).toBe('delete')
  })

  it('rejects invalid actions', () => {
    expect(() => SseActionSchema.parse('unknown')).toThrow()
  })
})

describe('EntityChangedEventSchema', () => {
  it('parses a valid entity_changed event', () => {
    const input = { type: 'entity_changed', entity: 'user', action: 'create', id: 'abc123' }
    const result = EntityChangedEventSchema.parse(input)
    expect(result.type).toBe('entity_changed')
    expect(result.entity).toBe('user')
    expect(result.action).toBe('create')
    expect(result.id).toBe('abc123')
  })

  it('rejects when type is wrong', () => {
    expect(() =>
      EntityChangedEventSchema.parse({
        type: 'heartbeat',
        entity: 'user',
        action: 'create',
        id: '1',
      }),
    ).toThrow()
  })

  it('rejects when action is invalid', () => {
    expect(() =>
      EntityChangedEventSchema.parse({
        type: 'entity_changed',
        entity: 'user',
        action: 'patch',
        id: '1',
      }),
    ).toThrow()
  })

  it('rejects when id is missing', () => {
    expect(() =>
      EntityChangedEventSchema.parse({ type: 'entity_changed', entity: 'user', action: 'update' }),
    ).toThrow()
  })
})

describe('HeartbeatEventSchema', () => {
  it('parses a valid heartbeat event', () => {
    const result = HeartbeatEventSchema.parse({ type: 'heartbeat' })
    expect(result.type).toBe('heartbeat')
  })

  it('rejects when type is wrong', () => {
    expect(() => HeartbeatEventSchema.parse({ type: 'entity_changed' })).toThrow()
  })
})

describe('SseEventSchema (discriminated union)', () => {
  it('parses entity_changed via the union', () => {
    const event = SseEventSchema.parse({
      type: 'entity_changed',
      entity: 'post',
      action: 'delete',
      id: 'xyz',
    })
    expect(event.type).toBe('entity_changed')
  })

  it('parses heartbeat via the union', () => {
    const event = SseEventSchema.parse({ type: 'heartbeat' })
    expect(event.type).toBe('heartbeat')
  })

  it('rejects unknown type', () => {
    expect(() => SseEventSchema.parse({ type: 'unknown' })).toThrow()
  })
})
