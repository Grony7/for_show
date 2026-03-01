/* Этот файл задает порт сервиса нормализации OCR-текста перед парсингом задач. */
import type { NormalizationResult } from '../../domain/models/normalizationResult'

export interface OcrTextNormalizerPort {
  normalize(ocrText: string): NormalizationResult
}
