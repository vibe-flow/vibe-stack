import { Routes, Route, Navigate } from 'react-router-dom'
import { DEMO_MODE } from './demo'
import { useDemo } from './demo/DemoProvider'
import { useIsAuthenticated, useAuthLoading } from './stores/auth.store'
import LoginPage from './pages/LoginPage'
import RegisterPage from './pages/RegisterPage'
import DashboardPage from './pages/DashboardPage'
import SettingsPage from './pages/SettingsPage'

// ============================================================================
// ROUTES PROTÉGÉES - MODE NORMAL (avec Zustand)
// ============================================================================

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const isAuthenticated = useIsAuthenticated()
  const isLoading = useAuthLoading()

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-gray-900" />
      </div>
    )
  }

  return isAuthenticated ? <>{children}</> : <Navigate to="/login" />
}

function PublicRoute({ children }: { children: React.ReactNode }) {
  const isAuthenticated = useIsAuthenticated()
  const isLoading = useAuthLoading()

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-gray-900" />
      </div>
    )
  }

  return isAuthenticated ? <Navigate to="/dashboard" /> : <>{children}</>
}

// ============================================================================
// ROUTES PROTÉGÉES - MODE DÉMO (avec DemoProvider)
// ============================================================================

function DemoProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated } = useDemo()
  return isAuthenticated ? <>{children}</> : <Navigate to="/login" />
}

function DemoPublicRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated } = useDemo()
  return isAuthenticated ? <Navigate to="/dashboard" /> : <>{children}</>
}

// ============================================================================
// APP
// ============================================================================

function App() {
  // En mode démo, utilise les routes démo
  if (DEMO_MODE) {
    return (
      <Routes>
        <Route
          path="/login"
          element={
            <DemoPublicRoute>
              <LoginPage />
            </DemoPublicRoute>
          }
        />
        <Route
          path="/register"
          element={
            <DemoPublicRoute>
              <RegisterPage />
            </DemoPublicRoute>
          }
        />
        <Route
          path="/dashboard"
          element={
            <DemoProtectedRoute>
              <DashboardPage />
            </DemoProtectedRoute>
          }
        />
        <Route
          path="/settings"
          element={
            <DemoProtectedRoute>
              <SettingsPage />
            </DemoProtectedRoute>
          }
        />
        <Route path="/" element={<Navigate to="/login" />} />
      </Routes>
    )
  }

  // Mode normal
  return (
    <Routes>
      <Route
        path="/login"
        element={
          <PublicRoute>
            <LoginPage />
          </PublicRoute>
        }
      />
      <Route
        path="/register"
        element={
          <PublicRoute>
            <RegisterPage />
          </PublicRoute>
        }
      />
      <Route
        path="/dashboard"
        element={
          <ProtectedRoute>
            <DashboardPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/settings"
        element={
          <ProtectedRoute>
            <SettingsPage />
          </ProtectedRoute>
        }
      />
      <Route path="/" element={<Navigate to="/dashboard" />} />
    </Routes>
  )
}

export default App
