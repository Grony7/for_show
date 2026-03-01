/* Этот файл содержит вспомогательные функции для presenter-а отчёта. */
import { defaultReportDocumentTemplate } from '../../domain/constants/defaultReportDocumentTemplate'
import { defaultReportLineTemplate } from '../../domain/constants/defaultReportLineTemplate'
import { defaultTaskLinkTemplate } from '../../domain/constants/defaultTaskLinkTemplate'
import type { NormalizationIssue } from '../../domain/models/normalizationIssue'
import type { ReportSettings } from '../../domain/models/reportSettings'
import type { TaskRow } from '../../domain/models/taskRow'
import { taskStatusValues } from '../../domain/types/taskStatus'
import type { TaskStatus } from '../../domain/types/taskStatus'
import type { ReportVariablesBuilderPort } from '../ports/reportVariablesBuilderPort'
import type { TemplateEngine } from '../template-engine/templateEngine'
import {
  documentTemplateVariableTokens,
  lineTemplateVariableTokens,
} from '../template-engine/templateVariables'
import { buildReport } from '../use-cases/buildReport'
import type { DailyReportPresenterState } from './dailyReportPresenterState'

export function buildDefaultReportDate(): string {
  const now = new Date()
  const yearText = String(now.getFullYear())
  const monthText = String(now.getMonth() + 1).padStart(2, '0')
  const dayText = String(now.getDate()).padStart(2, '0')
  return `${yearText}-${monthText}-${dayText}`
}

export function createInitialState(
  savedSettings: ReportSettings | null,
): DailyReportPresenterState {
  return {
    inputSourceMode: 'TEXT',
    rawInputText: '',
    normalizedInputText: '',
    shouldNormalizeOcrText: savedSettings?.shouldNormalizeOcrText ?? true,
    normalizationIssues: [],
    linkTemplate: savedSettings?.linkTemplate ?? defaultTaskLinkTemplate,
    excludedSymbolsText: savedSettings?.excludedSymbolsText ?? '→',
    shouldNormalizeWhitespace: savedSettings?.shouldNormalizeWhitespace ?? true,
    selectedImageFileName: null,
    imagePreviewUrl: null,
    imageProcessingState: 'idle',
    isRecognizingImage: false,
    imageRecognitionProgressRatio: 0,
    imageRecognitionStatusText: null,
    parsedTaskRows: [],
    parsingErrors: [],
    lineTemplate: savedSettings?.lineTemplate ?? defaultReportLineTemplate,
    documentTemplate: savedSettings?.documentTemplate ?? defaultReportDocumentTemplate,
    reportDate: buildDefaultReportDate(),
    selectedPreviewTaskId: null,
    linePreviewText: '',
    reportBuildIssues: [],
    markdownResultText: '',
    informationMessage: null,
    taskStatusOptions: taskStatusValues,
    lineTemplateVariableTokens,
    documentTemplateVariableTokens,
  }
}

export function extractSettingsFromState(state: DailyReportPresenterState): ReportSettings {
  return {
    documentTemplate: state.documentTemplate,
    lineTemplate: state.lineTemplate,
    linkTemplate: state.linkTemplate,
    excludedSymbolsText: state.excludedSymbolsText,
    shouldNormalizeWhitespace: state.shouldNormalizeWhitespace,
    shouldNormalizeOcrText: state.shouldNormalizeOcrText,
  }
}

export function buildParsingMessage(
  parsedTaskRowsCount: number,
  parsingErrorsCount: number,
): string {
  if (parsedTaskRowsCount === 0 && parsingErrorsCount === 0) {
    return 'Введите строки задач для разбора.'
  }

  if (parsingErrorsCount === 0) {
    return `Распознано задач: ${parsedTaskRowsCount}.`
  }

  return `Распознано задач: ${parsedTaskRowsCount}. Ошибок: ${parsingErrorsCount}.`
}

export function buildParsingMessageWithNormalization(
  parsedTaskRowsCount: number,
  parsingErrorsCount: number,
  normalizationIssues: NormalizationIssue[],
): string {
  const normalizationErrorCount = normalizationIssues.filter(
    (normalizationIssue) => normalizationIssue.severity === 'error',
  ).length
  const normalizationWarningCount = normalizationIssues.filter(
    (normalizationIssue) => normalizationIssue.severity === 'warning',
  ).length

  return `Распознано задач: ${parsedTaskRowsCount}. Ошибок парсинга: ${parsingErrorsCount}. Нормализация: ошибок ${normalizationErrorCount}, предупреждений ${normalizationWarningCount}.`
}

