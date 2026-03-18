import { NestFactory } from '@nestjs/core'
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger'
import { Logger } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { cleanupOpenApiDoc } from 'nestjs-zod'
import * as pino from 'pino'
import { AppModule } from './app.module'
import { TrpcRouter } from './trpc/trpc.router'

async function bootstrap() {
  const logger = pino.default({
    transport: {
      target: 'pino-pretty',
      options: {
        colorize: true,
        translateTime: 'HH:MM:ss Z',
        ignore: 'pid,hostname',
      },
    },
  })

  const app = await NestFactory.create(AppModule, {
    logger: ['error', 'warn', 'log', 'debug', 'verbose'],
  })

  const configService = app.get(ConfigService)
  const port = configService.get('BACKEND_PORT', 3000)

  // CORS - origin: true accepts all origins in dev (local-services via Caddy or direct)
  app.enableCors({
    origin: true,
    credentials: true,
  })

  // Global prefix
  app.setGlobalPrefix('api')

  // Swagger documentation
  const config = new DocumentBuilder()
    .setTitle('Template Dev API')
    .setDescription('Full-stack template API documentation')
    .setVersion('1.0')
    .addBearerAuth()
    .build()

  const document = SwaggerModule.createDocument(app, config)
  const cleanedDocument = cleanupOpenApiDoc(document)
  SwaggerModule.setup('api/docs', app, cleanedDocument)

  // tRPC
  const trpc = app.get(TrpcRouter)
  await trpc.applyMiddleware(app)

  await app.listen(port)

  Logger.log(`🚀 Application is running on: http://localhost:${port}/api`)
  Logger.log(`📚 Swagger documentation: http://localhost:${port}/api/docs`)
  Logger.log(`🔌 tRPC endpoint: http://localhost:${port}/trpc`)
}

bootstrap()
