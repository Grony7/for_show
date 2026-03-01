/* Этот файл описывает результат нормализации OCR-текста с накопленными issues. */
import type { NormalizationIssue } from './normalizationIssue'

export interface NormalizationResult {
  normalizedText: string
  issues: NormalizationIssue[]
}
