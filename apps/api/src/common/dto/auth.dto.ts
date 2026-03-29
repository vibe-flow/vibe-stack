import { createZodDto } from 'nestjs-zod'
import {
  SendMagicLinkSchema,
  VerifyMagicLinkSchema,
  InviteUserSchema,
  RefreshTokenSchema,
  AuthResponseSchema,
} from '@template-dev/shared'

export class SendMagicLinkDto extends createZodDto(SendMagicLinkSchema) {}
export class VerifyMagicLinkDto extends createZodDto(VerifyMagicLinkSchema) {}
export class InviteUserDto extends createZodDto(InviteUserSchema) {}
export class RefreshTokenDto extends createZodDto(RefreshTokenSchema) {}
export class AuthResponseDto extends createZodDto(AuthResponseSchema) {}
