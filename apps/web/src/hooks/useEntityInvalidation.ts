import { useEffect, useRef, useCallback } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { trpc } from '../lib/trpc'
import { useSseEvent } from './useSseEvent'
import { useSseStore } from '../stores/sse.store'
import type { EntityChangedEvent } from '@template-dev/shared'

const ENTITY_ROUTER_MAP: Record<string, string> = {
  User: 'users',
  Setting: 'settings',
}

export function useEntityInvalidation(options?: { exclude?: string[] }) {
  const utils = trpc.useUtils()
  const queryClient = useQueryClient()
  const isConnected = useSseStore((s) => s.isConnected)
  const prevConnectedRef = useRef(isConnected)

  const excludeKey = options?.exclude?.join(',') ?? ''

  useSseEvent(
    'entity_changed',
    useCallback(
      (data: unknown) => {
        const event = data as EntityChangedEvent
        if (options?.exclude?.includes(event.entity)) return
        const routerName = ENTITY_ROUTER_MAP[event.entity]
        if (routerName && (utils as Record<string, { invalidate: () => void }>)[routerName]) {
          ;(utils as Record<string, { invalidate: () => void }>)[routerName].invalidate()
        }
      },
      [utils, excludeKey],
    ),
  )

  useEffect(() => {
    if (isConnected && !prevConnectedRef.current) {
      queryClient.invalidateQueries()
    }
    prevConnectedRef.current = isConnected
  }, [isConnected, queryClient])
}
