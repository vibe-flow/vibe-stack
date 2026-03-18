import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { trpc } from '@/lib/trpc'
import { useAuthStore, useUser } from '@/stores/auth.store'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

export default function DashboardPage() {
  const navigate = useNavigate()
  const user = useUser()
  const logout = useAuthStore((state) => state.logout)
  const refreshToken = useAuthStore((state) => state.refreshToken)
  const [llmResponse, setLlmResponse] = useState<string | null>(null)
  const [llmError, setLlmError] = useState<string | null>(null)
  const [llmMessage, setLlmMessage] = useState(
    'Bonjour ! Qui es-tu ? Réponds en une courte phrase.',
  )

  const { data: userData, isLoading } = trpc.auth.me.useQuery()
  const { data: users } = trpc.users.list.useQuery()
  const { data: llmStatus } = trpc.ai.status.useQuery()

  const llmTestMutation = trpc.ai.chat.useMutation({
    onSuccess: (data) => {
      if (data.success) {
        setLlmResponse(data.response)
        setLlmError(null)
      } else {
        setLlmError(data.error)
        setLlmResponse(null)
      }
    },
    onError: (error) => {
      setLlmError(error.message)
      setLlmResponse(null)
    },
  })

  const logoutMutation = trpc.auth.logout.useMutation({
    onSettled: () => {
      logout()
      navigate('/login')
    },
  })

  const handleLogout = () => {
    if (refreshToken) {
      logoutMutation.mutate({ refreshToken })
    } else {
      logout()
      navigate('/login')
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="border-b bg-white">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between">
            <h1 className="text-xl font-bold">Tableau de bord</h1>
            <div className="flex items-center space-x-4">
              <span className="text-sm text-muted-foreground">
                {user?.name} ({user?.role})
              </span>
              <a href="/settings" className="text-sm text-muted-foreground hover:text-foreground">
                Settings
              </a>
              <Button variant="outline" onClick={handleLogout} disabled={logoutMutation.isPending}>
                {logoutMutation.isPending ? 'Déconnexion...' : 'Se déconnecter'}
              </Button>
            </div>
          </div>
        </div>
      </nav>

      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Bienvenue !</CardTitle>
              <CardDescription>Vous êtes connecté au tableau de bord</CardDescription>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <p>Chargement des données...</p>
              ) : (
                <div className="space-y-2">
                  <p>
                    <strong>E-mail :</strong> {userData?.email}
                  </p>
                  <p>
                    <strong>Nom :</strong> {userData?.name}
                  </p>
                  <p>
                    <strong>Rôle :</strong> {userData?.role}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Tous les utilisateurs</CardTitle>
              <CardDescription>Liste des utilisateurs inscrits</CardDescription>
            </CardHeader>
            <CardContent>
              {users ? (
                <ul className="space-y-2">
                  {users.map((u) => (
                    <li key={u.id} className="rounded bg-gray-50 p-2">
                      <div className="font-medium">{u.name}</div>
                      <div className="text-sm text-muted-foreground">{u.email}</div>
                    </li>
                  ))}
                </ul>
              ) : (
                <p>Chargement des utilisateurs...</p>
              )}
            </CardContent>
          </Card>

          <Card className="md:col-span-2">
            <CardHeader>
              <CardTitle>Test LLM (Langfuse)</CardTitle>
              <CardDescription>
                Tester un appel LLM via tRPC - Consultez le tableau de bord Langfuse pour les traces
                {llmStatus && (
                  <span
                    className={`ml-2 rounded px-2 py-0.5 text-xs ${llmStatus.configured ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}
                  >
                    {llmStatus.configured ? 'LLM configuré' : 'LLM non configuré'}
                  </span>
                )}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <textarea
                  value={llmMessage}
                  onChange={(e) => setLlmMessage(e.target.value)}
                  className="w-full resize-none rounded-md border p-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  rows={3}
                  placeholder="Entrez votre message..."
                />
                <Button
                  onClick={() =>
                    llmTestMutation.mutate({ messages: [{ role: 'user', content: llmMessage }] })
                  }
                  disabled={llmTestMutation.isPending || !llmMessage.trim()}
                >
                  {llmTestMutation.isPending ? 'Appel LLM...' : 'Envoyer'}
                </Button>

                {llmResponse && (
                  <div className="rounded border border-green-200 bg-green-50 p-4">
                    <p className="text-sm font-medium text-green-800">Réponse :</p>
                    <p className="mt-1 text-sm text-green-700">{llmResponse}</p>
                  </div>
                )}

                {llmError && (
                  <div className="rounded border border-red-200 bg-red-50 p-4">
                    <p className="text-sm font-medium text-red-800">Erreur :</p>
                    <p className="mt-1 text-sm text-red-700">{llmError}</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  )
}
