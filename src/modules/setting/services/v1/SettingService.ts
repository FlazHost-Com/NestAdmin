import { Injectable } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository } from 'typeorm'
import { v4 as uuidv4 } from 'uuid'
import { Setting } from '../../models/setting.entity'
import { ISettingService } from './ISettingService'
import { SettingCacheService } from '../../../../services/setting-cache.service'
import { THEMES } from '../../../../config/themes'
import { AppError } from '../../../../errors/AppError'

// Minimal opentailwind stub — real catalog can be fetched from remote API
const EMPTY_FE_TEMPLATES: any[] = []

@Injectable()
export class SettingService implements ISettingService {
  constructor(
    @InjectRepository(Setting) private repo: Repository<Setting>,
    private cache: SettingCacheService,
  ) {}

  async index(filter: Record<string, any> = {}): Promise<any> {
    // Ensure a singleton setting row exists
    let data = await this.repo.findOne({ where: {} })
    if (!data) {
      data = await this.repo.save(this.repo.create({ id: uuidv4(), theme: 'Blue', fe_template: '' }))
    }

    // Build themes map for view
    const themes: Record<string, any> = {}
    for (const t of THEMES) {
      themes[t.name] = { primary: t.primary, secondary: t.secondary, light: t.light, dark: t.dark }
    }

    // Frontend template catalog — paginated (stub: empty list)
    const qName: string = filter.q_name || ''
    const qCategory: string = filter.q_category || ''
    const qPage: number = parseInt(filter.q_page || '1', 10) || 1
    const qPageSize: number = parseInt(filter.q_page_size || '8', 10) || 8

    const allTemplates = EMPTY_FE_TEMPLATES.filter(t => {
      if (qName && !t.name.toLowerCase().includes(qName.toLowerCase())) return false
      if (qCategory && t.category !== qCategory) return false
      return true
    })
    const total = allTemplates.length
    const start = (qPage - 1) * qPageSize
    const feTemplates = allTemplates.slice(start, start + qPageSize)
    const feCategories: string[] = [...new Set(EMPTY_FE_TEMPLATES.map((t: any) => t.category))]

    return {
      data,
      themes,
      feTemplates,
      feCategories,
      feTemplate: data.fe_template,
      paginate_data: {
        total_data: total,
        total_page: Math.ceil(total / qPageSize) || 1,
        current_page: qPage,
        page_size: qPageSize,
      },
      filter: { q_name: qName, q_category: qCategory, q_page: qPage, q_page_size: qPageSize },
    }
  }

  async update(request: any, files?: Record<string, any[]>): Promise<Setting> {
    let data = await this.repo.findOne({ where: {} })
    if (!data) {
      data = this.repo.create({ id: uuidv4() })
    }

    // Handle file uploads (multer)
    const fileFields = ['icon', 'logo', 'login_image']
    for (const field of fileFields) {
      if (files?.[field]?.[0]) {
        ;(request as any)[field] = files[field][0].filename ?? files[field][0].path
      }
    }

    const allowed = ['initial', 'name', 'description', 'icon', 'logo', 'login_image',
                     'phone', 'address', 'email', 'copyright', 'theme', 'fe_template']
    for (const key of allowed) {
      if (request[key] !== undefined) (data as any)[key] = request[key]
    }

    const result = await this.repo.save(data)
    if (!result) throw new AppError('Update Setting failed', 500)
    this.cache.invalidate()
    return result
  }

  async fePreview(slug: string): Promise<string> {
    // Stub: real implementation fetches from opentailwind CDN / cache
    return `<!DOCTYPE html><html><body style="font-family:sans-serif;padding:2rem;text-align:center">
      <h2>Template: ${slug}</h2>
      <p>Preview not available in stub mode.</p>
    </body></html>`
  }
}
