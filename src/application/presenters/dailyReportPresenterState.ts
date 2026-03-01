/* Этот файл описывает состояние presenter-слоя для страницы отчета. */
import type { TaskRow } from '../../domain/models/taskRow'
import type { TaskRowParseError } from '../../domain/models/taskRowParseError'
import type { NormalizationIssue } from '../../domain/models/normalizationIssue'
import type { InputSourceMode } from '../../domain/types/inputSourceMode'
import type { TaskStatus } from '../../domain/types/taskStatus'

export type ImageProcessingState = 'idle' | 'processing' | 'success' | 'error'

export interface DailyReportPresenterState {
  inputSourceMode: InputSourceMode
  rawInputText: string
  normalizedInputText: string
  shouldNormalizeOcrText: boolean
  normalizationIssues: NormalizationIssue[]
  linkTemplate: string
  excludedSymbolsText: string
  shouldNormalizeWhitespace: boolean
  selectedImageFileName: string | null
  imagePreviewUrl: string | null
  imageProcessingState: ImageProcessingState
  isRecognizingImage: boolean
  imageRecognitionProgressRatio: number
  imageRecognitionStatusText: string | null
  parsedTaskRows: TaskRow[]
  parsingErrors: TaskRowParseError[]
  markdownResultText: string
  informationMessage: string | null
  taskStatusOptions: readonly TaskStatus[]
}
