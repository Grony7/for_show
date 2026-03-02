/* Этот файл рендерит настройки шаблонов отчета и превью строки по выбранной задаче. */
import type { ChangeEvent } from 'react'
import type { ReportBuildIssue } from '../../domain/models/reportBuildIssue'
import type { TaskRow } from '../../domain/models/taskRow'
import styles from './ReportTemplateForm.module.css'

const defaultTokenHint = 'Нажмите, чтобы вставить переменную в шаблон.'

const lineVariableHintByToken: Record<string, string> = {
  '{id}': 'ID задачи из исходного списка.',
  '{title}': 'Название задачи.',
  '{duration}': 'Затраченное время по задаче.',
  '{statusText}': 'Текст статуса с формой слова (например: "Выполнил задачу").',
  '{link}': 'Ссылка на задачу, собранная по шаблону ссылки.',
}

const documentVariableHintByToken: Record<string, string> = {
  '{date}': 'Дата отчета.',
  '{list}': 'Сформированный список строк со всеми включенными задачами.',
  '{totalDuration}': 'Суммарная длительность всех задач, попавших в отчет.',
}

export interface ReportTemplateFormProps {
  lineTemplate: string
  documentTemplate: string
  reportDate: string
  parsedTaskRows: TaskRow[]
  selectedPreviewTaskId: number | null
  linePreviewText: string
  lineTemplateVariableTokens: readonly string[]
  documentTemplateVariableTokens: readonly string[]
  reportBuildIssues: ReportBuildIssue[]
  onLineTemplateChanged: (lineTemplate: string) => void
  onDocumentTemplateChanged: (documentTemplate: string) => void
  onReportDateChanged: (reportDate: string) => void
  onSelectedPreviewTaskIdChanged: (selectedPreviewTaskId: number | null) => void
  onLineTemplateVariableTokenClicked: (variableToken: string) => void
  onDocumentTemplateVariableTokenClicked: (variableToken: string) => void
}

export function ReportTemplateForm({
  lineTemplate,
  documentTemplate,
  reportDate,
  parsedTaskRows,
  selectedPreviewTaskId,
  linePreviewText,
  lineTemplateVariableTokens,
  documentTemplateVariableTokens,
  reportBuildIssues,
  onLineTemplateChanged,
  onDocumentTemplateChanged,
  onReportDateChanged,
  onSelectedPreviewTaskIdChanged,
  onLineTemplateVariableTokenClicked,
  onDocumentTemplateVariableTokenClicked,
}: ReportTemplateFormProps) {
  const handleReportDateChange = (event: ChangeEvent<HTMLInputElement>) => {
    onReportDateChanged(event.target.value)
  }

  const handleDocumentTemplateChange = (
    event: ChangeEvent<HTMLTextAreaElement>,
  ) => {
    onDocumentTemplateChanged(event.target.value)
  }

  const handleLineTemplateChange = (event: ChangeEvent<HTMLTextAreaElement>) => {
    onLineTemplateChanged(event.target.value)
  }

  const handleSelectedPreviewTaskIdChange = (
    event: ChangeEvent<HTMLSelectElement>,
  ) => {
    const selectedValue = event.target.value
    onSelectedPreviewTaskIdChanged(
      selectedValue.length > 0 ? Number(selectedValue) : null,
    )
  }

  return (
    <section className={styles.container}>
      <h2 className={styles.title}>Шаблон отчёта</h2>

      <label className={styles.fieldLabel} htmlFor="reportDate">
        Дата отчета
      </label>
      <input
        id="reportDate"
        type="date"
        value={reportDate}
        onChange={handleReportDateChange}
        className={styles.textInput}
      />

      <label className={styles.fieldLabel} htmlFor="documentTemplate">
        Шаблон документа
      </label>
      <textarea
        id="documentTemplate"
        value={documentTemplate}
        onChange={handleDocumentTemplateChange}
        className={styles.textArea}
      />

      <div className={styles.tokenSection}>
        <span className={styles.tokenLabel}>Переменные документа:</span>
        <div className={styles.tokenList}>
          {documentTemplateVariableTokens.map((variableToken) => (
            <button
              key={variableToken}
              type="button"
              className={styles.tokenButton}
              title={documentVariableHintByToken[variableToken] ?? defaultTokenHint}
              onClick={() => onDocumentTemplateVariableTokenClicked(variableToken)}
            >
              {variableToken}
            </button>
          ))}
        </div>
      </div>

      <label className={styles.fieldLabel} htmlFor="lineTemplate">
        Шаблон строки
      </label>
      <textarea
        id="lineTemplate"
        value={lineTemplate}
        onChange={handleLineTemplateChange}
        className={styles.smallTextArea}
      />

      <div className={styles.tokenSection}>
        <span className={styles.tokenLabel}>Переменные строки:</span>
        <div className={styles.tokenList}>
          {lineTemplateVariableTokens.map((variableToken) => (
            <button
              key={variableToken}
              type="button"
              className={styles.tokenButton}
              title={lineVariableHintByToken[variableToken] ?? defaultTokenHint}
              onClick={() => onLineTemplateVariableTokenClicked(variableToken)}
            >
              {variableToken}
            </button>
          ))}
        </div>
      </div>

      <label className={styles.fieldLabel} htmlFor="selectedPreviewTaskId">
        Превью строки (задача)
      </label>
      <select
        id="selectedPreviewTaskId"
        value={selectedPreviewTaskId !== null ? String(selectedPreviewTaskId) : ''}
        onChange={handleSelectedPreviewTaskIdChange}
        className={styles.textInput}
        disabled={parsedTaskRows.length === 0}
      >
        {parsedTaskRows.length === 0 && <option value="">Нет задач</option>}
        {parsedTaskRows.map((taskRow) => (
          <option key={taskRow.id} value={taskRow.id}>
            {taskRow.id}
          </option>
        ))}
      </select>

      <label className={styles.fieldLabel} htmlFor="linePreviewText">
        Превью строки
      </label>
      <textarea
        id="linePreviewText"
        readOnly
        value={linePreviewText}
        className={styles.smallTextArea}
        placeholder="После разбора задач здесь появится превью строки."
      />

      {reportBuildIssues.length > 0 && (
        <div className={styles.issuesSection}>
          <h3 className={styles.issuesTitle}>Проблемы шаблонов</h3>
          <ul className={styles.issueList}>
            {reportBuildIssues.map((reportBuildIssue, issueIndex) => (
              <li
                key={`${reportBuildIssue.scope}-${issueIndex}`}
                className={styles.issueItem}
              >
                <span
                  className={
                    reportBuildIssue.severity === 'error'
                      ? styles.errorBadge
                      : styles.warningBadge
                  }
                >
                  {reportBuildIssue.severity}
                </span>
                <span>{reportBuildIssue.message}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </section>
  )
}
