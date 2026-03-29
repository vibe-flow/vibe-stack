import { describe, it, expect, vi, beforeEach } from 'vitest'
import type { TestingModule } from '@nestjs/testing'
import { Test } from '@nestjs/testing'
import { ConfigService } from '@nestjs/config'
import { MailService } from './mail.service'

// Mock nodemailer
const mockSendMail = vi.fn().mockResolvedValue({ messageId: 'test-id' })
vi.mock('nodemailer', () => ({
  default: { createTransport: vi.fn(() => ({ sendMail: mockSendMail })) },
  createTransport: vi.fn(() => ({ sendMail: mockSendMail })),
}))

const mockConfigService = {
  get: vi.fn().mockImplementation((key: string) => {
    const config: Record<string, string> = {
      MAIL_HOST: 'localhost',
      MAIL_PORT: '1025',
      MAIL_FROM: 'noreply@test.com',
      FRONTEND_URL: 'http://localhost:5173',
    }
    return config[key]
  }),
}

describe('MailService', () => {
  let service: MailService

  beforeEach(async () => {
    vi.clearAllMocks()

    const module: TestingModule = await Test.createTestingModule({
      providers: [MailService, { provide: ConfigService, useValue: mockConfigService }],
    }).compile()

    service = module.get<MailService>(MailService)
  })

  describe('sendMagicLink', () => {
    it('should send email with correct recipient and login subject', async () => {
      await service.sendMagicLink('user@example.com', 'abc123', false)

      expect(mockSendMail).toHaveBeenCalledWith({
        from: 'noreply@test.com',
        to: 'user@example.com',
        subject: 'Votre lien de connexion',
        html: expect.stringContaining('/auth/verify?token=abc123'),
      })
    })

    it('should send email with invite subject when isInvite is true', async () => {
      await service.sendMagicLink('invited@example.com', 'token456', true)

      expect(mockSendMail).toHaveBeenCalledWith(
        expect.objectContaining({
          to: 'invited@example.com',
          subject: "Vous êtes invité à rejoindre l'application",
          html: expect.stringContaining("Accepter l'invitation"),
        }),
      )
    })

    it('should encode token in URL', async () => {
      await service.sendMagicLink('user@example.com', 'token+with/special=chars', false)

      expect(mockSendMail).toHaveBeenCalledWith(
        expect.objectContaining({
          html: expect.stringContaining('token%2Bwith%2Fspecial%3Dchars'),
        }),
      )
    })

    it('should build URL from FRONTEND_URL config', async () => {
      await service.sendMagicLink('user@example.com', 'mytoken', false)

      expect(mockSendMail).toHaveBeenCalledWith(
        expect.objectContaining({
          html: expect.stringContaining('http://localhost:5173/auth/verify?token=mytoken'),
        }),
      )
    })

    it('should throw Error when sendMail fails', async () => {
      mockSendMail.mockRejectedValueOnce(new Error('SMTP connection refused'))

      await expect(service.sendMagicLink('user@example.com', 'token', false)).rejects.toThrow(
        'Failed to send email',
      )
    })

    it('should include security message in HTML', async () => {
      await service.sendMagicLink('user@example.com', 'token', false)

      expect(mockSendMail).toHaveBeenCalledWith(
        expect.objectContaining({
          html: expect.stringContaining('Ce lien expire dans 15 minutes'),
        }),
      )
    })
  })
})
