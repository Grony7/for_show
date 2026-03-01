/* Этот файл реализует движок шаблонов строк и документа с предупреждениями о проблемах подстановки. */
import { defaultReportDocumentTemplate } from '../../domain/constants/defaultReportDocumentTemplate'
import { defaultReportLineTemplate } from '../../domain/constants/defaultReportLineTemplate'
import { defaultTaskLinkTemplate } from '../../domain/constants/defaultTaskLinkTemplate'
import type { ReportBuildIssue } from '../../domain/models/reportBuildIssue'
import type { TaskRow } from '../../domain/models/taskRow'
import { taskStatusLabelByValue } from '../../domain/types/taskStatus'
import {
  documentTemplateVariableNames,
  type DocumentTemplateVariables,
  lineTemplateVariableNames,
  type LineTemplateVariables,
} from './templateVariables'

const placeholderPattern = /\{([^{}]+)\}/g

export interface RenderTemplateResult {
  renderedText: string
  issues: ReportBuildIssue[]
}

function buildUnknownVariableIssue(
  variableName: string,
  scope: ReportBuildIssue['scope'],
): ReportBuildIssue {
  return {
    severity: 'warning',
    scope,
    message: `Неизвестная переменная "{${variableName}}" в шаблоне.`,
  }
}

function normalizeLinkTemplate(linkTemplate: string): string {
  return linkTemplate.trim().length > 0 ? linkTemplate.trim() : defaultTaskLinkTemplate
}

export function buildTaskLink(taskIdentifier: number, linkTemplate: string): string {
  const normalizedLinkTemplate = normalizeLinkTemplate(linkTemplate)

  if (normalizedLinkTemplate.includes('{id}')) {
    return normalizedLinkTemplate.replaceAll('{id}', String(taskIdentifier))
  }

  const templateWithTrailingSlash = normalizedLinkTemplate.endsWith('/')
    ? normalizedLinkTemplate
    : `${normalizedLinkTemplate}/`

  return `${templateWithTrailingSlash}${taskIdentifier}`
}

function replaceTemplateVariables(
  templateText: string,
  variables: Record<string, string>,
  allowedVariableNames: readonly string[],
  scope: ReportBuildIssue['scope'],
): RenderTemplateResult {
  const issues: ReportBuildIssue[] = []
  const unknownVariableNames = new Set<string>()
  const allowedVariableNameSet = new Set(allowedVariableNames)

  const renderedText = templateText.replaceAll(
    placeholderPattern,
    (_match, rawVariableName: string) => {
      const variableName = rawVariableName.trim()

      if (!allowedVariableNameSet.has(variableName)) {
        unknownVariableNames.add(variableName)
        return ''
      }

      return variables[variableName] ?? ''
    },
  )

  unknownVariableNames.forEach((unknownVariableName) => {
    issues.push(buildUnknownVariableIssue(unknownVariableName, scope))
  })

  return {
    renderedText,
    issues,
  }
}

function ensureListPlaceholder(documentTemplate: string): {
  documentTemplate: string
  issues: ReportBuildIssue[]
} {
  if (documentTemplate.includes('{list}')) {
    return {
      documentTemplate,
      issues: [],
    }
  }

  return {
    documentTemplate: `${documentTemplate}\n\n{list}`,
    issues: [
      {
        severity: 'warning',
        scope: 'documentTemplate',
        message:
          'В шаблоне документа отсутствует переменная "{list}". Она автоматически добавлена в конец.',
      },
    ],
  }
}

export class TemplateEngine {
  public renderLine(
    taskRow: TaskRow,
    lineTemplate: string,
    linkTemplate: string,
  ): RenderTemplateResult {
    const normalizedLineTemplate =
      lineTemplate.trim().length > 0 ? lineTemplate : defaultReportLineTemplate

    const lineTemplateVariables: LineTemplateVariables = {
      id: String(taskRow.id),
      title: taskRow.title,
      duration: taskRow.durationText,
      statusText: taskStatusLabelByValue[taskRow.status],
      link: buildTaskLink(taskRow.id, linkTemplate),
    }

    return replaceTemplateVariables(
      normalizedLineTemplate,
      lineTemplateVariables,
      lineTemplateVariableNames,
      'lineTemplate',
    )
  }

  public renderDocument(
    documentTemplate: string,
    documentTemplateVariables: DocumentTemplateVariables,
  ): RenderTemplateResult {
    const normalizedDocumentTemplate =
      documentTemplate.trim().length > 0
        ? documentTemplate
        : defaultReportDocumentTemplate

    const listPlaceholderResult = ensureListPlaceholder(normalizedDocumentTemplate)
    const replaceVariablesResult = replaceTemplateVariables(
      listPlaceholderResult.documentTemplate,
      documentTemplateVariables,
      documentTemplateVariableNames,
      'documentTemplate',
    )

    return {
      renderedText: replaceVariablesResult.renderedText,
      issues: [...listPlaceholderResult.issues, ...replaceVariablesResult.issues],
    }
  }
}
