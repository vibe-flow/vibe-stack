import type { OnModuleInit } from '@nestjs/common'
import { Injectable, Logger, Inject } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import type { ZodSchema } from 'zod'
import { zodToJsonSchema } from 'zod-to-json-schema'
import type { ChatMessage } from '@template-dev/shared'

export interface ChatCompletionParams {
  model?: string
  messages: ChatMessage[]
  temperature?: number
  maxTokens?: number
  userId?: string
  sessionId?: string
  tags?: string[]
}

export interface ChatCompletionResponse {
  content: string
  usage?: {
    prompt_tokens?: number
    completion_tokens?: number
    total_tokens?: number
  }
}

export interface EmbeddingParams {
  model?: string
  input: string | string[]
  userId?: string
}

export interface StructuredExtractParams<T> {
  schema: ZodSchema<T>
  systemPrompt: string
  text: string
  model?: string
  temperature?: number
}

@Injectable()
export class AiService implements OnModuleInit {
  private readonly logger = new Logger(AiService.name)
  private configured = false

  private readonly litellmBaseUrl: string | undefined
  private readonly litellmApiKey: string | undefined

  constructor(@Inject(ConfigService) private configService: ConfigService) {
    this.litellmBaseUrl = this.configService.get('LITELLM_BASE_URL')
    this.litellmApiKey = this.configService.get('LITELLM_MASTER_KEY')
  }

  async onModuleInit() {
    if (this.litellmBaseUrl && this.litellmApiKey) {
      this.configured = true
      this.logger.log('AI service initialized (direct LiteLLM)')
    } else {
      this.logger.warn(
        'LiteLLM not configured. Set LITELLM_BASE_URL and LITELLM_MASTER_KEY to enable AI features.',
      )
    }
  }

  // === Direct LLM calls ===

  async chatCompletion(params: ChatCompletionParams): Promise<ChatCompletionResponse> {
    this.ensureConfigured()

    const model = params.model ?? 'gpt-4o-mini'
    const temperature = params.temperature ?? 0.7

    const body: Record<string, unknown> = {
      model,
      messages: params.messages,
      temperature,
    }
    if (params.maxTokens !== undefined) body.max_tokens = params.maxTokens

    try {
      const startTime = Date.now()
      const data = await this.post('/chat/completions', body)
      const endTime = Date.now()

      const choice = data.choices?.[0]
      const content = choice?.message?.content ?? ''

      this.logger.log(`Chat completion completed in ${endTime - startTime}ms`)

      return {
        content,
        usage: data.usage
          ? {
              prompt_tokens: data.usage.prompt_tokens,
              completion_tokens: data.usage.completion_tokens,
              total_tokens: data.usage.total_tokens,
            }
          : undefined,
      }
    } catch (error) {
      this.logger.error('Chat completion error:', error)
      throw error
    }
  }

  async structuredExtract<T>(params: StructuredExtractParams<T>): Promise<T> {
    this.ensureConfigured()

    const model = params.model ?? 'gpt-4o-mini'
    const temperature = params.temperature ?? 0

    const jsonSchema = zodToJsonSchema(params.schema, 'extract')
    const toolDefinition = {
      type: 'function' as const,
      function: {
        name: 'extract',
        description: 'Extract structured data from the text',
        parameters: jsonSchema.definitions?.extract ?? jsonSchema,
      },
    }

    const body = {
      model,
      messages: [
        { role: 'system', content: params.systemPrompt },
        { role: 'user', content: params.text },
      ],
      tools: [toolDefinition],
      tool_choice: { type: 'function' as const, function: { name: 'extract' } },
      temperature,
    }

    try {
      const data = await this.post('/chat/completions', body)

      const toolCall = data.choices?.[0]?.message?.tool_calls?.[0]
      if (!toolCall?.function?.arguments) {
        throw new Error('No tool call in response')
      }

      let parsed: unknown
      try {
        parsed = JSON.parse(toolCall.function.arguments)
      } catch {
        throw new Error(`Failed to parse tool call arguments: ${toolCall.function.arguments}`)
      }

      return params.schema.parse(parsed)
    } catch (error) {
      this.logger.error('Structured extract error:', error)
      throw error
    }
  }

  async embedding(params: EmbeddingParams): Promise<number[][]> {
    this.ensureConfigured()

    const model = params.model ?? 'text-embedding-3-small'
    const input = Array.isArray(params.input) ? params.input : [params.input]

    try {
      const data = await this.post('/embeddings', { model, input })
      return data.data.map((item: { embedding: number[] }) => item.embedding)
    } catch (error) {
      this.logger.error('Embedding error:', error)
      throw error
    }
  }

  // === Status ===

  isConfigured(): boolean {
    return this.configured
  }

  // === Private ===

  private ensureConfigured(): void {
    if (!this.configured) {
      throw new Error('AI model not configured')
    }
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private async post(path: string, body: unknown): Promise<any> {
    const url = `${this.litellmBaseUrl}${path}`

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${this.litellmApiKey}`,
      },
      body: JSON.stringify(body),
    })

    if (!response.ok) {
      const errorText = await response.text()
      throw new Error(`LiteLLM error ${response.status}: ${errorText}`)
    }

    return response.json()
  }
}
