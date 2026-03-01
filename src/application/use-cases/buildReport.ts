/* Этот файл содержит use-case сборки итогового markdown-отчета по задачам и шаблонам. */
import { defaultReportDocumentTemplate } from '../../domain/constants/defaultReportDocumentTemplate'
import { defaultReportLineTemplate } from '../../domain/constants/defaultReportLineTemplate'
import type { ReportBuildIssue } from '../../domain/models/reportBuildIssue'
import type { TaskRow } from '../../domain/models/taskRow'
import type { ReportVariablesBuilderPort } from '../ports/reportVariablesBuilderPort'
import { TemplateEngine } from '../template-engine/templateEngine'

export interface BuildReportInput {
  taskRows: TaskRow[]
  lineTemplate: string
  documentTemplate: string
  reportDate: string
  linkTemplate: string
}

export interface BuildReportResult {
  markdownReportText: string
  markdownTaskListText: string
  issues: ReportBuildIssue[]
}

function normalizeTemplateValue(
  templateValue: string,
  defaultTemplateValue: string,
): string {
  return templateValue.trim().length > 0 ? templateValue : defaultTemplateValue
}

function deduplicateIssues(reportBuildIssues: ReportBuildIssue[]): ReportBuildIssue[] {
  const issueKeySet = new Set<string>()
  const deduplicatedIssues: ReportBuildIssue[] = []

  reportBuildIssues.forEach((reportBuildIssue) => {
    const issueKey = `${reportBuildIssue.scope}:${reportBuildIssue.severity}:${reportBuildIssue.message}`

    if (issueKeySet.has(issueKey)) {
      return
    }

    issueKeySet.add(issueKey)
    deduplicatedIssues.push(reportBuildIssue)
  })

  return deduplicatedIssues
}

export function buildReport(
  buildReportInput: BuildReportInput,
  templateEngine: TemplateEngine,
  reportVariablesBuilderPort: ReportVariablesBuilderPort,
): BuildReportResult {
  const normalizedLineTemplate = normalizeTemplateValue(
    buildReportInput.lineTemplate,
    defaultReportLineTemplate,
  )
  const normalizedDocumentTemplate = normalizeTemplateValue(
    buildReportInput.documentTemplate,
    defaultReportDocumentTemplate,
  )

  const taskLineIssues: ReportBuildIssue[] = []
  const markdownTaskListText = buildReportInput.taskRows
    .map((taskRow) => {
      const renderLineResult = templateEngine.renderLine(
        taskRow,
        normalizedLineTemplate,
        buildReportInput.linkTemplate,
      )
      taskLineIssues.push(...renderLineResult.issues)
      return renderLineResult.renderedText
    })
    .join('\n')

  const buildReportVariablesResult = reportVariablesBuilderPort.build({
    taskRows: buildReportInput.taskRows,
    reportDate: buildReportInput.reportDate,
    listText: markdownTaskListText,
  })

  const renderDocumentResult = templateEngine.renderDocument(
    normalizedDocumentTemplate,
    buildReportVariablesResult.documentTemplateVariables,
  )

  return {
    markdownReportText: renderDocumentResult.renderedText,
    markdownTaskListText,
    issues: deduplicateIssues([
      ...taskLineIssues,
      ...buildReportVariablesResult.issues,
      ...renderDocumentResult.issues,
    ]),
  }
}
