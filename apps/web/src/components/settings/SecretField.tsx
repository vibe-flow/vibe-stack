import { useState } from 'react'
import { Input } from '../ui/input'

interface SecretFieldProps {
  value: string
  onChange: (value: string) => void
  placeholder?: string
}

export function SecretField({ value, onChange, placeholder }: SecretFieldProps) {
  const [visible, setVisible] = useState(false)

  return (
    <div className="relative">
      <Input
        type={visible ? 'text' : 'password'}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="pr-20"
      />
      <div className="absolute right-1 top-1 flex gap-1">
        <button
          type="button"
          onClick={() => setVisible(!visible)}
          className="px-2 py-1 text-xs text-muted-foreground hover:text-foreground"
        >
          {visible ? 'Hide' : 'Show'}
        </button>
        <button
          type="button"
          onClick={() => navigator.clipboard.writeText(value)}
          className="px-2 py-1 text-xs text-muted-foreground hover:text-foreground"
        >
          Copy
        </button>
      </div>
    </div>
  )
}
