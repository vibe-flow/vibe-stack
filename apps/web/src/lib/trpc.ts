import { createTRPCReact, httpBatchLink } from '@trpc/react-query'
import type { AppRouter } from '../../../api/src/trpc/trpc.router'
import { useAuthStore } from '../stores/auth.store'

export const trpc = createTRPCReact<AppRouter>()

// Token refresh state to prevent multiple simultaneous refresh attempts
let isRefreshing = false
let refreshPromise: Promise<string | null> | null = null

async function refreshAccessToken(): Promise<string | null> {
  const { refreshToken, setTokens, logout } = useAuthStore.getState()

  if (!refreshToken) {
    logout()
    return null
  }

  try {
    const response = await fetch('/trpc/auth.refresh', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ refreshToken }),
    })

    if (!response.ok) {
      throw new Error('Refresh failed')
    }

    const data = await response.json()
    const result = data?.result?.data

    if (result?.accessToken && result?.refreshToken) {
      setTokens(result.accessToken, result.refreshToken)
      return result.accessToken
    }

    throw new Error('Invalid refresh response')
  } catch {
    logout()
    return null
  }
}

async function getValidToken(): Promise<string | null> {
  const { accessToken } = useAuthStore.getState()
  return accessToken
}

const TRPC_URL = '/trpc'

export function createTrpcClient() {
  return trpc.createClient({
    links: [
      httpBatchLink({
        url: TRPC_URL,
        async headers() {
          const token = await getValidToken()
          return token
            ? {
                authorization: `Bearer ${token}`,
              }
            : {}
        },
        async fetch(url, options) {
          const response = await fetch(url, options)

          // Check for 401 in HTTP status OR in tRPC batch response body
          let hasUnauthorized = response.status === 401

          if (!hasUnauthorized && response.ok) {
            // tRPC batch returns 200 with errors in JSON body
            const cloned = response.clone()
            try {
              const data = await cloned.json()
              const results = Array.isArray(data) ? data : [data]
              hasUnauthorized = results.some((r) => r?.error?.data?.httpStatus === 401)
            } catch {
              // Not JSON, ignore
            }
          }

          if (hasUnauthorized) {
            const { refreshToken } = useAuthStore.getState()

            if (refreshToken && !isRefreshing) {
              isRefreshing = true
              refreshPromise = refreshAccessToken()

              try {
                const newToken = await refreshPromise
                if (newToken) {
                  // Retry the original request with new token
                  const newOptions = {
                    ...options,
                    headers: {
                      ...options?.headers,
                      authorization: `Bearer ${newToken}`,
                    },
                  }
                  return fetch(url, newOptions)
                }
              } finally {
                isRefreshing = false
                refreshPromise = null
              }
            } else if (isRefreshing && refreshPromise) {
              // Wait for ongoing refresh
              const newToken = await refreshPromise
              if (newToken) {
                const newOptions = {
                  ...options,
                  headers: {
                    ...options?.headers,
                    authorization: `Bearer ${newToken}`,
                  },
                }
                return fetch(url, newOptions)
              }
            }
          }

          return response
        },
      }),
    ],
  })
}
