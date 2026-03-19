import type { LoggerService as NestLoggerService } from '@nestjs/common'
import { Injectable } from '@nestjs/common'
import type { Logger } from 'pino'
import pino from 'pino'
import * as fs from 'fs'
import * as path from 'path'
import { HubLogBuffer } from './hub-log-buffer'

function readFlowConfig(): { hubServiceKey?: string } | null {
  // Walk up from cwd to find .flow/project.json (handles monorepo apps/api/ subdirectory)
  let dir = process.cwd()
  for (let i = 0; i < 5; i++) {
    const candidate = path.join(dir, '.flow', 'project.json')
    if (fs.existsSync(candidate)) {
      try {
        return JSON.parse(fs.readFileSync(candidate, 'utf-8'))
      } catch {
        return null
      }
    }
    const parent = path.dirname(dir)
    if (parent === dir) break
    dir = parent
  }
  return null
}

@Injectable()
export class LoggerService implements NestLoggerService {
  private readonly logger: Logger
  private readonly hubBuffer: HubLogBuffer | null = null

  constructor() {
    // Standard Pino logger (console output)
    this.logger = pino({
      transport:
        process.env.NODE_ENV !== 'production'
          ? {
              target: 'pino-pretty',
              options: {
                colorize: true,
                translateTime: 'HH:MM:ss Z',
                ignore: 'pid,hostname',
              },
            }
          : undefined,
      level: process.env.LOG_LEVEL || 'info',
    })

    // Hub log buffer (conditional — only if hubServiceKey is present in .flow/project.json)
    const flowConfig = readFlowConfig()
    if (flowConfig?.hubServiceKey) {
      const hubUrl = process.env.HUB_URL ?? 'http://hub.localhost'
      this.hubBuffer = new HubLogBuffer(hubUrl, flowConfig.hubServiceKey)
    }
  }

  log(message: string, context?: string): void {
    this.logger.info({ context }, message)
    this.hubBuffer?.push('info', message, context)
  }

  error(message: string, trace?: string, context?: string): void {
    this.logger.error({ context, trace }, message)
    this.hubBuffer?.push('error', message, context, trace ? { trace } : undefined)
  }

  warn(message: string, context?: string): void {
    this.logger.warn({ context }, message)
    this.hubBuffer?.push('warn', message, context)
  }

  debug(message: string, context?: string): void {
    this.logger.debug({ context }, message)
    this.hubBuffer?.push('debug', message, context)
  }

  verbose(message: string, context?: string): void {
    this.logger.trace({ context }, message)
    this.hubBuffer?.push('trace', message, context)
  }

  // Extended methods for structured logging
  info(message: string, data?: Record<string, unknown>, context?: string): void {
    this.logger.info({ context, ...data }, message)
    this.hubBuffer?.push('info', message, context, data)
  }

  logWithData(
    level: 'info' | 'warn' | 'error' | 'debug',
    message: string,
    data: Record<string, unknown>,
  ): void {
    this.logger[level](data, message)
    this.hubBuffer?.push(level, message, undefined, data)
  }

  // Create child logger with bound context
  child(bindings: Record<string, unknown>): Logger {
    return this.logger.child(bindings)
  }

  // Get raw pino instance for advanced usage
  getPinoInstance(): Logger {
    return this.logger
  }
}
