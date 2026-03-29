import { z } from 'zod'

export const UserPreferenceKeySchema = z.string().min(1).max(255)

/** JSON-serializable value — matches what PostgreSQL Json column accepts */
const JsonValue: z.ZodType<unknown> = z.lazy(() =>
  z.union([z.string(), z.number(), z.boolean(), z.null(), z.array(JsonValue), z.record(JsonValue)]),
)
export const UserPreferenceValueSchema = JsonValue

export const GetUserPreferenceSchema = z.object({
  key: UserPreferenceKeySchema,
})

export const SetUserPreferenceSchema = z.object({
  key: UserPreferenceKeySchema,
  value: UserPreferenceValueSchema,
})

export const DeleteUserPreferenceSchema = z.object({
  key: UserPreferenceKeySchema,
})

export const BulkSetUserPreferencesSchema = z.object({
  preferences: z
    .array(
      z.object({
        key: UserPreferenceKeySchema,
        value: UserPreferenceValueSchema,
      }),
    )
    .max(500),
})

export const UserPreferenceSchema = z.object({
  id: z.string(),
  userId: z.string(),
  key: z.string(),
  value: UserPreferenceValueSchema,
  updatedAt: z.date(),
})

export type GetUserPreferenceInput = z.infer<typeof GetUserPreferenceSchema>
export type SetUserPreferenceInput = z.infer<typeof SetUserPreferenceSchema>
export type DeleteUserPreferenceInput = z.infer<typeof DeleteUserPreferenceSchema>
export type BulkSetUserPreferencesInput = z.infer<typeof BulkSetUserPreferencesSchema>
export type UserPreference = z.infer<typeof UserPreferenceSchema>
