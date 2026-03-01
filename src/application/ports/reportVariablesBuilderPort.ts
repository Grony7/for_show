/* Этот файл описывает порт построителя переменных для шаблона итогового документа. */
import type { ReportBuildIssue } from '../../domain/models/reportBuildIssue'
import type { TaskRow } from '../../domain/models/taskRow'
import type { DocumentTemplateVariables } from '../template-engine/templateVariables'

export interface BuildReportVariablesInput {
  taskRows: TaskRow[]
  reportDate: string
  listText: string
}

export interface BuildReportVariablesResult {
  documentTemplateVariables: DocumentTemplateVariables
  issues: ReportBuildIssue[]
}

export interface ReportVariablesBuilderPort {
  build(buildReportVariablesInput: BuildReportVariablesInput): BuildReportVariablesResult
}
