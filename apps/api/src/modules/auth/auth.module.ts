import { Module, forwardRef } from '@nestjs/common'
import { JwtModule } from '@nestjs/jwt'
import { PassportModule } from '@nestjs/passport'
import { ConfigModule, ConfigService } from '@nestjs/config'
import { AuthService } from './auth.service'
import { AuthController } from './auth.controller'
import { AuthTrpc } from './auth.trpc'
import { JwtStrategy } from './strategies/jwt.strategy'
import { UsersModule } from '../users/users.module'
import { TrpcModule } from '../../trpc/trpc.module'
import { MailModule } from '../mail/mail.module'
import authConfig from '../../config/auth.config'

@Module({
  imports: [
    ConfigModule.forFeature(authConfig),
    PassportModule.register({ defaultStrategy: 'jwt' }),
    JwtModule.registerAsync({
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        secret: configService.get('JWT_SECRET'),
        signOptions: {
          expiresIn: configService.get('JWT_EXPIRES_IN', '15m'),
        },
      }),
    }),
    UsersModule,
    MailModule,
    forwardRef(() => TrpcModule),
  ],
  controllers: [AuthController],
  providers: [AuthService, AuthTrpc, JwtStrategy],
  exports: [AuthService, AuthTrpc, JwtStrategy, PassportModule, JwtModule],
})
export class AuthModule {}
