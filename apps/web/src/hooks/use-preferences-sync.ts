import { useEffect, useRef } from 'react'
import { useIsAuthenticated } from '../stores/auth.store'
import { trpc } from '../lib/trpc'
import { STORAGE_PREFIX, PERSISTED_STATE_CHANGE_EVENT } from './use-persisted-state'

const SYNC_DEBOUNCE_MS = 2000

/**
 * Collects all persisted-state entries from localStorage.
 */
function getAllPersistedEntries(): Record<string, unknown> {
  const entries: Record<string, unknown> = {}
  for (let i = 0; i < localStorage.length; i++) {
    const fullKey = localStorage.key(i)
    if (fullKey?.startsWith(STORAGE_PREFIX)) {
      const key = fullKey.slice(STORAGE_PREFIX.length)
      try {
        entries[key] = JSON.parse(localStorage.getItem(fullKey) ?? 'null')
      } catch {
        // Skip corrupted entries
      }
    }
  }
  return entries
}

/**
 * Writes server preferences to localStorage.
 * Server fills gaps — local values are never overwritten.
 */
function hydrateFromServer(serverPrefs: Record<string, unknown>) {
  for (const [key, value] of Object.entries(serverPrefs)) {
    const fullKey = STORAGE_PREFIX + key
    if (localStorage.getItem(fullKey) === null) {
      localStorage.setItem(fullKey, JSON.stringify(value))
    }
  }
}

/**
 * Syncs usePersistedState (localStorage) with the backend.
 *
 * - On login: fetches server prefs, hydrates localStorage (server fills gaps)
 * - On local writes: debounce-syncs all preferences to server
 *
 * Mount once in your app (e.g. in App.tsx alongside SseManager).
 */
export function usePreferencesSync() {
  const isAuthenticated = useIsAuthenticated()
  const syncTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const isSyncingRef = useRef(false)
  const pendingRef = useRef(false)
  const utils = trpc.useUtils()

  // Store mutate in a ref to avoid dependency issues (useMutation returns new ref each render)
  const bulkSetMutation = trpc.preferences.bulkSet.useMutation()
  const mutateRef = useRef(bulkSetMutation.mutate)
  mutateRef.current = bulkSetMutation.mutate

  // Stable ref for syncToServer to avoid effect re-registrations
  const syncToServerRef = useRef<() => void>(() => {})
  syncToServerRef.current = () => {
    if (syncTimeoutRef.current) {
      clearTimeout(syncTimeoutRef.current)
    }

    syncTimeoutRef.current = setTimeout(() => {
      if (isSyncingRef.current) {
        // Mutation in flight — re-schedule so writes aren't dropped
        pendingRef.current = true
        return
      }

      isSyncingRef.current = true
      const entries = getAllPersistedEntries()
      const preferences = Object.entries(entries).map(([key, value]) => ({ key, value }))

      if (preferences.length > 0) {
        mutateRef.current(
          { preferences },
          {
            onSettled: () => {
              isSyncingRef.current = false
              if (pendingRef.current) {
                pendingRef.current = false
                syncToServerRef.current()
              }
            },
          },
        )
      } else {
        isSyncingRef.current = false
      }
    }, SYNC_DEBOUNCE_MS)
  }

  const syncToServer = () => syncToServerRef.current()

  // Hydrate from server on login
  useEffect(() => {
    if (!isAuthenticated) return

    utils.preferences.getAll
      .fetch()
      .then((serverPrefs) => {
        hydrateFromServer(serverPrefs as Record<string, unknown>)
        syncToServer()
      })
      .catch(() => {
        // Backend not available — localStorage-only mode
      })
  }, [isAuthenticated]) // syncToServer is stable via ref

  // Listen to same-tab writes from usePersistedState
  useEffect(() => {
    if (!isAuthenticated) return

    const handler = () => syncToServer()
    window.addEventListener(PERSISTED_STATE_CHANGE_EVENT, handler)
    return () => {
      window.removeEventListener(PERSISTED_STATE_CHANGE_EVENT, handler)
      if (syncTimeoutRef.current) {
        clearTimeout(syncTimeoutRef.current)
      }
    }
  }, [isAuthenticated]) // syncToServer is stable via ref

  // Listen to cross-tab writes via storage event
  useEffect(() => {
    if (!isAuthenticated) return

    const handler = (e: StorageEvent) => {
      if (e.key?.startsWith(STORAGE_PREFIX)) {
        syncToServer()
      }
    }
    window.addEventListener('storage', handler)
    return () => window.removeEventListener('storage', handler)
  }, [isAuthenticated]) // syncToServer is stable via ref
}
