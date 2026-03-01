/* Этот файл реализует парсер строк вида "<ID> <текст> <N ч. Nm.>" с ошибками по строкам. */
import type { TaskRowsParserPort } from '../../application/ports/taskRowsParserPort'
import type { TaskRow } from '../../domain/models/taskRow'
import type { TaskRowParseError } from '../../domain/models/taskRowParseError'
import type { TaskRowsParsingResult } from '../../domain/models/taskRowsParsingResult'
import { defaultTaskStatus } from '../../domain/types/taskStatus'

const taskLinePattern =
  /^\s*(?<id>\d+)\s+(?<title>.+?)\s+(?<hours>\d+)\s*\u0447\.\s*(?<minutes>\d+)\s*\u043C\.\s*$/u

export class TaskRowsTextParser implements TaskRowsParserPort {
  public parseRawInput(rawInputText: string): TaskRowsParsingResult {
    const rawLines = rawInputText.split(/\r?\n/)
    const parsedTaskRows: TaskRow[] = []
    const parsingErrors: TaskRowParseError[] = []

    rawLines.forEach((rawLine, lineIndex) => {
      const lineNumber = lineIndex + 1
      const trimmedLine = rawLine.trim()

      if (trimmedLine.length === 0) {
        return
      }

      const lineMatchResult = taskLinePattern.exec(trimmedLine)

      if (!lineMatchResult?.groups) {
        parsingErrors.push({
          lineNumber,
          sourceLineText: rawLine,
          errorMessage:
            'Ожидается формат: <ID> <текст задачи> <N ч. Nm.> в конце строки.',
        })
        return
      }

      const taskId = Number(lineMatchResult.groups.id)
      const taskTitle = lineMatchResult.groups.title.trim()
      const taskDurationHours = Number(lineMatchResult.groups.hours)
      const taskDurationMinutes = Number(lineMatchResult.groups.minutes)

      if (!Number.isInteger(taskId) || taskId <= 0) {
        parsingErrors.push({
          lineNumber,
          sourceLineText: rawLine,
          errorMessage: 'ID задачи должен быть положительным числом.',
        })
        return
      }

      parsedTaskRows.push({
        id: taskId,
        title: taskTitle,
        durationText: `${taskDurationHours} ч. ${taskDurationMinutes}м.`,
        status: defaultTaskStatus,
        isIncluded: true,
      })
    })

    return {
      parsedTaskRows,
      parsingErrors,
    }
  }
}
