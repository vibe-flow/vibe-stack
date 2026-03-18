import { Input } from '../ui/input'
import { Label } from '../ui/label'
import { Switch } from '../ui/switch'
import { Textarea } from '../ui/textarea'
import { SecretField } from './SecretField'
import { CopyableField } from './CopyableField'

const SECRET_PATTERNS = ['secret', 'password', 'key', 'token']
const URL_PATTERNS = ['url', 'endpoint', 'uri']

interface SettingsFieldProps {
  name: string
  label: string
  type: 'string' | 'number' | 'boolean' | 'text'
  value: unknown
  onChange: (value: unknown) => void
  required?: boolean
  description?: string
}

export function SettingsField({
  name,
  label,
  type,
  value,
  onChange,
  required,
  description,
}: SettingsFieldProps) {
  const nameLower = name.toLowerCase()
  const isSecret = SECRET_PATTERNS.some((p) => nameLower.includes(p))
  const isUrl = URL_PATTERNS.some((p) => nameLower.includes(p))

  return (
    <div className="space-y-1.5">
      <Label htmlFor={name}>
        {label}
        {!required && <span className="ml-1 text-xs text-muted-foreground">(optional)</span>}
      </Label>
      {type === 'boolean' ? (
        <div className="flex items-center gap-2">
          <Switch
            id={name}
            checked={Boolean(value)}
            onCheckedChange={(checked) => onChange(checked)}
          />
        </div>
      ) : type === 'number' ? (
        <Input
          id={name}
          type="number"
          value={(value as number) ?? ''}
          onChange={(e) => onChange(e.target.value ? Number(e.target.value) : undefined)}
        />
      ) : type === 'text' ? (
        <Textarea
          id={name}
          value={(value as string) ?? ''}
          onChange={(e) => onChange(e.target.value)}
          rows={4}
        />
      ) : isSecret ? (
        <SecretField value={(value as string) ?? ''} onChange={(v) => onChange(v)} />
      ) : isUrl ? (
        <CopyableField value={(value as string) ?? ''} onChange={(v) => onChange(v)} />
      ) : (
        <Input
          id={name}
          value={(value as string) ?? ''}
          onChange={(e) => onChange(e.target.value)}
        />
      )}
      {description && <p className="text-xs text-muted-foreground">{description}</p>}
    </div>
  )
}
