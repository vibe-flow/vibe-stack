import { registerAs } from '@nestjs/config'
import { z } from 'zod'

const AuthConfigSchema = z.object({
  registrationMode: z.enum(['open', 'approval', 'invite-only']).default('open'),
  magicLinkTtl: z.number().default(15),
  devLogin: z.boolean().default(false),
})

export default registerAs('auth', () => {
  const config = AuthConfigSchema.parse({
    registrationMode: process.env.AUTH_REGISTRATION_MODE ?? 'open',
    magicLinkTtl: Number(process.env.AUTH_MAGIC_LINK_TTL ?? 15),
    devLogin: process.env.AUTH_DEV_LOGIN === 'true' || process.env.NODE_ENV === 'development',
  })
  return config
})

export type AuthConfig = z.infer<typeof AuthConfigSchema>
