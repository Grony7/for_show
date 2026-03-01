/* Этот файл рендерит поля ввода исходного текста, ссылки и фильтров парсинга. */
import type { ChangeEvent } from 'react'
import styles from './DailyReportForm.module.css'

export interface DailyReportFormProps {
  rawInputText: string
  linkTemplate: string
  excludedSymbolsText: string
  shouldNormalizeWhitespace: boolean
  onRawInputTextChanged: (rawInputText: string) => void
  onLinkTemplateChanged: (linkTemplate: string) => void
  onExcludedSymbolsTextChanged: (excludedSymbolsText: string) => void
  onShouldNormalizeWhitespaceChanged: (shouldNormalizeWhitespace: boolean) => void
  onParseRequested: () => void
}

export function DailyReportForm({
  rawInputText,
  linkTemplate,
  excludedSymbolsText,
  shouldNormalizeWhitespace,
  onRawInputTextChanged,
  onLinkTemplateChanged,
  onExcludedSymbolsTextChanged,
  onShouldNormalizeWhitespaceChanged,
  onParseRequested,
}: DailyReportFormProps) {
  const handleRawInputTextChange = (event: ChangeEvent<HTMLTextAreaElement>) => {
    onRawInputTextChanged(event.target.value)
  }

  const handleLinkTemplateChange = (event: ChangeEvent<HTMLInputElement>) => {
    onLinkTemplateChanged(event.target.value)
  }

  const handleExcludedSymbolsTextChange = (
    event: ChangeEvent<HTMLInputElement>,
  ) => {
    onExcludedSymbolsTextChanged(event.target.value)
  }

  const handleShouldNormalizeWhitespaceChange = (
    event: ChangeEvent<HTMLInputElement>,
  ) => {
    onShouldNormalizeWhitespaceChanged(event.target.checked)
  }

  return (
    <section className={styles.container}>
      <h2 className={styles.title}>Исходные данные</h2>
      <label className={styles.fieldLabel} htmlFor="rawInputText">
        Многострочный текст задач
      </label>
      <textarea
        id="rawInputText"
        value={rawInputText}
        onChange={handleRawInputTextChange}
        className={styles.textArea}
        placeholder='4790   ClearCorrect: добавить вкладку "Оплата" ...   0 ч. 0м.'
      />

      <label className={styles.fieldLabel} htmlFor="linkTemplate">
        Шаблон ссылки ({'{id}'} для ID задачи)
      </label>
      <input
        id="linkTemplate"
        value={linkTemplate}
        onChange={handleLinkTemplateChange}
        className={styles.textInput}
      />

      <label className={styles.fieldLabel} htmlFor="excludedSymbolsText">
        Исключить символы/токены (через запятую)
      </label>
      <input
        id="excludedSymbolsText"
        value={excludedSymbolsText}
        onChange={handleExcludedSymbolsTextChange}
        className={styles.textInput}
        placeholder="→, •, —"
      />

      <label className={styles.checkboxRow} htmlFor="shouldNormalizeWhitespace">
        <input
          id="shouldNormalizeWhitespace"
          type="checkbox"
          checked={shouldNormalizeWhitespace}
          onChange={handleShouldNormalizeWhitespaceChange}
        />
        Убирать лишние пробелы
      </label>

      <button type="button" onClick={onParseRequested} className={styles.button}>
        Разобрать текст
      </button>
    </section>
  )
}
