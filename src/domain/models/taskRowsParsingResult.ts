/* Этот файл описывает результат парсинга всего входного текста задач. */
import type { TaskRow } from './taskRow'
import type { TaskRowParseError } from './taskRowParseError'

export interface TaskRowsParsingResult {
  parsedTaskRows: TaskRow[]
  parsingErrors: TaskRowParseError[]
}
