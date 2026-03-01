/* Этот файл содержит use-case: нормализация OCR-текста и последующий парсинг задач. */
import type { NormalizationResult } from '../../domain/models/normalizationResult'
import type { TaskRowsParsingResult } from '../../domain/models/taskRowsParsingResult'
import type { OcrTextNormalizerPort } from '../ports/ocrTextNormalizerPort'
import type { TaskRowsParserPort } from '../ports/taskRowsParserPort'

export interface NormalizeAndParseTasksResult {
  normalizationResult: NormalizationResult
  parsingResult: TaskRowsParsingResult
}

export function normalizeAndParseTasks(
  sourceText: string,
  ocrTextNormalizerPort: OcrTextNormalizerPort,
  taskRowsParserPort: TaskRowsParserPort,
): NormalizeAndParseTasksResult {
  const normalizationResult = ocrTextNormalizerPort.normalize(sourceText)
  const parsingResult = taskRowsParserPort.parseRawInput(
    normalizationResult.normalizedText,
  )

  return {
    normalizationResult,
    parsingResult,
  }
}
