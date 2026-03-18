import { Injectable, Inject } from '@nestjs/common'
import { TrpcService } from '../../trpc/trpc.service'
import { SettingsService } from './settings.service'
import { GetSettingsSchema, UpdateSettingsSchema } from '@template-dev/shared'

@Injectable()
export class SettingsTrpc {
  router: ReturnType<TrpcService['router']>

  constructor(
    @Inject(TrpcService) private readonly trpc: TrpcService,
    @Inject(SettingsService) private readonly settingsService: SettingsService,
  ) {
    this.router = this.trpc.router({
      list: this.trpc.adminProcedure.query(async () => {
        return this.settingsService.listAll()
      }),

      get: this.trpc.adminProcedure
        .input(GetSettingsSchema)
        .query(async ({ input }) => {
          const data = await this.settingsService.get(input.id)
          return { id: input.id, data }
        }),

      update: this.trpc.adminProcedure
        .input(UpdateSettingsSchema)
        .mutation(async ({ input }) => {
          await this.settingsService.update(input.id, input.data)
          return { success: true }
        }),
    })
  }
}
