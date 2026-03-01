/* Этот файл описывает порт для сохранения и загрузки настроек отчёта. */
import type { ReportSettings } from '../../domain/models/reportSettings'

export interface SettingsStoragePort {
  load(): ReportSettings | null
  save(reportSettings: ReportSettings): void
}
