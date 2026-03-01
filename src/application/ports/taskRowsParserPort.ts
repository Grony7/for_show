/* Этот файл задает порт парсера: преобразование сырого текста в TaskRow и ошибки. */
import type { TaskRowsParsingResult } from '../../domain/models/taskRowsParsingResult'

export interface TaskRowsParserPort {
  parseRawInput(rawInputText: string): TaskRowsParsingResult
}
