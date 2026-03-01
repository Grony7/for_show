/* Этот файл описывает предупреждение или ошибку, найденную при нормализации OCR-текста. */
export type NormalizationIssueSeverity = 'warning' | 'error'

export interface NormalizationIssue {
  lineNumber: number
  rawLine: string
  message: string
  severity: NormalizationIssueSeverity
}
