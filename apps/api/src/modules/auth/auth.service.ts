import {
  Injectable,
  UnauthorizedException,
  ConflictException,
  Logger,
  Inject,
} from '@nestjs/common'
import { JwtService } from '@nestjs/jwt'
import { ConfigService } from '@nestjs/config'
import { compare, hash } from 'bcryptjs'
import { PrismaService } from '../prisma/prisma.service'
import type { LoginInput, RegisterInput, AuthResponse } from '@template-dev/shared'

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name)

  constructor(
    @Inject(PrismaService) private prisma: PrismaService,
    @Inject(JwtService) private jwtService: JwtService,
    @Inject(ConfigService) private configService: ConfigService,
  ) {}

  async register(input: RegisterInput): Promise<AuthResponse> {
    const existingUser = await this.prisma.user.findUnique({
      where: { email: input.email },
    })

    if (existingUser) {
      throw new ConflictException('User with this email already exists')
    }

    const hashedPassword = await hash(input.password, 10)

    const user = await this.prisma.user.create({
      data: {
        email: input.email,
        password: hashedPassword,
        name: input.name,
      },
    })

    this.logger.log(`New user registered: ${user.email}`)

    return this.generateTokens(user)
  }

  async login(input: LoginInput): Promise<AuthResponse> {
    const user = await this.prisma.user.findUnique({
      where: { email: input.email },
    })

    if (!user) {
      throw new UnauthorizedException('Invalid credentials')
    }

    const isPasswordValid = await compare(input.password, user.password)

    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid credentials')
    }

    this.logger.log(`User logged in: ${user.email}`)

    return this.generateTokens(user)
  }

  async loginAs(email?: string, role?: string): Promise<AuthResponse> {
    if (process.env.NODE_ENV !== 'development') {
      throw new UnauthorizedException('Dev-only endpoint')
    }

    const user = email
      ? await this.prisma.user.findUnique({ where: { email } })
      : await this.prisma.user.findFirst({ where: { role: role as any } })

    if (!user) {
      throw new UnauthorizedException('No user found with given criteria')
    }

    this.logger.log(`[DEV] Login as: ${user.email} (${user.role})`)

    return this.generateTokens(user)
  }

  async refreshToken(refreshToken: string): Promise<AuthResponse> {
    try {
      const payload = this.jwtService.verify(refreshToken, {
        secret: this.configService.get('JWT_REFRESH_SECRET'),
      })

      const tokenRecord = await this.prisma.refreshToken.findUnique({
        where: { token: refreshToken },
        include: { user: true },
      })

      if (!tokenRecord || tokenRecord.expiresAt < new Date()) {
        throw new UnauthorizedException('Invalid refresh token')
      }

      await this.prisma.refreshToken.delete({
        where: { id: tokenRecord.id },
      })

      return this.generateTokens(tokenRecord.user)
    } catch (error) {
      throw new UnauthorizedException('Invalid refresh token')
    }
  }

  async logout(userId: string, refreshToken: string): Promise<void> {
    await this.prisma.refreshToken.deleteMany({
      where: {
        userId,
        token: refreshToken,
      },
    })

    this.logger.log(`User logged out: ${userId}`)
  }

  private async generateTokens(user: any): Promise<AuthResponse> {
    const payload = {
      sub: user.id,
      email: user.email,
      role: user.role,
    }

    const accessToken = this.jwtService.sign(payload)

    const refreshToken = this.jwtService.sign(payload, {
      secret: this.configService.get('JWT_REFRESH_SECRET'),
      expiresIn: this.configService.get('JWT_REFRESH_EXPIRES_IN', '7d'),
    })

    const expiresInDays = parseInt(
      this.configService.get('JWT_REFRESH_EXPIRES_IN', '7d').replace('d', ''),
    )
    const expiresAt = new Date()
    expiresAt.setDate(expiresAt.getDate() + expiresInDays)

    await this.prisma.refreshToken.create({
      data: {
        token: refreshToken,
        userId: user.id,
        expiresAt,
      },
    })

    return {
      accessToken,
      refreshToken,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
      },
    }
  }

  async validateUser(userId: string) {
    return this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
      },
    })
  }
}
