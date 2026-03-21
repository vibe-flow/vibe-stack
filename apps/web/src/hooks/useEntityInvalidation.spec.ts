import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useSseStore } from '../stores/sse.store'
import type { EntityChangedEvent } from '@template-dev/shared'

// Mock tRPC utils
const mockUsersInvalidate = vi.fn()
const mockSettingsInvalidate = vi.fn()
const mockUseUtils = vi.fn(() => ({
  users: { invalidate: mockUsersInvalidate },
  settings: { invalidate: mockSettingsInvalidate },
}))

vi.mock('../lib/trpc', () => ({
  trpc: {
    useUtils: mockUseUtils,
  },
}))

// Mock TanStack Query
const mockInvalidateQueries = vi.fn()
vi.mock('@tanstack/react-query', () => ({
  useQueryClient: () => ({
    invalidateQueries: mockInvalidateQueries,
  }),
}))

// Import AFTER mocks
const { useEntityInvalidation } = await import('./useEntityInvalidation')

describe('useEntityInvalidation', () => {
  beforeEach(() => {
    useSseStore.setState({
      isConnected: false,
      connectionError: null,
      eventSource: null,
      handlers: new Map(),
      reconnectAttempts: 0,
    })
    vi.clearAllMocks()
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  it('should invalidate users router when User entity_changed event received', () => {
    renderHook(() => useEntityInvalidation())

    const { handlers } = useSseStore.getState()
    const entityHandlers = handlers.get('entity_changed')
    expect(entityHandlers?.size).toBe(1)

    const payload: EntityChangedEvent = {
      type: 'entity_changed',
      entity: 'User',
      action: 'update',
      id: 'user-1',
    }
    act(() => {
      entityHandlers?.forEach((h) => h(payload))
    })

    expect(mockUsersInvalidate).toHaveBeenCalled()
    expect(mockSettingsInvalidate).not.toHaveBeenCalled()
  })

  it('should invalidate settings router when Setting entity_changed event received', () => {
    renderHook(() => useEntityInvalidation())

    const { handlers } = useSseStore.getState()
    const entityHandlers = handlers.get('entity_changed')

    const payload: EntityChangedEvent = {
      type: 'entity_changed',
      entity: 'Setting',
      action: 'update',
      id: 'setting-1',
    }
    act(() => {
      entityHandlers?.forEach((h) => h(payload))
    })

    expect(mockSettingsInvalidate).toHaveBeenCalled()
    expect(mockUsersInvalidate).not.toHaveBeenCalled()
  })

  it('should not invalidate when entity is excluded', () => {
    renderHook(() => useEntityInvalidation({ exclude: ['User'] }))

    const { handlers } = useSseStore.getState()
    const entityHandlers = handlers.get('entity_changed')

    const payload: EntityChangedEvent = {
      type: 'entity_changed',
      entity: 'User',
      action: 'create',
      id: 'user-1',
    }
    act(() => {
      entityHandlers?.forEach((h) => h(payload))
    })

    expect(mockUsersInvalidate).not.toHaveBeenCalled()
  })

  it('should not invalidate when entity has no router mapping', () => {
    renderHook(() => useEntityInvalidation())

    const { handlers } = useSseStore.getState()
    const entityHandlers = handlers.get('entity_changed')

    const payload: EntityChangedEvent = {
      type: 'entity_changed',
      entity: 'UnknownEntity',
      action: 'delete',
      id: 'unknown-1',
    }
    act(() => {
      entityHandlers?.forEach((h) => h(payload))
    })

    expect(mockUsersInvalidate).not.toHaveBeenCalled()
    expect(mockSettingsInvalidate).not.toHaveBeenCalled()
  })

  it('should invalidate all queries on reconnection', () => {
    renderHook(() => useEntityInvalidation())

    act(() => {
      useSseStore.setState({ isConnected: true })
    })

    expect(mockInvalidateQueries).toHaveBeenCalled()
  })

  it('should not invalidate all queries when disconnected (only on reconnect)', () => {
    renderHook(() => useEntityInvalidation())

    // Start disconnected, go connected: triggers invalidation (reconnect)
    act(() => {
      useSseStore.setState({ isConnected: true })
    })
    expect(mockInvalidateQueries).toHaveBeenCalledTimes(1)

    // Stay connected: no more invalidation
    act(() => {
      useSseStore.setState({ isConnected: false })
    })
    expect(mockInvalidateQueries).toHaveBeenCalledTimes(1)
  })
})
