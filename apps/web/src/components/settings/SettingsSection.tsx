import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card'
import { Button } from '../ui/button'
import { SettingsField } from './SettingsField'
import type { SettingsSectionMeta } from '@template-dev/shared'

interface FieldDefinition {
  name: string
  label: string
  type: 'string' | 'number' | 'boolean' | 'text'
  required?: boolean
  description?: string
}

interface SettingsSectionProps {
  meta: SettingsSectionMeta
  data: Record<string, unknown>
  fields: FieldDefinition[]
  onSave: (data: Record<string, unknown>) => void
  saving?: boolean
  actions?: React.ReactNode
  children?: React.ReactNode
}

export function SettingsSection({
  meta,
  data,
  fields,
  onSave,
  saving,
  actions,
  children,
}: SettingsSectionProps) {
  const [formData, setFormData] = useState<Record<string, unknown>>(data)
  const hasChanges = JSON.stringify(formData) !== JSON.stringify(data)

  const handleFieldChange = (name: string, value: unknown) => {
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-lg">{meta.label}</CardTitle>
            {meta.description && <CardDescription>{meta.description}</CardDescription>}
          </div>
          {actions}
        </div>
      </CardHeader>
      <CardContent>
        {children ?? (
          <div className="space-y-4">
            {fields.map((field) => (
              <SettingsField
                key={field.name}
                name={field.name}
                label={field.label}
                type={field.type}
                value={formData[field.name]}
                onChange={(v) => handleFieldChange(field.name, v)}
                required={field.required}
                description={field.description}
              />
            ))}
            <div className="flex justify-end pt-2">
              <Button onClick={() => onSave(formData)} disabled={!hasChanges || saving}>
                {saving ? 'Saving...' : 'Save'}
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
