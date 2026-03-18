import { Module, Global, forwardRef } from '@nestjs/common'
import { SettingsService } from './settings.service'
import { SettingsTrpc } from './settings.trpc'
import { SettingsRegistry } from './settings.registry'
import { TrpcModule } from '../../trpc/trpc.module'

@Global()
@Module({
  imports: [forwardRef(() => TrpcModule)],
  providers: [SettingsRegistry, SettingsService, SettingsTrpc],
  exports: [SettingsRegistry, SettingsService, SettingsTrpc],
})
export class SettingsModule {}
