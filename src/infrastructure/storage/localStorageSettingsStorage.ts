/* Этот файл реализует сохранение настроек отчёта через localStorage. */
import type { SettingsStoragePort } from '../../application/ports/settingsStoragePort'
import type { ReportSettings } from '../../domain/models/reportSettings'

const STORAGE_KEY = 'dailyReport.settings'

export class LocalStorageSettingsStorage implements SettingsStoragePort {
  public load(): ReportSettings | null {
    try {
      const serializedSettings = localStorage.getItem(STORAGE_KEY)

      if (!serializedSettings) {
        return null
      }

      return JSON.parse(serializedSettings) as ReportSettings
    } catch {
      return null
    }
  }

  public save(reportSettings: ReportSettings): void {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(reportSettings))
    } catch {
      // Игнорируем ошибки записи (например, QuotaExceededError)
    }
  }
}
