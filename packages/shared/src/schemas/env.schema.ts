import { z } from 'zod'

export const EnvSchema = z.object({
  // Database
  DATABASE_URL: z.string().url(),

  // Redis
  REDIS_URL: z.string().url(),

  // JWT
  JWT_SECRET: z.string().min(32, 'JWT_SECRET must be at least 32 characters'),
  JWT_EXPIRES_IN: z.string().default('15m'),
  JWT_REFRESH_SECRET: z.string().min(32, 'JWT_REFRESH_SECRET must be at least 32 characters'),
  JWT_REFRESH_EXPIRES_IN: z.string().default('7d'),

  // LiteLLM (optional)
  LITELLM_BASE_URL: z.string().url().optional(),
  LITELLM_MASTER_KEY: z.string().optional(),

  // LLM Providers (optional)
  ANTHROPIC_API_KEY: z.string().optional(),
  OPENAI_API_KEY: z.string().optional(),

  // Langfuse (optional)
  LANGFUSE_PUBLIC_KEY: z.string().optional(),
  LANGFUSE_SECRET_KEY: z.string().optional(),
  LANGFUSE_HOST: z.string().url().optional(),

  // Queue
  QUEUE_ENABLED: z
    .string()
    .transform((val) => val === 'true')
    .default('false'),

  // Logging
  LOG_LEVEL: z.enum(['trace', 'debug', 'info', 'warn', 'error', 'fatal']).default('info'),

  // Ports
  FRONTEND_PORT: z.string().default('5173'),
  BACKEND_PORT: z.string().default('3000'),
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),

  // Mail (required when magic-link auth is enabled)
  MAIL_HOST: z.string().default('localhost'),
  MAIL_PORT: z.string().default('1025'),
  MAIL_FROM: z.string().default('noreply@localhost'),

  // Frontend
  FRONTEND_URL: z.string().url().default('http://localhost:5173'),

  // Auth
  AUTH_REGISTRATION_MODE: z.string().optional(),
  AUTH_MAGIC_LINK_TTL: z.string().optional(),
  AUTH_DEV_LOGIN: z.string().optional(),
})

export type Env = z.infer<typeof EnvSchema>
