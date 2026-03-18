import { Injectable, Inject } from '@nestjs/common'
import { PrismaService } from '../prisma/prisma.service'
import { SettingsRegistry } from './settings.registry'

@Injectable()
export class SettingsService {
  constructor(
    @Inject(PrismaService) private readonly prisma: PrismaService,
    @Inject(SettingsRegistry) private readonly registry: SettingsRegistry,
  ) {}

  async get<T = Record<string, unknown>>(sectionId: string): Promise<T> {
    const section = this.registry.get(sectionId)
    if (!section) {
      throw new Error(`Unknown settings section: ${sectionId}`)
    }

    const record = await this.prisma.setting.findUnique({ where: { id: sectionId } })
    if (!record) {
      return section.defaults as T
    }

    return record.data as T
  }

  async update(sectionId: string, data: Record<string, unknown>): Promise<void> {
    const section = this.registry.get(sectionId)
    if (!section) {
      throw new Error(`Unknown settings section: ${sectionId}`)
    }

    const existing = await this.prisma.setting.findUnique({ where: { id: sectionId } })
    const current = (existing?.data as Record<string, unknown>) ?? section.defaults
    const merged = { ...current, ...data }

    const validated = section.schema.parse(merged)

    await this.prisma.setting.upsert({
      where: { id: sectionId },
      create: { id: sectionId, data: validated },
      update: { data: validated },
    })
  }

  async listAll(): Promise<
    Array<{
      section: { id: string; label: string; description?: string; icon?: string; sortOrder?: number }
      data: Record<string, unknown>
    }>
  > {
    const sections = this.registry.list()
    const records = await this.prisma.setting.findMany()
    const recordMap = new Map(records.map((r) => [r.id, r.data]))

    return sections.map((section) => ({
      section: {
        id: section.id,
        label: section.label,
        description: section.description,
        icon: section.icon,
        sortOrder: section.sortOrder,
      },
      data: (recordMap.get(section.id) as Record<string, unknown>) ?? section.defaults,
    }))
  }
}
