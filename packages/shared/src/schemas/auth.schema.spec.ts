import { describe, it, expect } from 'vitest'
import {
  SendMagicLinkSchema,
  VerifyMagicLinkSchema,
  RefreshTokenSchema,
  InviteUserSchema,
  DevLoginSchema,
  AuthResponseSchema,
  MagicLinkSentSchema,
  DevUserSchema,
} from './auth.schema'

describe('SendMagicLinkSchema', () => {
  it('accepts a valid email', () => {
    const result = SendMagicLinkSchema.safeParse({ email: 'user@example.com' })
    expect(result.success).toBe(true)
  })

  it('rejects an invalid email', () => {
    const result = SendMagicLinkSchema.safeParse({ email: 'not-an-email' })
    expect(result.success).toBe(false)
  })
})

describe('VerifyMagicLinkSchema', () => {
  it('accepts a valid token', () => {
    const result = VerifyMagicLinkSchema.safeParse({ token: 'abc123' })
    expect(result.success).toBe(true)
  })

  it('rejects an empty token', () => {
    const result = VerifyMagicLinkSchema.safeParse({ token: '' })
    expect(result.success).toBe(false)
  })
})

describe('RefreshTokenSchema', () => {
  it('accepts a refresh token', () => {
    const result = RefreshTokenSchema.safeParse({ refreshToken: 'some-token' })
    expect(result.success).toBe(true)
  })
})

describe('InviteUserSchema', () => {
  it('accepts a valid email with default role USER', () => {
    const result = InviteUserSchema.safeParse({ email: 'invite@example.com' })
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.role).toBe('USER')
    }
  })

  it('accepts ADMIN role', () => {
    const result = InviteUserSchema.safeParse({ email: 'admin@example.com', role: 'ADMIN' })
    expect(result.success).toBe(true)
  })

  it('rejects an invalid role', () => {
    const result = InviteUserSchema.safeParse({ email: 'user@example.com', role: 'SUPERUSER' })
    expect(result.success).toBe(false)
  })
})

describe('DevLoginSchema', () => {
  it('accepts empty input', () => {
    const result = DevLoginSchema.safeParse({})
    expect(result.success).toBe(true)
  })

  it('accepts email and role', () => {
    const result = DevLoginSchema.safeParse({ email: 'dev@example.com', role: 'ADMIN' })
    expect(result.success).toBe(true)
  })
})

describe('AuthResponseSchema', () => {
  it('accepts a valid auth response with status', () => {
    const result = AuthResponseSchema.safeParse({
      accessToken: 'access-token',
      refreshToken: 'refresh-token',
      user: {
        id: 'user-1',
        email: 'user@example.com',
        name: 'User Name',
        role: 'USER',
        status: 'ACTIVE',
      },
    })
    expect(result.success).toBe(true)
  })

  it('accepts null name', () => {
    const result = AuthResponseSchema.safeParse({
      accessToken: 'access-token',
      refreshToken: 'refresh-token',
      user: {
        id: 'user-1',
        email: 'user@example.com',
        name: null,
        role: 'USER',
        status: 'PENDING',
      },
    })
    expect(result.success).toBe(true)
  })

  it('rejects missing status field', () => {
    const result = AuthResponseSchema.safeParse({
      accessToken: 'access-token',
      refreshToken: 'refresh-token',
      user: {
        id: 'user-1',
        email: 'user@example.com',
        name: null,
        role: 'USER',
      },
    })
    expect(result.success).toBe(false)
  })

  it('rejects invalid status value', () => {
    const result = AuthResponseSchema.safeParse({
      accessToken: 'access-token',
      refreshToken: 'refresh-token',
      user: {
        id: 'user-1',
        email: 'user@example.com',
        name: null,
        role: 'USER',
        status: 'BANNED',
      },
    })
    expect(result.success).toBe(false)
  })
})

describe('MagicLinkSentSchema', () => {
  it('accepts a valid success response', () => {
    const result = MagicLinkSentSchema.safeParse({ success: true, message: 'Check your email' })
    expect(result.success).toBe(true)
  })

  it('rejects success: false', () => {
    const result = MagicLinkSentSchema.safeParse({ success: false, message: 'Check your email' })
    expect(result.success).toBe(false)
  })
})

describe('DevUserSchema', () => {
  it('accepts a valid dev user', () => {
    const result = DevUserSchema.safeParse({
      id: 'user-1',
      email: 'dev@example.com',
      name: null,
      role: 'USER',
    })
    expect(result.success).toBe(true)
  })
})