function parseFilteredTokens(excludedSymbolsText: string): string[] {
  return excludedSymbolsText
    .split(',')
    .map((token) => token.trim())
    .filter((token) => token.length > 0)
}

export function applyTextFilters(
  sourceText: string,
  excludedSymbolsText: string,
  shouldNormalizeWhitespace: boolean,
): string {
  const filteredTokens = parseFilteredTokens(excludedSymbolsText)
  const preparedLines = sourceText.split(/\r?\n/).map((sourceLine) => {
    let preparedLine = sourceLine

    filteredTokens.forEach((filteredToken) => {
      preparedLine = preparedLine.split(filteredToken).join('')
    })

    if (shouldNormalizeWhitespace) {
      return preparedLine.replace(/\s+/g, ' ').trim()
    }

    return preparedLine.trimEnd()
  })

  return preparedLines.join('\n')
}

export function updateSingleTaskStatus(
  parsedTaskRows: TaskRow[],
  taskId: number,
  status: TaskStatus,
): TaskRow[] {
  return parsedTaskRows.map((taskRow) =>
    taskRow.id === taskId ? { ...taskRow, status } : taskRow,
  )
}

export function updateSingleTaskIncluded(
  parsedTaskRows: TaskRow[],
  taskId: number,
  isIncluded: boolean,
): TaskRow[] {
  return parsedTaskRows.map((taskRow) =>
    taskRow.id === taskId ? { ...taskRow, isIncluded } : taskRow,
  )
}

export function applyStatusToAllTasks(
  parsedTaskRows: TaskRow[],
  status: TaskStatus,
): TaskRow[] {
  return parsedTaskRows.map((taskRow) => ({ ...taskRow, status }))
}

export function normalizeOcrProgressRatio(progressRatio: number): number {
  if (Number.isNaN(progressRatio)) {
    return 0
  }

  return Math.max(0, Math.min(1, progressRatio))
}

export function buildOcrCompletedMessage(recognizedTextLength: number): string {
  return `OCR завершен. Распознано символов: ${recognizedTextLength}.`
}

export function clipboardContainsPlainText(clipboardEvent: ClipboardEvent): boolean {
  const clipboardData = clipboardEvent.clipboardData
  if (!clipboardData) {
    return false
  }

  return Array.from(clipboardData.types).includes('text/plain')
}

export function appendVariableToken(templateText: string, variableToken: string): string {
  if (templateText.length === 0) {
    return variableToken
  }

  return /\s$/.test(templateText)
    ? `${templateText}${variableToken}`
    : `${templateText} ${variableToken}`
}

export function resolveSelectedPreviewTaskId(
  parsedTaskRows: TaskRow[],
  selectedPreviewTaskId: number | null,
): number | null {
  if (parsedTaskRows.length === 0) {
    return null
  }

  if (
    selectedPreviewTaskId !== null &&
    parsedTaskRows.some((taskRow) => taskRow.id === selectedPreviewTaskId)
  ) {
    return selectedPreviewTaskId
  }

  return parsedTaskRows[0].id
}

export function calculateReportPatch(
  state: DailyReportPresenterState,
  templateEngine: TemplateEngine,
  reportVariablesBuilder: ReportVariablesBuilderPort,
): Pick<
  DailyReportPresenterState,
  'markdownResultText' | 'reportBuildIssues' | 'selectedPreviewTaskId' | 'linePreviewText'
> {
  const includedTaskRows = state.parsedTaskRows.filter(
    (taskRow) => taskRow.isIncluded,
  )

  const buildReportResult = buildReport(
    {
      taskRows: includedTaskRows,
      lineTemplate: state.lineTemplate,
      documentTemplate: state.documentTemplate,
      reportDate: state.reportDate,
      linkTemplate: state.linkTemplate,
    },
    templateEngine,
    reportVariablesBuilder,
  )

  const selectedPreviewTaskId = resolveSelectedPreviewTaskId(
    state.parsedTaskRows,
    state.selectedPreviewTaskId,
  )
  const selectedTaskRow = state.parsedTaskRows.find(
    (taskRow) => taskRow.id === selectedPreviewTaskId,
  )
  const linePreviewText = selectedTaskRow
    ? templateEngine.renderLine(
        selectedTaskRow,
        state.lineTemplate,
        state.linkTemplate,
      ).renderedText
    : ''

  return {
    markdownResultText: buildReportResult.markdownReportText,
    reportBuildIssues: buildReportResult.issues,
    selectedPreviewTaskId,
    linePreviewText,
  }
}
