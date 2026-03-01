/* Этот файл описывает предупреждение или ошибку, возникшие при построении отчета по шаблону. */
export type ReportBuildIssueSeverity = 'warning' | 'error'

export type ReportBuildIssueScope =
  | 'lineTemplate'
  | 'documentTemplate'
  | 'variables'

export interface ReportBuildIssue {
  severity: ReportBuildIssueSeverity
  scope: ReportBuildIssueScope
  message: string
}
