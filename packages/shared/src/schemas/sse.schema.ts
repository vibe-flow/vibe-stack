import { z } from 'zod'

export const SseActionSchema = z.enum(['create', 'update', 'delete'])

export const EntityChangedEventSchema = z.object({
  type: z.literal('entity_changed'),
  entity: z.string(),
  action: SseActionSchema,
  id: z.string(),
})

export const HeartbeatEventSchema = z.object({
  type: z.literal('heartbeat'),
})

export const SseEventSchema = z.discriminatedUnion('type', [
  EntityChangedEventSchema,
  HeartbeatEventSchema,
])

export type SseAction = z.infer<typeof SseActionSchema>
export type EntityChangedEvent = z.infer<typeof EntityChangedEventSchema>
export type HeartbeatEvent = z.infer<typeof HeartbeatEventSchema>
export type SseEvent = z.infer<typeof SseEventSchema>
