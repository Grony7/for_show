/* Этот файл собирает переменные документа и вычисляет суммарную длительность задач. */
import type {
  BuildReportVariablesInput,
  BuildReportVariablesResult,
  ReportVariablesBuilderPort,
} from '../../application/ports/reportVariablesBuilderPort'
import type { ReportBuildIssue } from '../../domain/models/reportBuildIssue'
import { DurationParser } from '../duration/durationParser'

function formatReportDate(reportDate: string): string {
  const normalizedDate = reportDate.trim()
  const dateMatchResult = /^(\d{4})-(\d{2})-(\d{2})$/.exec(normalizedDate)

  if (!dateMatchResult) {
    return normalizedDate
  }

  const [, yearText, monthText, dayText] = dateMatchResult
  return `${dayText}.${monthText}.${yearText}`
}

export class ReportVariablesBuilder implements ReportVariablesBuilderPort {
  private readonly durationParser: DurationParser

  public constructor(durationParser?: DurationParser) {
    this.durationParser = durationParser ?? new DurationParser()
  }

  public build(
    buildReportVariablesInput: BuildReportVariablesInput,
  ): BuildReportVariablesResult {
    let totalDurationInMinutes = 0
    const issues: ReportBuildIssue[] = []

    buildReportVariablesInput.taskRows.forEach((taskRow) => {
      const durationInMinutes = this.durationParser.parseDurationTextToMinutes(
        taskRow.durationText,
      )

      if (durationInMinutes === null) {
        issues.push({
          severity: 'warning' as const,
          scope: 'variables' as const,
          message: `Не удалось распознать длительность задачи ${taskRow.id}: "${taskRow.durationText}".`,
        })
        return
      }

      totalDurationInMinutes += durationInMinutes
    })

    return {
      documentTemplateVariables: {
        date: formatReportDate(buildReportVariablesInput.reportDate),
        list: buildReportVariablesInput.listText,
        totalDuration: this.durationParser.formatMinutes(totalDurationInMinutes),
      },
      issues,
    }
  }
}
