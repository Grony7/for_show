/* Этот файл описывает ошибку парсинга одной строки исходного текста. */
export interface TaskRowParseError {
  lineNumber: number
  sourceLineText: string
  errorMessage: string
}
