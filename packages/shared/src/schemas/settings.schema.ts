import { z } from 'zod'

export const SettingsSectionMetaSchema = z.object({
  id: z.string(),
  label: z.string(),
  description: z.string().optional(),
  icon: z.string().optional(),
  sortOrder: z.number().optional(),
})

export type SettingsSectionMeta = z.infer<typeof SettingsSectionMetaSchema>

export const SettingsSectionResponseSchema = z.object({
  meta: SettingsSectionMetaSchema,
  data: z.record(z.unknown()),
})

export type SettingsSectionResponse = z.infer<typeof SettingsSectionResponseSchema>

export const UpdateSettingsSchema = z.object({
  id: z.string(),
  data: z.record(z.unknown()),
})

export type UpdateSettings = z.infer<typeof UpdateSettingsSchema>

export const GetSettingsSchema = z.object({
  id: z.string(),
})

export type GetSettings = z.infer<typeof GetSettingsSchema>
