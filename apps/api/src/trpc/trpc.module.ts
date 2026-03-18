import { Module, forwardRef } from '@nestjs/common'
import { TrpcService } from './trpc.service'
import { TrpcRouter } from './trpc.router'
import { AuthModule } from '../modules/auth/auth.module'
import { UsersModule } from '../modules/users/users.module'
import { AiModule } from '../modules/ai/ai.module'
import { SettingsModule } from '../modules/settings/settings.module'

@Module({
  imports: [
    forwardRef(() => AuthModule),
    forwardRef(() => UsersModule),
    forwardRef(() => AiModule),
    forwardRef(() => SettingsModule),
  ],
  providers: [TrpcService, TrpcRouter],
  exports: [TrpcService],
})
export class TrpcModule {}
