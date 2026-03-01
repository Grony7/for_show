/* Этот файл связывает presenter и UI-компоненты без бизнес-логики в View. */
import { useDailyReportPresenter } from '../../application/presenters/useDailyReportPresenter'
import { DailyReportForm } from '../components/DailyReportForm'
import { ParseErrorsPanel } from '../components/ParseErrorsPanel'
import { ReportPreviewPanel } from '../components/ReportPreviewPanel'
import { ReportTemplateForm } from '../components/ReportTemplateForm'
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
          inputSourceMode={dailyReportPresenter.state.inputSourceMode}
          rawInputText={dailyReportPresenter.state.rawInputText}
          normalizedInputText={dailyReportPresenter.state.normalizedInputText}
          shouldNormalizeOcrText={
            dailyReportPresenter.state.shouldNormalizeOcrText
          }
          normalizationIssues={dailyReportPresenter.state.normalizationIssues}
          linkTemplate={dailyReportPresenter.state.linkTemplate}
          excludedSymbolsText={dailyReportPresenter.state.excludedSymbolsText}
          shouldNormalizeWhitespace={
            dailyReportPresenter.state.shouldNormalizeWhitespace
          }
          selectedImageFileName={dailyReportPresenter.state.selectedImageFileName}
          imagePreviewUrl={dailyReportPresenter.state.imagePreviewUrl}
          isRecognizingImage={dailyReportPresenter.state.isRecognizingImage}
          imageProcessingState={dailyReportPresenter.state.imageProcessingState}
          imageRecognitionProgressRatio={
            dailyReportPresenter.state.imageRecognitionProgressRatio
          }
          imageRecognitionStatusText={
            dailyReportPresenter.state.imageRecognitionStatusText
          }
          onInputSourceModeChanged={
            dailyReportPresenter.onInputSourceModeChanged
          }
          onRawInputTextChanged={dailyReportPresenter.onRawInputTextChanged}
          onNormalizedInputTextChanged={
            dailyReportPresenter.onNormalizedInputTextChanged
          }
          onShouldNormalizeOcrTextChanged={
            dailyReportPresenter.onShouldNormalizeOcrTextChanged
          }
          onLinkTemplateChanged={dailyReportPresenter.onLinkTemplateChanged}
          onExcludedSymbolsTextChanged={
            dailyReportPresenter.onExcludedSymbolsTextChanged
          }
          onShouldNormalizeWhitespaceChanged={
            dailyReportPresenter.onShouldNormalizeWhitespaceChanged
          }
          onImageFileSelected={dailyReportPresenter.onImageFileSelected}
          onClipboardPasteCaptured={
            dailyReportPresenter.onClipboardPasteCaptured
          }
          onRecognizeImageRequested={dailyReportPresenter.onRecognizeImageRequested}
          onParseRequested={dailyReportPresenter.onParseRequested}
        />

        <TaskTable
          parsedTaskRows={dailyReportPresenter.state.parsedTaskRows}
          taskStatusOptions={dailyReportPresenter.state.taskStatusOptions}
          onTaskIncludedChanged={dailyReportPresenter.onTaskIncludedChanged}
          onTaskStatusChanged={dailyReportPresenter.onTaskStatusChanged}
          onApplyStatusToAllRequested={
            dailyReportPresenter.onApplyStatusToAllRequested
          }
        />

        <ReportTemplateForm
          lineTemplate={dailyReportPresenter.state.lineTemplate}
          documentTemplate={dailyReportPresenter.state.documentTemplate}
          reportDate={dailyReportPresenter.state.reportDate}
          parsedTaskRows={dailyReportPresenter.state.parsedTaskRows}
          selectedPreviewTaskId={dailyReportPresenter.state.selectedPreviewTaskId}
          linePreviewText={dailyReportPresenter.state.linePreviewText}
          lineTemplateVariableTokens={
            dailyReportPresenter.state.lineTemplateVariableTokens
          }
          documentTemplateVariableTokens={
            dailyReportPresenter.state.documentTemplateVariableTokens
          }
          reportBuildIssues={dailyReportPresenter.state.reportBuildIssues}
          onLineTemplateChanged={dailyReportPresenter.onLineTemplateChanged}
          onDocumentTemplateChanged={
            dailyReportPresenter.onDocumentTemplateChanged
          }
          onReportDateChanged={dailyReportPresenter.onReportDateChanged}
          onSelectedPreviewTaskIdChanged={
            dailyReportPresenter.onSelectedPreviewTaskIdChanged
          }
          onLineTemplateVariableTokenClicked={
            dailyReportPresenter.onLineTemplateVariableTokenClicked
          }
          onDocumentTemplateVariableTokenClicked={
            dailyReportPresenter.onDocumentTemplateVariableTokenClicked
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
