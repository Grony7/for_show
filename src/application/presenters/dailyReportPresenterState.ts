/* Этот файл описывает состояние presenter-слоя для страницы отчета. */
import type { TaskRow } from '../../domain/models/taskRow'
import type { TaskRowParseError } from '../../domain/models/taskRowParseError'
import type { TaskStatus } from '../../domain/types/taskStatus'

export interface DailyReportPresenterState {
  rawInputText: string
  linkTemplate: string
  excludedSymbolsText: string
  shouldNormalizeWhitespace: boolean
  parsedTaskRows: TaskRow[]
  parsingErrors: TaskRowParseError[]
  markdownResultText: string
  informationMessage: string | null
  taskStatusOptions: readonly TaskStatus[]
}
