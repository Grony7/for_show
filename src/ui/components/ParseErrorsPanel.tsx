/* Этот файл рендерит список ошибок парсинга и исходные проблемные строки. */
import type { TaskRowParseError } from '../../domain/models/taskRowParseError'
import styles from './ParseErrorsPanel.module.css'

export interface ParseErrorsPanelProps {
  parsingErrors: TaskRowParseError[]
}

export function ParseErrorsPanel({ parsingErrors }: ParseErrorsPanelProps) {
  if (parsingErrors.length === 0) {
    return null
  }

  return (
    <section className={styles.container}>
      <h2 className={styles.title}>Ошибки разбора</h2>
      <ul className={styles.errorList}>
        {parsingErrors.map((parsingError) => (
          <li key={`${parsingError.lineNumber}-${parsingError.sourceLineText}`}>
            <div className={styles.errorHeader}>
              Строка {parsingError.lineNumber}: {parsingError.errorMessage}
            </div>
            <pre className={styles.errorLine}>{parsingError.sourceLineText}</pre>
          </li>
        ))}
      </ul>
    </section>
  )
}
