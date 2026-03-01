/* Этот файл описывает модель сохраняемых настроек отчёта. */
export interface ReportSettings {
  documentTemplate: string
  lineTemplate: string
  linkTemplate: string
  excludedSymbolsText: string
  shouldNormalizeWhitespace: boolean
  shouldNormalizeOcrText: boolean
}
