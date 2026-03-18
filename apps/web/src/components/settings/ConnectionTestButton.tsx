import { useState } from 'react'
import { Button } from '../ui/button'

interface ConnectionTestButtonProps {
  onTest: () => Promise<boolean>
  label?: string
}

export function ConnectionTestButton({
  onTest,
  label = 'Test connection',
}: ConnectionTestButtonProps) {
  const [status, setStatus] = useState<'idle' | 'testing' | 'success' | 'error'>('idle')
  const [error, setError] = useState<string>()

  const handleTest = async () => {
    setStatus('testing')
    setError(undefined)
    try {
      const ok = await onTest()
      setStatus(ok ? 'success' : 'error')
      if (!ok) setError('Connection failed')
    } catch (e) {
      setStatus('error')
      setError(e instanceof Error ? e.message : 'Unknown error')
    }
    setTimeout(() => setStatus('idle'), 3000)
  }

  return (
    <div className="flex items-center gap-2">
      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={handleTest}
        disabled={status === 'testing'}
      >
        {status === 'testing' ? 'Testing...' : label}
      </Button>
      {status === 'success' && <span className="text-sm text-green-600">Connected</span>}
      {status === 'error' && <span className="text-sm text-red-600">{error}</span>}
    </div>
  )
}
