import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useSseEvent } from './useSseEvent'
import { useSseStore } from '../stores/sse.store'

describe('useSseEvent', () => {
  beforeEach(() => {
    useSseStore.setState({
      isConnected: false,
      connectionError: null,
      eventSource: null,
      handlers: new Map(),
      reconnectAttempts: 0,
    })
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  it('should subscribe handler on mount', () => {
    const handler = vi.fn()
    renderHook(() => useSseEvent('entity_changed', handler))

    const { handlers } = useSseStore.getState()
    expect(handlers.get('entity_changed')?.size).toBe(1)
  })

  it('should unsubscribe handler on unmount', () => {
    const handler = vi.fn()
    const { unmount } = renderHook(() => useSseEvent('entity_changed', handler))

    unmount()

    const { handlers } = useSseStore.getState()
    expect(handlers.get('entity_changed')?.size ?? 0).toBe(0)
  })

  it('should call the latest handler when event dispatched', () => {
    const handler1 = vi.fn()
    const handler2 = vi.fn()
    const { rerender } = renderHook(({ h }) => useSseEvent('entity_changed', h), {
      initialProps: { h: handler1 },
    })

    rerender({ h: handler2 })

    const { handlers } = useSseStore.getState()
    const stableHandler = Array.from(handlers.get('entity_changed') ?? [])[0]

    const payload = { type: 'entity_changed', entity: 'User', action: 'create', id: '1' }
    act(() => {
      stableHandler(payload)
    })

    expect(handler1).not.toHaveBeenCalled()
    expect(handler2).toHaveBeenCalledWith(payload)
  })

  it('should resubscribe when type changes', () => {
    const handler = vi.fn()
    const { rerender } = renderHook(({ type }) => useSseEvent(type, handler), {
      initialProps: { type: 'entity_changed' },
    })

    rerender({ type: 'heartbeat' })

    const { handlers } = useSseStore.getState()
    // Old type should have no handlers, new type should have one
    expect(handlers.get('entity_changed')?.size ?? 0).toBe(0)
    expect(handlers.get('heartbeat')?.size).toBe(1)
  })
})
