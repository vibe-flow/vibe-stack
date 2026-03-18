import { Injectable } from '@nestjs/common'
import type { ZodType } from 'zod'

export interface SettingsSectionDefinition {
  id: string
  label: string
  description?: string
  icon?: string
  schema: ZodType
  defaults: Record<string, unknown>
  sortOrder?: number
}

@Injectable()
export class SettingsRegistry {
  private sections: Map<string, SettingsSectionDefinition> = new Map()

  register(section: SettingsSectionDefinition): void {
    this.sections.set(section.id, section)
  }

  get(id: string): SettingsSectionDefinition | undefined {
    return this.sections.get(id)
  }

  list(): SettingsSectionDefinition[] {
    return Array.from(this.sections.values()).sort(
      (a, b) => (a.sortOrder ?? 100) - (b.sortOrder ?? 100),
    )
  }

  has(id: string): boolean {
    return this.sections.has(id)
  }
}
