import { usePersistedState } from '../hooks/use-persisted-state'

/**
 * UI preference hooks — backed by usePersistedState (localStorage + BDD sync).
 * Use these for global UI preferences (sidebar, theme, density).
 *
 * @example
 * const [sidebarOpen, setSidebarOpen] = useSidebarOpen()
 * const [theme, setTheme] = useTheme()
 */

export function useSidebarOpen() {
  return usePersistedState<boolean>('ui:sidebarOpen', true)
}

export function useTheme() {
  return usePersistedState<'light' | 'dark' | 'system'>('ui:theme', 'system')
}

export function useDensity() {
  return usePersistedState<'comfortable' | 'compact'>('ui:density', 'comfortable')
}
