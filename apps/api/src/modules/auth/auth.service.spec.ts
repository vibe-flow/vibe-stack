import { describe, it, expect, vi, beforeEach } from 'vitest'
import type { TestingModule } from '@nestjs/testing'
import { Test } from '@nestjs/testing'
import { JwtService } from '@nestjs/jwt'
import { ConfigService } from '@nestjs/config'
import { UnauthorizedException } from '@nestjs/common'
import { TRPCError } from '@trpc/server'
import { AuthService } from './auth.service'
import { PrismaService } from '../prisma/prisma.service'
import { MailService } from '../mail/mail.service'

const mockUser = {
  id: 'user-123',
  email: 'test@example.com',
  name: 'Test User',
  role: 'USER' as const,
  status: 'ACTIVE' as const,
  createdAt: new Date(),
  updatedAt: new Date(),
}

const mockPrismaService = {
  user: {
    findUnique: vi.fn(),
    findFirst: vi.fn(),
    findMany: vi.fn(),
    create: vi.fn(),
  },
  refreshToken: {
    create: vi.fn(),
    findUnique: vi.fn(),
    delete: vi.fn(),
    deleteMany: vi.fn(),
  },
  magicToken: {
    findFirst: vi.fn(),
    deleteMany: vi.fn(),
    create: vi.fn(),
    findUnique: vi.fn(),
    update: vi.fn(),
  },
}

const mockJwtService = {
  sign: vi.fn().mockReturnValue('mock_token'),
  verify: vi.fn().mockReturnValue({ sub: 'user-123' }),
}

const mockConfigService = {
  get: vi.fn().mockImplementation((key: string, defaultValue?: string) => {
    const config: Record<string, string> = {
      JWT_SECRET: 'test-secret',
      JWT_REFRESH_SECRET: 'test-refresh-secret',
      JWT_REFRESH_EXPIRES_IN: '7d',
    }
    return config[key] ?? defaultValue
  }),
}

const mockMailService = {
  sendMagicLink: vi.fn().mockResolvedValue(undefined),
}

const mockAuthConfig = {
  registrationMode: 'open' as const,
  magicLinkTtl: 15,
  devLogin: false,
}

