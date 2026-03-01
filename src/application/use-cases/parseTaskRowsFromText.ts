/* Этот файл содержит use-case парсинга многострочного текста задач. */
import type { TaskRowsParsingResult } from '../../domain/models/taskRowsParsingResult'
import type { TaskRowsParserPort } from '../ports/taskRowsParserPort'

export function parseTaskRowsFromText(
  rawInputText: string,
  taskRowsParserPort: TaskRowsParserPort,
): TaskRowsParsingResult {
  return taskRowsParserPort.parseRawInput(rawInputText)
}
