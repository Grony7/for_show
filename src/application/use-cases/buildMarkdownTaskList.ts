/* Этот файл содержит use-case форматирования TaskRow[] в итоговый markdown-список. */
import { defaultTaskLinkTemplate } from '../../domain/constants/defaultTaskLinkTemplate'
import type { TaskRow } from '../../domain/models/taskRow'
import { taskStatusLabelByValue } from '../../domain/types/taskStatus'

function buildTaskLink(taskId: number, linkTemplate: string): string {
  if (linkTemplate.includes('{id}')) {
    return linkTemplate.replaceAll('{id}', String(taskId))
  }

  const normalizedTemplate = linkTemplate.endsWith('/')
    ? linkTemplate
    : `${linkTemplate}/`

  return `${normalizedTemplate}${taskId}`
}

export function buildMarkdownTaskList(
  taskRows: TaskRow[],
  linkTemplate: string,
): string {
  const normalizedLinkTemplate =
    linkTemplate.trim().length > 0
      ? linkTemplate.trim()
      : defaultTaskLinkTemplate

  return taskRows
    .map((taskRow) => {
      const taskLink = buildTaskLink(taskRow.id, normalizedLinkTemplate)

      const statusLabel = taskStatusLabelByValue[taskRow.status]
      return `- ${statusLabel} №[${taskRow.id}](${taskLink}) - ${taskRow.title}`
    })
    .join('\n')
}
