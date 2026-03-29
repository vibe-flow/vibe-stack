import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { trpc } from '@/lib/trpc'
import { useAuthStore } from '@/stores/auth.store'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'

const DEV_LOGIN_ENABLED = import.meta.env.VITE_DEV_LOGIN === 'true' && import.meta.env.DEV

export default function LoginPage() {
  const navigate = useNavigate()
  const setAuth = useAuthStore((state) => state.setAuth)
  const [email, setEmail] = useState('')
  const [sent, setSent] = useState(false)
  const [error, setError] = useState('')

  const sendMagicLinkMutation = trpc.auth.sendMagicLink.useMutation({
    onSuccess: () => {
      setSent(true)
      setError('')
    },
    onError: (err) => {
      setError(err.message || 'Une erreur est survenue')
    },
  })

  const devLoginMutation = trpc.auth.devLogin.useMutation({
    onSuccess: (data) => {
      setAuth(data)
      navigate('/dashboard')
    },
    onError: (err) => {
      setError(err.message || 'Échec de la connexion')
    },
  })

  const devUsersQuery = trpc.auth.devUsers.useQuery(undefined, {
    enabled: DEV_LOGIN_ENABLED,
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    sendMagicLinkMutation.mutate({ email })
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50">
      <div className="w-full max-w-md space-y-4">
        <Card>
          <CardHeader>
            <CardTitle>Connexion</CardTitle>
            <CardDescription>
              Entrez votre adresse email pour recevoir un lien de connexion
            </CardDescription>
          </CardHeader>

          {sent ? (
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Un lien de connexion a été envoyé à votre adresse email. Vérifiez votre boîte mail.
              </p>
            </CardContent>
          ) : (
            <form onSubmit={handleSubmit}>
              <CardContent className="space-y-4">
                {error && (
                  <div className="rounded border border-red-200 bg-red-50 p-3 text-sm text-red-500">
                    {error}
                  </div>
                )}
                <div className="space-y-2">
                  <label htmlFor="email" className="text-sm font-medium">
                    E-mail
                  </label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="you@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>
              </CardContent>
              <CardFooter>
                <Button type="submit" className="w-full" disabled={sendMagicLinkMutation.isPending}>
                  {sendMagicLinkMutation.isPending
                    ? 'Envoi en cours...'
                    : 'Recevoir un lien de connexion'}
                </Button>
              </CardFooter>
            </form>
          )}
        </Card>

        {DEV_LOGIN_ENABLED && (
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Connexion rapide (dev)</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {devUsersQuery.isLoading && (
                <p className="text-sm text-muted-foreground">Chargement...</p>
              )}
              {devUsersQuery.data?.map((user) => (
                <button
                  key={user.id}
                  type="button"
                  onClick={() => devLoginMutation.mutate({ email: user.email, role: user.role })}
                  disabled={devLoginMutation.isPending}
                  className="flex w-full items-center justify-between rounded border px-3 py-2 text-left text-sm hover:bg-gray-50 disabled:opacity-50"
                >
                  <span>{user.email}</span>
                  <span className="rounded bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-600">
                    {user.role}
                  </span>
                </button>
              ))}
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
