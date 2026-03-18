import { describe, it, expect, vi, beforeEach } from 'vitest'
import { z } from 'zod'
import { SettingsService } from '../settings.service'
import { SettingsRegistry } from '../settings.registry'

const TestSchema = z.object({
  name: z.string().default('default-name'),
  port: z.number().default(3000),
  debug: z.boolean().default(false),
})

const mockPrisma = {
  setting: {
    findUnique: vi.fn(),
    upsert: vi.fn(),
    findMany: vi.fn(),
  },
}

describe('SettingsService', () => {
  let service: SettingsService
  let registry: SettingsRegistry

  beforeEach(() => {
    vi.clearAllMocks()
    registry = new SettingsRegistry()
    registry.register({
      id: 'test',
      label: 'Test Settings',
      schema: TestSchema,
      defaults: TestSchema.parse({}),
    })
    service = new SettingsService(mockPrisma as any, registry)
  })

  describe('get', () => {
    it('should return defaults when section not in DB', async () => {
      mockPrisma.setting.findUnique.mockResolvedValue(null)
      const result = await service.get('test')
      expect(result).toEqual({ name: 'default-name', port: 3000, debug: false })
    })

    it('should return stored data when section exists', async () => {
      mockPrisma.setting.findUnique.mockResolvedValue({
        id: 'test',
        data: { name: 'custom', port: 8080, debug: true },
      })
      const result = await service.get('test')
      expect(result).toEqual({ name: 'custom', port: 8080, debug: true })
    })

    it('should throw for unknown section', async () => {
      await expect(service.get('unknown')).rejects.toThrow('Unknown settings section: unknown')
    })
  })

  describe('update', () => {
    it('should merge partial data with existing', async () => {
      mockPrisma.setting.findUnique.mockResolvedValue({
        id: 'test',
        data: { name: 'old', port: 3000, debug: false },
      })
      mockPrisma.setting.upsert.mockResolvedValue({})

      await service.update('test', { name: 'new' })

      expect(mockPrisma.setting.upsert).toHaveBeenCalledWith({
        where: { id: 'test' },
        create: { id: 'test', data: { name: 'new', port: 3000, debug: false } },
        update: { data: { name: 'new', port: 3000, debug: false } },
      })
    })

    it('should merge with defaults when section not in DB', async () => {
      mockPrisma.setting.findUnique.mockResolvedValue(null)
      mockPrisma.setting.upsert.mockResolvedValue({})

      await service.update('test', { port: 9090 })

      expect(mockPrisma.setting.upsert).toHaveBeenCalledWith({
        where: { id: 'test' },
        create: { id: 'test', data: { name: 'default-name', port: 9090, debug: false } },
        update: { data: { name: 'default-name', port: 9090, debug: false } },
      })
    })

    it('should reject invalid data', async () => {
      mockPrisma.setting.findUnique.mockResolvedValue(null)
      await expect(service.update('test', { port: 'not-a-number' })).rejects.toThrow()
    })

    it('should throw for unknown section', async () => {
      await expect(service.update('unknown', {})).rejects.toThrow('Unknown settings section: unknown')
    })
  })

  describe('listAll', () => {
    it('should return all sections with data', async () => {
      mockPrisma.setting.findMany.mockResolvedValue([
        { id: 'test', data: { name: 'stored', port: 3000, debug: false } },
      ])

      const result = await service.listAll()
      expect(result).toHaveLength(1)
      expect(result[0].section.id).toBe('test')
      expect(result[0].data).toEqual({ name: 'stored', port: 3000, debug: false })
    })

    it('should use defaults for sections not in DB', async () => {
      mockPrisma.setting.findMany.mockResolvedValue([])

      const result = await service.listAll()
      expect(result).toHaveLength(1)
      expect(result[0].data).toEqual({ name: 'default-name', port: 3000, debug: false })
    })
  })
})

describe('SettingsRegistry', () => {
  let registry: SettingsRegistry

  beforeEach(() => {
    registry = new SettingsRegistry()
  })

  it('should register and retrieve a section', () => {
    registry.register({ id: 'test', label: 'Test', schema: TestSchema, defaults: {} })
    expect(registry.get('test')).toBeDefined()
    expect(registry.get('test')!.label).toBe('Test')
  })

  it('should list sections sorted by sortOrder', () => {
    registry.register({ id: 'b', label: 'B', schema: TestSchema, defaults: {}, sortOrder: 2 })
    registry.register({ id: 'a', label: 'A', schema: TestSchema, defaults: {}, sortOrder: 1 })
    const list = registry.list()
    expect(list[0].id).toBe('a')
    expect(list[1].id).toBe('b')
  })

  it('should return false for unknown section', () => {
    expect(registry.has('nope')).toBe(false)
  })
})
