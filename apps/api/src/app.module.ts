import { Module } from '@nestjs/common'
import { ConfigModule } from '@nestjs/config'
import { ThrottlerModule } from '@nestjs/throttler'
import { APP_PIPE } from '@nestjs/core'
import { ZodValidationPipe } from 'nestjs-zod'
import { EnvSchema } from '@template-dev/shared'
import { AppController } from './app.controller'
import { AppService } from './app.service'
import { PrismaModule } from './modules/prisma/prisma.module'
import { SettingsModule } from './modules/settings/settings.module'
import { AuthModule } from './modules/auth/auth.module'
import { UsersModule } from './modules/users/users.module'
import { AiModule } from './modules/ai/ai.module'
import { LangfuseModule } from './modules/langfuse'
import { PythonModule } from './modules/python/python.module'
import { LoggerModule } from './modules/logger/logger.module'
// import { QueueModule } from './modules/queue/queue.module'; // Uncomment to enable
import { SseModule } from './modules/sse/sse.module'
import { TrpcModule } from './trpc/trpc.module'
import { MailModule } from './modules/mail/mail.module'
import authConfig from './config/auth.config'

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [authConfig],
      validate: (config) => {
        try {
          return EnvSchema.parse(config)
        } catch (error) {
          console.error('Invalid environment variables:', error)
          process.exit(1)
        }
      },
    }),
    ThrottlerModule.forRoot([
      {
        ttl: 60000,
        limit: 10,
      },
    ]),
    LoggerModule,
    PrismaModule,
    SettingsModule,
    AuthModule,
    UsersModule,
    LangfuseModule,
    AiModule,
    PythonModule,
    // QueueModule, // Uncomment to enable
    SseModule,
    MailModule,
    TrpcModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    {
      provide: APP_PIPE,
      useClass: ZodValidationPipe,
    },
  ],
})
export class AppModule {}
