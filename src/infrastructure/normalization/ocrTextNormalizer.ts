/* Этот файл реализует сервис полной нормализации OCR-текста по строкам. */
import type { OcrTextNormalizerPort } from '../../application/ports/ocrTextNormalizerPort'
import type { NormalizationIssue } from '../../domain/models/normalizationIssue'
import type { NormalizationResult } from '../../domain/models/normalizationResult'
import { normalizeOcrLine } from './normalizeLine'

export class OcrTextNormalizer implements OcrTextNormalizerPort {
  public normalize(ocrText: string): NormalizationResult {
    const normalizedLines: string[] = []
    const issues: NormalizationIssue[] = []

    ocrText.split(/\r?\n/).forEach((rawLine, lineIndex) => {
      const lineNumber = lineIndex + 1
      const normalizeLineResult = normalizeOcrLine(rawLine, lineNumber)

      issues.push(...normalizeLineResult.issues)
      if (
        normalizeLineResult.includeInNormalizedText &&
        normalizeLineResult.normalizedLineText
      ) {
        normalizedLines.push(normalizeLineResult.normalizedLineText)
      }
    })

    return {
      normalizedText: normalizedLines.join('\n'),
      issues,
    }
  }
}
