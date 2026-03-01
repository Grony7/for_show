/* Этот файл содержит нормализацию одной OCR-строки в формат, пригодный для парсера задач. */
import type { NormalizationIssue } from '../../domain/models/normalizationIssue'
import { normalizeTimeFromLineEnd } from './normalizeTime'

export interface NormalizeLineResult {
  includeInNormalizedText: boolean
  normalizedLineText: string | null
  issues: NormalizationIssue[]
}

interface NormalizedTitleResult {
  normalizedTitleText: string
  wasSubtaskMarkerNormalized: boolean
}

const identifierAtLineStartPattern = /^\s*(?<taskId>\d{4,6})\b(?<restText>.*)$/u
const subtaskMarkerAtTitleStartPattern = /^\s*(?:→+|[-—–]+\+?|>\+?|[•*]+)\s*/u
const leadingNoisePattern = /^[|:;,.]+/

function normalizeTitle(sourceTitleText: string): NormalizedTitleResult {
  const trimmedTitleText = sourceTitleText.trim()
  if (trimmedTitleText.length === 0) {
    return {
      normalizedTitleText: '',
      wasSubtaskMarkerNormalized: false,
    }
  }

  const wasSubtaskMarkerNormalized =
    subtaskMarkerAtTitleStartPattern.test(trimmedTitleText)
  const titleWithoutMarker = trimmedTitleText
    .replace(subtaskMarkerAtTitleStartPattern, '')
    .replace(leadingNoisePattern, '')
    .trim()
    .replace(/\s+/g, ' ')

  if (titleWithoutMarker.length === 0) {
    return {
      normalizedTitleText: '',
      wasSubtaskMarkerNormalized: wasSubtaskMarkerNormalized,
    }
  }

  if (!wasSubtaskMarkerNormalized) {
    return {
      normalizedTitleText: titleWithoutMarker,
      wasSubtaskMarkerNormalized: false,
    }
  }

  return {
    normalizedTitleText: `→ ${titleWithoutMarker}`,
    wasSubtaskMarkerNormalized: true,
  }
}

function buildInvalidTimeLine(taskId: string, normalizedTitleText: string): string {
  const safeTitleText =
    normalizedTitleText.length > 0 ? normalizedTitleText : 'Без названия'
  return `${taskId} ${safeTitleText} <INVALID_TIME>`
}

export function normalizeOcrLine(
  rawLine: string,
  lineNumber: number,
): NormalizeLineResult {
  const trimmedLine = rawLine.trim()
  if (trimmedLine.length === 0) {
    return {
      includeInNormalizedText: false,
      normalizedLineText: null,
      issues: [],
    }
  }

  const identifierMatchResult = identifierAtLineStartPattern.exec(trimmedLine)
  if (!identifierMatchResult?.groups) {
    return {
      includeInNormalizedText: false,
      normalizedLineText: null,
      issues: [
        {
          lineNumber,
          rawLine,
          message:
            'Строка удалена: отсутствует ID задачи в начале (ожидается 4-6 цифр).',
          severity: 'warning',
        },
      ],
    }
  }

  const taskId = identifierMatchResult.groups.taskId
  const restText = identifierMatchResult.groups.restText.trim()
  const normalizedTitleResult = normalizeTitle(restText)
  const normalizedIssues: NormalizationIssue[] = []

  if (normalizedTitleResult.wasSubtaskMarkerNormalized) {
    normalizedIssues.push({
      lineNumber,
      rawLine,
      message: 'Маркер подзадачи нормализован к виду "→ ".',
      severity: 'warning',
    })
  }

  const normalizeTimeResult = normalizeTimeFromLineEnd(restText)
  if (!normalizeTimeResult.isValid) {
    normalizedIssues.push({
      lineNumber,
      rawLine,
      message: normalizeTimeResult.message,
      severity: 'error',
    })

    return {
      includeInNormalizedText: true,
      normalizedLineText: buildInvalidTimeLine(
        taskId,
        normalizedTitleResult.normalizedTitleText,
      ),
      issues: normalizedIssues,
    }
  }

  const titleSourceText = restText
    .slice(0, normalizeTimeResult.matchStartIndex)
    .trim()
  const finalTitleResult = normalizeTitle(titleSourceText)
  const normalizedTitleText =
    finalTitleResult.normalizedTitleText.length > 0
      ? finalTitleResult.normalizedTitleText
      : 'Без названия'

  if (
    finalTitleResult.wasSubtaskMarkerNormalized &&
    !normalizedTitleResult.wasSubtaskMarkerNormalized
  ) {
    normalizedIssues.push({
      lineNumber,
      rawLine,
      message: 'Маркер подзадачи нормализован к виду "→ ".',
      severity: 'warning',
    })
  }

  return {
    includeInNormalizedText: true,
    normalizedLineText: `${taskId} ${normalizedTitleText} ${normalizeTimeResult.normalizedDurationText}`,
    issues: normalizedIssues,
  }
}
