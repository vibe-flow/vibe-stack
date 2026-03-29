import { useState, useEffect, useCallback, useRef } from 'react'

type Serializable =
  | string
  | number
  | boolean
  | null
  | Serializable[]
  | { [key: string]: Serializable }

export const STORAGE_PREFIX = 'ps:'

/** Custom event dispatched on same-tab writes so the sync hook can react */
export const PERSISTED_STATE_CHANGE_EVENT = 'persisted-state-change'

function serialize(value: unknown): string {
  return JSON.stringify(value)
}

function deserialize<T>(raw: string | null, fallback: T): T {
  if (raw === null) return fallback
  try {
    return JSON.parse(raw) as T
  } catch {
    return fallback
  }
}

/**
 * Drop-in replacement for useState that persists to localStorage.
 * Syncs across tabs via the `storage` event.
 *
 * @param key - Unique key (e.g. 'invoices:sort', 'dashboard:filters')
 * @param defaultValue - Default value when nothing is stored
 * @returns [value, setValue] — same API as useState
 *
 * @example
 * const [sort, setSort] = usePersistedState('invoices:sort', 'date')
 * const [filters, setFilters] = usePersistedState('invoices:filters', { status: 'all' })
 */
export function usePersistedState<T extends Serializable>(
  key: string,
  defaultValue: T,
): [T, (value: T | ((prev: T) => T)) => void] {
  const storageKey = STORAGE_PREFIX + key
  const defaultRef = useRef(defaultValue)

  const [value, setValueInternal] = useState<T>(() => {
    try {
      const raw = localStorage.getItem(storageKey)
      return deserialize(raw, defaultValue)
    } catch {
      return defaultValue
    }
  })

  const setValue = useCallback(
    (newValue: T | ((prev: T) => T)) => {
      setValueInternal((prev) => {
        const resolved =
          typeof newValue === 'function' ? (newValue as (prev: T) => T)(prev) : newValue
        try {
          localStorage.setItem(storageKey, serialize(resolved))
          // Notify sync hook (storage events don't fire for same-tab writes)
          window.dispatchEvent(new CustomEvent(PERSISTED_STATE_CHANGE_EVENT, { detail: { key } }))
        } catch {
          // localStorage full or unavailable — silently degrade
        }
        return resolved
      })
    },
    [storageKey],
  )

  // Sync across tabs
  useEffect(() => {
    const handler = (e: StorageEvent) => {
      if (e.key === storageKey) {
        setValueInternal(deserialize(e.newValue, defaultRef.current))
      }
    }
    window.addEventListener('storage', handler)
    return () => window.removeEventListener('storage', handler)
  }, [storageKey])

  return [value, setValue]
}
