/* Этот файл связывает presenter и UI-компоненты без бизнес-логики в View. */
import { useDailyReportPresenter } from '../../application/presenters/useDailyReportPresenter'
import { DailyReportForm } from '../components/DailyReportForm'
import { ParseErrorsPanel } from '../components/ParseErrorsPanel'
import { ReportPreviewPanel } from '../components/ReportPreviewPanel'
import { TaskTable } from '../components/TaskTable'
import styles from './DailyReportPage.module.css'

export function DailyReportPage() {
  const dailyReportPresenter = useDailyReportPresenter()

  return (
    <main className={styles.page}>
      <div className={styles.layout}>
        <header className={styles.header}>
          <h1 className={styles.title}>Конструктор ежедневного отчета</h1>
          <p className={styles.subtitle}>
            Формат входа: ID, текст задачи, время в конце строки.
          </p>
          {dailyReportPresenter.state.informationMessage && (
            <p className={styles.message}>
              {dailyReportPresenter.state.informationMessage}
            </p>
          )}
        </header>

        <DailyReportForm
          rawInputText={dailyReportPresenter.state.rawInputText}
          linkTemplate={dailyReportPresenter.state.linkTemplate}
          excludedSymbolsText={dailyReportPresenter.state.excludedSymbolsText}
          shouldNormalizeWhitespace={
            dailyReportPresenter.state.shouldNormalizeWhitespace
          }
          onRawInputTextChanged={dailyReportPresenter.onRawInputTextChanged}
          onLinkTemplateChanged={dailyReportPresenter.onLinkTemplateChanged}
          onExcludedSymbolsTextChanged={
            dailyReportPresenter.onExcludedSymbolsTextChanged
          }
          onShouldNormalizeWhitespaceChanged={
            dailyReportPresenter.onShouldNormalizeWhitespaceChanged
          }
          onParseRequested={dailyReportPresenter.onParseRequested}
        />

        <TaskTable
          parsedTaskRows={dailyReportPresenter.state.parsedTaskRows}
          taskStatusOptions={dailyReportPresenter.state.taskStatusOptions}
          onTaskStatusChanged={dailyReportPresenter.onTaskStatusChanged}
          onApplyStatusToAllRequested={
            dailyReportPresenter.onApplyStatusToAllRequested
          }
        />

        <ParseErrorsPanel parsingErrors={dailyReportPresenter.state.parsingErrors} />

        <ReportPreviewPanel
          markdownResultText={dailyReportPresenter.state.markdownResultText}
          onCopyResultRequested={dailyReportPresenter.onCopyResultRequested}
        />
      </div>
    </main>
  )
}
