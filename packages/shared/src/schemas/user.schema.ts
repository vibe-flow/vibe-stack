import { z } from 'zod'

export const UserRoleSchema = z.enum(['USER', 'ADMIN'])

export const UserStatusSchema = z.enum(['ACTIVE', 'PENDING', 'DISABLED'])

export const UserSchema = z.object({
  id: z.string(),
  email: z.string().email(),
  name: z.string().nullable(),
  role: UserRoleSchema,
  status: UserStatusSchema,
  createdAt: z.date(),
  updatedAt: z.date(),
})

export const UpdateUserSchema = z.object({
  email: z.string().email().optional(),
  name: z.string().nullable().optional(),
  role: UserRoleSchema.optional(),
})

export type User = z.infer<typeof UserSchema>
export type UserRole = z.infer<typeof UserRoleSchema>
export type UserStatus = z.infer<typeof UserStatusSchema>
export type UpdateUser = z.infer<typeof UpdateUserSchema>
