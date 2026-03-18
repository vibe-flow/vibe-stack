import { trpc } from '../lib/trpc'
import { SettingsSection } from '../components/settings'
import type { SettingsSectionMeta } from '@template-dev/shared'

function deriveFields(data: Record<string, unknown>) {
  return Object.entries(data).map(([key, value]) => ({
    name: key,
    label: key
      .replace(/([A-Z])/g, ' $1')
      .replace(/^./, (s) => s.toUpperCase())
      .trim(),
    type: (typeof value === 'boolean'
      ? 'boolean'
      : typeof value === 'number'
        ? 'number'
        : 'string') as 'string' | 'number' | 'boolean',
  }))
}

export default function SettingsPage() {
  const { data: sections, isLoading } = trpc.settings.list.useQuery()
  const utils = trpc.useUtils()
  const updateMutation = trpc.settings.update.useMutation({
    onSuccess: () => {
      utils.settings.list.invalidate()
    },
  })

  if (isLoading) {
    return (
      <div className="container mx-auto max-w-2xl py-8">
        <h1 className="mb-6 text-2xl font-bold">Settings</h1>
        <p className="text-muted-foreground">Loading...</p>
      </div>
    )
  }

  if (!sections?.length) {
    return (
      <div className="container mx-auto max-w-2xl py-8">
        <h1 className="mb-6 text-2xl font-bold">Settings</h1>
        <p className="text-muted-foreground">No settings configured.</p>
      </div>
    )
  }

  return (
    <div className="container mx-auto max-w-2xl py-8">
      <h1 className="mb-6 text-2xl font-bold">Settings</h1>
      <div className="space-y-6">
        {sections.map((s) => (
          <SettingsSection
            key={s.section.id}
            meta={s.section as SettingsSectionMeta}
            data={s.data}
            fields={deriveFields(s.data)}
            onSave={(data) => updateMutation.mutate({ id: s.section.id, data })}
            saving={updateMutation.isPending}
          />
        ))}
      </div>
    </div>
  )
}
