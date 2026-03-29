import { Injectable, UnauthorizedException, Inject } from '@nestjs/common'
import { PassportStrategy } from '@nestjs/passport'
import { ExtractJwt, Strategy } from 'passport-jwt'
import { ConfigService } from '@nestjs/config'
import type { AuthService } from '../auth.service'

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    @Inject(ConfigService) configService: ConfigService,
    @Inject(AuthService) private authService: AuthService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: configService.get('JWT_SECRET'),
    })
  }

  async validate(payload: any) {
    const user = await this.authService.validateUser(payload.sub)

    if (!user) {
      throw new UnauthorizedException()
    }

    if (user.status !== 'ACTIVE') {
      throw new UnauthorizedException()
    }

    return {
      userId: payload.sub,
      email: payload.email,
      role: payload.role,
      status: user.status,
    }
  }
}
