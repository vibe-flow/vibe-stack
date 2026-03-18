import { useState } from 'react'
import { Input } from '../ui/input'

interface CopyableFieldProps {
  value: string
  onChange?: (value: string) => void
  readOnly?: boolean
  placeholder?: string
}

export function CopyableField({ value, onChange, readOnly, placeholder }: CopyableFieldProps) {
  const [copied, setCopied] = useState(false)

  const handleCopy = () => {
    navigator.clipboard.writeText(value)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="relative">
      <Input
        value={value}
        onChange={onChange ? (e) => onChange(e.target.value) : undefined}
        readOnly={readOnly}
        placeholder={placeholder}
        className="pr-16"
      />
      <button
        type="button"
        onClick={handleCopy}
        className="absolute right-1 top-1 px-2 py-1 text-xs text-muted-foreground hover:text-foreground"
      >
        {copied ? 'Copied!' : 'Copy'}
      </button>
    </div>
  )
}
