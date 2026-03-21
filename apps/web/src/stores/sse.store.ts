import { create } from 'zustand'
import { useAuthStore } from './auth.store'

type SseHandler = (data: unknown) => void

interface SseState {
  isConnected: boolean
  connectionError: string | null
  eventSource: EventSource | null
  handlers: Map<string, Set<SseHandler>>
  reconnectAttempts: number

  connect: (token: string) => void
  disconnect: () => void
  subscribe: (type: string, handler: SseHandler) => void
  unsubscribe: (type: string, handler: SseHandler) => void
}

const BACKOFF_DELAYS = [1000, 3000, 5000, 10000, 30000]

export const useSseStore = create<SseState>((set, get) => ({
  isConnected: false,
  connectionError: null,
  eventSource: null,
  handlers: new Map(),
  reconnectAttempts: 0,

  connect: (token: string) => {
    const { eventSource: existing } = get()
    if (existing) existing.close()

    const es = new EventSource(`/api/sse/events?token=${encodeURIComponent(token)}`)

    es.onopen = () => {
      set({ isConnected: true, connectionError: null, reconnectAttempts: 0 })
    }

    es.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data) as { type: string }
        const { handlers } = get()
        const typeHandlers = handlers.get(data.type)
        if (typeHandlers) {
          typeHandlers.forEach((handler) => handler(data))
        }
      } catch {
        // ignore parse errors
      }
    }

    es.onerror = () => {
      es.close()
      set({ isConnected: false, eventSource: null })

      const { reconnectAttempts } = get()
      const delay = BACKOFF_DELAYS[Math.min(reconnectAttempts, BACKOFF_DELAYS.length - 1)]

      setTimeout(() => {
        set((state) => ({ reconnectAttempts: state.reconnectAttempts + 1 }))
        const currentToken = useAuthStore.getState().accessToken
        if (currentToken) {
          get().connect(currentToken)
        }
      }, delay)
    }

    set({ eventSource: es })
  },

  disconnect: () => {
    const { eventSource } = get()
    if (eventSource) eventSource.close()
    set({ eventSource: null, isConnected: false, reconnectAttempts: 0, connectionError: null })
  },

  subscribe: (type: string, handler: SseHandler) => {
    const { handlers } = get()
    if (!handlers.has(type)) {
      handlers.set(type, new Set())
    }
    handlers.get(type)!.add(handler)
    set({ handlers: new Map(handlers) })
  },

  unsubscribe: (type: string, handler: SseHandler) => {
    const { handlers } = get()
    handlers.get(type)?.delete(handler)
    set({ handlers: new Map(handlers) })
  },
}))