describe('AuthService', () => {
  let service: AuthService

  beforeEach(async () => {
    vi.clearAllMocks()

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: PrismaService, useValue: mockPrismaService },
        { provide: JwtService, useValue: mockJwtService },
        { provide: ConfigService, useValue: mockConfigService },
        { provide: MailService, useValue: mockMailService },
        { provide: 'auth', useValue: mockAuthConfig },
      ],
    }).compile()

    service = module.get<AuthService>(AuthService)
  })

  describe('sendMagicLink', () => {
    it('should return success silently if cooldown token exists', async () => {
      mockPrismaService.magicToken.findFirst.mockResolvedValue({
        id: 'token-1',
        email: 'test@example.com',
        createdAt: new Date(),
      })

      const result = await service.sendMagicLink('test@example.com')

      expect(result).toEqual({ success: true, message: expect.any(String) })
      expect(mockMailService.sendMagicLink).not.toHaveBeenCalled()
    })

    it('should create user and send magic link in open mode', async () => {
      mockPrismaService.magicToken.findFirst.mockResolvedValue(null)
      mockPrismaService.magicToken.deleteMany.mockResolvedValue({ count: 0 })
      mockPrismaService.user.findUnique.mockResolvedValue(null)
      mockPrismaService.user.create.mockResolvedValue({ ...mockUser })
      mockPrismaService.magicToken.create.mockResolvedValue({})

      const result = await service.sendMagicLink('new@example.com')

      expect(result).toEqual({ success: true, message: expect.any(String) })
      expect(mockPrismaService.user.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ email: 'new@example.com', status: 'ACTIVE' }),
        }),
      )
      expect(mockMailService.sendMagicLink).toHaveBeenCalledWith(
        'new@example.com',
        expect.any(String),
        false,
      )
    })

    it('should send magic link to existing active user in open mode', async () => {
      mockPrismaService.magicToken.findFirst.mockResolvedValue(null)
      mockPrismaService.magicToken.deleteMany.mockResolvedValue({ count: 0 })
      mockPrismaService.user.findUnique.mockResolvedValue(mockUser)
      mockPrismaService.magicToken.create.mockResolvedValue({})

      const result = await service.sendMagicLink('test@example.com')

      expect(result).toEqual({ success: true, message: expect.any(String) })
      expect(mockMailService.sendMagicLink).toHaveBeenCalled()
    })

    it('should create PENDING user but not send email in approval mode', async () => {
      vi.spyOn(service as any, 'authConfig', 'get').mockReturnValue({
        ...mockAuthConfig,
        registrationMode: 'approval',
      })
      mockPrismaService.magicToken.findFirst.mockResolvedValue(null)
      mockPrismaService.magicToken.deleteMany.mockResolvedValue({ count: 0 })
      mockPrismaService.user.findUnique.mockResolvedValue(null)
      mockPrismaService.user.create.mockResolvedValue({ ...mockUser, status: 'PENDING' })

      const result = await service.sendMagicLink('pending@example.com')

      expect(result).toEqual({ success: true, message: expect.any(String) })
      expect(mockPrismaService.user.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ status: 'PENDING' }),
        }),
      )
      expect(mockMailService.sendMagicLink).not.toHaveBeenCalled()
    })

    it('should not create user and not send email in invite-only mode for unknown email', async () => {
      vi.spyOn(service as any, 'authConfig', 'get').mockReturnValue({
        ...mockAuthConfig,
        registrationMode: 'invite-only',
      })
      mockPrismaService.magicToken.findFirst.mockResolvedValue(null)
      mockPrismaService.magicToken.deleteMany.mockResolvedValue({ count: 0 })
      mockPrismaService.user.findUnique.mockResolvedValue(null)

      const result = await service.sendMagicLink('unknown@example.com')

      expect(result).toEqual({ success: true, message: expect.any(String) })
      expect(mockPrismaService.user.create).not.toHaveBeenCalled()
      expect(mockMailService.sendMagicLink).not.toHaveBeenCalled()
    })
  })

  describe('verifyMagicLink', () => {
    const rawToken = 'a'.repeat(64)

    it('should throw BAD_REQUEST if token not found', async () => {
      mockPrismaService.magicToken.findUnique.mockResolvedValue(null)

      await expect(service.verifyMagicLink(rawToken)).rejects.toMatchObject({
        code: 'BAD_REQUEST',
      })
    })

    it('should throw BAD_REQUEST if token is expired', async () => {
      mockPrismaService.magicToken.findUnique.mockResolvedValue({
        id: 'token-1',
        tokenHash: 'hash',
        email: 'test@example.com',
        userId: 'user-123',
        expiresAt: new Date(Date.now() - 1000),
        usedAt: null,
      })

      await expect(service.verifyMagicLink(rawToken)).rejects.toMatchObject({
        code: 'BAD_REQUEST',
      })
    })

    it('should throw BAD_REQUEST if token already used', async () => {
      mockPrismaService.magicToken.findUnique.mockResolvedValue({
        id: 'token-1',
        tokenHash: 'hash',
        email: 'test@example.com',
        userId: 'user-123',
        expiresAt: new Date(Date.now() + 900000),
        usedAt: new Date(),
      })

      await expect(service.verifyMagicLink(rawToken)).rejects.toMatchObject({
        code: 'BAD_REQUEST',
      })
    })

    it('should throw FORBIDDEN with ACCOUNT_PENDING cause if user is PENDING', async () => {
      mockPrismaService.magicToken.findUnique.mockResolvedValue({
        id: 'token-1',
        tokenHash: 'hash',
        email: 'pending@example.com',
        userId: null,
        expiresAt: new Date(Date.now() + 900000),
        usedAt: null,
      })
      mockPrismaService.magicToken.update.mockResolvedValue({})
      mockPrismaService.user.findUnique.mockResolvedValue({ ...mockUser, status: 'PENDING' })

      await expect(service.verifyMagicLink(rawToken)).rejects.toMatchObject({
        code: 'FORBIDDEN',
        cause: { code: 'ACCOUNT_PENDING' },
      })
    })

    it('should throw FORBIDDEN with ACCOUNT_DISABLED cause if user is DISABLED', async () => {
      mockPrismaService.magicToken.findUnique.mockResolvedValue({
        id: 'token-1',
        tokenHash: 'hash',
        email: 'disabled@example.com',
        userId: 'user-123',
        expiresAt: new Date(Date.now() + 900000),
        usedAt: null,
      })
      mockPrismaService.magicToken.update.mockResolvedValue({})
      mockPrismaService.user.findUnique.mockResolvedValue({ ...mockUser, status: 'DISABLED' })

      await expect(service.verifyMagicLink(rawToken)).rejects.toMatchObject({
        code: 'FORBIDDEN',
        cause: { code: 'ACCOUNT_DISABLED' },
      })
    })

    it('should return auth tokens for active user', async () => {
      mockPrismaService.magicToken.findUnique.mockResolvedValue({
        id: 'token-1',
        tokenHash: 'hash',
        email: 'test@example.com',
        userId: 'user-123',
        expiresAt: new Date(Date.now() + 900000),
        usedAt: null,
      })
      mockPrismaService.magicToken.update.mockResolvedValue({})
      mockPrismaService.user.findUnique.mockResolvedValue(mockUser)
      mockPrismaService.refreshToken.create.mockResolvedValue({})

      const result = await service.verifyMagicLink(rawToken)

      expect(result).toHaveProperty('accessToken')
      expect(result).toHaveProperty('refreshToken')
      expect(result.user.status).toBe('ACTIVE')
    })
  })

  describe('inviteUser', () => {
    it('should create user with ACTIVE status and send invite email', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue(null)
      mockPrismaService.user.create.mockResolvedValue(mockUser)
      mockPrismaService.magicToken.create.mockResolvedValue({})

      await service.inviteUser('invited@example.com', 'USER')

      expect(mockPrismaService.user.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ email: 'invited@example.com', status: 'ACTIVE' }),
        }),
      )
      expect(mockMailService.sendMagicLink).toHaveBeenCalledWith(
        'invited@example.com',
        expect.any(String),
        true,
      )
    })
  })

  describe('getDevUsers', () => {
    it('should throw UnauthorizedException outside development', async () => {
      const originalEnv = process.env.NODE_ENV
      process.env.NODE_ENV = 'production'

      await expect(service.getDevUsers()).rejects.toThrow(UnauthorizedException)

      process.env.NODE_ENV = originalEnv
    })

    it('should return users in development mode', async () => {
      const originalEnv = process.env.NODE_ENV
      process.env.NODE_ENV = 'development'
      vi.spyOn(service as any, 'authConfig', 'get').mockReturnValue({
        ...mockAuthConfig,
        devLogin: true,
      })
      mockPrismaService.user.findMany.mockResolvedValue([mockUser])

      const result = await service.getDevUsers()

      expect(result).toHaveLength(1)
      expect(result[0]).toHaveProperty('email')

      process.env.NODE_ENV = originalEnv
    })
  })

  describe('validateUser', () => {
    it('should return user with status field', async () => {
      const userWithStatus = {
        id: 'user-123',
        email: 'test@example.com',
        name: 'Test',
        role: 'USER',
        status: 'ACTIVE',
      }
      mockPrismaService.user.findUnique.mockResolvedValue(userWithStatus)

      const result = await service.validateUser('user-123')

      expect(result).toHaveProperty('status')
    })
  })

  describe('generateTokens', () => {
    it('should include status in returned user object', async () => {
      mockPrismaService.refreshToken.create.mockResolvedValue({})

      const result = await (service as any).generateTokens(mockUser)

      expect(result.user).toHaveProperty('status', 'ACTIVE')
    })
  })

  describe('refreshToken', () => {
    it('should throw UnauthorizedException for invalid token', async () => {
      mockPrismaService.refreshToken.findUnique.mockResolvedValue(null)

      await expect(service.refreshToken('invalid-token')).rejects.toThrow(UnauthorizedException)
    })
  })

  describe('logout', () => {
    it('should delete refresh token', async () => {
      mockPrismaService.refreshToken.deleteMany.mockResolvedValue({ count: 1 })

      await service.logout('user-123', 'some-refresh-token')

      expect(mockPrismaService.refreshToken.deleteMany).toHaveBeenCalled()
    })
  })
})
