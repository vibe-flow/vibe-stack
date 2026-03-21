import { useEffect, useRef } from 'react'
import { useSseStore } from '../stores/sse.store'

export function useSseEvent(type: string, handler: (data: unknown) => void) {
  const handlerRef = useRef(handler)
  handlerRef.current = handler

  useEffect(() => {
    const stableHandler = (data: unknown) => handlerRef.current(data)
    useSseStore.getState().subscribe(type, stableHandler)
    return () => {
      useSseStore.getState().unsubscribe(type, stableHandler)
    }
  }, [type])
}
