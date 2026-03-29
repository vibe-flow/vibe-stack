import { z } from 'zod'
import { UserRoleSchema, UserStatusSchema } from './user.schema'

// --- Input schemas ---
export const SendMagicLinkSchema = z.object({
  email: z.string().email('Invalid email address'),
})

export const VerifyMagicLinkSchema = z.object({
  token: z.string().min(1, 'Token is required'),
})

export const RefreshTokenSchema = z.object({
  refreshToken: z.string(),
})

export const InviteUserSchema = z.object({
  email: z.string().email('Invalid email address'),
  role: UserRoleSchema.default('USER'),
})

export const DevLoginSchema = z.object({
  email: z.string().email().optional(),
  role: UserRoleSchema.optional(),
})

// --- Response schemas ---
export const AuthResponseSchema = z.object({
  accessToken: z.string(),
  refreshToken: z.string(),
  user: z.object({
    id: z.string(),
    email: z.string().email(),
    name: z.string().nullable(),
    role: UserRoleSchema,
    status: UserStatusSchema,
  }),
})

export const MagicLinkSentSchema = z.object({
  success: z.literal(true),
  message: z.string(),
})

export const DevUserSchema = z.object({
  id: z.string(),
  email: z.string(),
  name: z.string().nullable(),
  role: UserRoleSchema,
})

// --- Types ---
export type SendMagicLinkInput = z.infer<typeof SendMagicLinkSchema>
export type VerifyMagicLinkInput = z.infer<typeof VerifyMagicLinkSchema>
export type RefreshTokenInput = z.infer<typeof RefreshTokenSchema>
export type InviteUserInput = z.infer<typeof InviteUserSchema>
export type DevLoginInput = z.infer<typeof DevLoginSchema>
export type AuthResponse = z.infer<typeof AuthResponseSchema>
export type MagicLinkSent = z.infer<typeof MagicLinkSentSchema>
export type DevUser = z.infer<typeof DevUserSchema>
