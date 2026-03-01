/* Этот файл рендерит режимы ввода, загрузку изображения, paste-зону и нормализацию OCR. */
import type {
  ChangeEvent,
  ClipboardEvent as ReactClipboardEvent,
} from 'react'
import type { ImageProcessingState } from '../../application/presenters/dailyReportPresenterState'
import type { NormalizationIssue } from '../../domain/models/normalizationIssue'
import {
  inputSourceModeLabelByValue,
  inputSourceModeValues,
} from '../../domain/types/inputSourceMode'
import type { InputSourceMode } from '../../domain/types/inputSourceMode'
import styles from './DailyReportForm.module.css'

export interface DailyReportFormProps {
  inputSourceMode: InputSourceMode
  rawInputText: string
  normalizedInputText: string
  shouldNormalizeOcrText: boolean
  normalizationIssues: NormalizationIssue[]
  linkTemplate: string
  excludedSymbolsText: string
  shouldNormalizeWhitespace: boolean
  selectedImageFileName: string | null
  imagePreviewUrl: string | null
  isRecognizingImage: boolean
  imageProcessingState: ImageProcessingState
  imageRecognitionProgressRatio: number
  imageRecognitionStatusText: string | null
  onInputSourceModeChanged: (inputSourceMode: InputSourceMode) => void
  onRawInputTextChanged: (rawInputText: string) => void
  onNormalizedInputTextChanged: (normalizedInputText: string) => void
  onShouldNormalizeOcrTextChanged: (shouldNormalizeOcrText: boolean) => void
  onLinkTemplateChanged: (linkTemplate: string) => void
  onExcludedSymbolsTextChanged: (excludedSymbolsText: string) => void
  onShouldNormalizeWhitespaceChanged: (shouldNormalizeWhitespace: boolean) => void
  onImageFileSelected: (selectedImageFile: File | null) => void
  onClipboardPasteCaptured: (clipboardEvent: ClipboardEvent) => void
  onRecognizeImageRequested: () => void
  onParseRequested: () => void
}

function toPercentText(imageRecognitionProgressRatio: number): string {
  return `${Math.round(imageRecognitionProgressRatio * 100)}%`
}

function buildPasteZoneClassName(imageProcessingState: ImageProcessingState): string {
  if (imageProcessingState === 'processing') {
    return `${styles.pasteZone} ${styles.pasteZoneProcessing}`
  }

  if (imageProcessingState === 'success') {
    return `${styles.pasteZone} ${styles.pasteZoneSuccess}`
  }

  if (imageProcessingState === 'error') {
    return `${styles.pasteZone} ${styles.pasteZoneError}`
  }

  return styles.pasteZone
}

export function DailyReportForm({
  inputSourceMode,
  rawInputText,
  normalizedInputText,
  shouldNormalizeOcrText,
  normalizationIssues,
  linkTemplate,
  excludedSymbolsText,
  shouldNormalizeWhitespace,
  selectedImageFileName,
  imagePreviewUrl,
  isRecognizingImage,
  imageProcessingState,
  imageRecognitionProgressRatio,
  imageRecognitionStatusText,
  onInputSourceModeChanged,
  onRawInputTextChanged,
  onNormalizedInputTextChanged,
  onShouldNormalizeOcrTextChanged,
  onLinkTemplateChanged,
  onExcludedSymbolsTextChanged,
  onShouldNormalizeWhitespaceChanged,
  onImageFileSelected,
  onClipboardPasteCaptured,
  onRecognizeImageRequested,
  onParseRequested,
}: DailyReportFormProps) {
  const handleRawInputTextChange = (event: ChangeEvent<HTMLTextAreaElement>) => {
    onRawInputTextChanged(event.target.value)
  }

  const handleNormalizedInputTextChange = (
    event: ChangeEvent<HTMLTextAreaElement>,
  ) => {
    onNormalizedInputTextChanged(event.target.value)
  }

  const handleShouldNormalizeOcrTextChange = (
    event: ChangeEvent<HTMLInputElement>,
  ) => {
    onShouldNormalizeOcrTextChanged(event.target.checked)
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

  const handleImageFileInputChange = (event: ChangeEvent<HTMLInputElement>) => {
    const selectedImageFile = event.target.files?.[0] ?? null
    onImageFileSelected(selectedImageFile)
  }

  const handlePasteZonePaste = (
    event: ReactClipboardEvent<HTMLDivElement>,
  ) => {
    onClipboardPasteCaptured(event.nativeEvent)
  }

  return (
    <section className={styles.container}>
      <h2 className={styles.title}>Исходные данные</h2>

      <div className={styles.modeTabs}>
        {inputSourceModeValues.map((inputSourceModeValue) => (
          <button
            key={inputSourceModeValue}
            type="button"
            className={`${styles.modeTabButton} ${
              inputSourceMode === inputSourceModeValue
                ? styles.modeTabButtonActive
                : ''
            }`}
            onClick={() => onInputSourceModeChanged(inputSourceModeValue)}
          >
            {inputSourceModeLabelByValue[inputSourceModeValue]}
          </button>
        ))}
      </div>

      {inputSourceMode === 'TEXT' ? (
        <>
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
        </>
      ) : (
        <>
          <div
            tabIndex={0}
            role="region"
            aria-label="Вставьте изображение из буфера обмена сочетанием Ctrl плюс V"
            className={buildPasteZoneClassName(imageProcessingState)}
            onPaste={handlePasteZonePaste}
          >
            <p className={styles.pasteZoneTitle}>
              Вставьте изображение (Ctrl + V) или загрузите файл
            </p>
            <p className={styles.pasteZoneHint}>
              Поддерживаются форматы PNG и JPG.
            </p>

            {imagePreviewUrl && (
              <img
                src={imagePreviewUrl}
                alt="Превью вставленного или загруженного изображения"
                className={styles.imagePreview}
              />
            )}
          </div>

          <label className={styles.fieldLabel} htmlFor="imageFileInput">
            Изображение таблицы (PNG/JPG)
          </label>
          <input
            id="imageFileInput"
            type="file"
            accept=".png,.jpg,.jpeg,image/png,image/jpeg"
            className={styles.fileInput}
            onChange={handleImageFileInputChange}
            aria-label="Загрузка изображения для OCR"
          />

          {selectedImageFileName && (
            <p className={styles.helperText}>
              Выбран файл: <strong>{selectedImageFileName}</strong>
            </p>
          )}

          <button
            type="button"
            onClick={onRecognizeImageRequested}
            className={styles.secondaryButton}
            disabled={isRecognizingImage || !selectedImageFileName}
            aria-label="Запустить OCR распознавание изображения"
          >
            {isRecognizingImage ? 'Распознавание...' : 'Распознать текст'}
          </button>

          <div className={styles.progressContainer} aria-live="polite">
            <div className={styles.progressMeta}>
              <span>
                Прогресс OCR: {toPercentText(imageRecognitionProgressRatio)}
              </span>
              <span>{imageRecognitionStatusText ?? 'idle'}</span>
            </div>
            <progress
              max={1}
              value={imageRecognitionProgressRatio}
              className={styles.progressBar}
            />
          </div>

          <label className={styles.fieldLabel} htmlFor="rawInputText">
            Распознанный текст (raw)
          </label>
          <textarea
            id="rawInputText"
            value={rawInputText}
            onChange={handleRawInputTextChange}
            className={styles.textArea}
            placeholder="После OCR здесь появится распознанный текст."
          />

          <label className={styles.checkboxRow} htmlFor="shouldNormalizeOcrText">
            <input
              id="shouldNormalizeOcrText"
              type="checkbox"
              checked={shouldNormalizeOcrText}
              onChange={handleShouldNormalizeOcrTextChange}
            />
            Нормализовать OCR-текст
          </label>

          {shouldNormalizeOcrText && (
            <>
              <label className={styles.fieldLabel} htmlFor="normalizedInputText">
                Нормализованный текст
              </label>
              <textarea
                id="normalizedInputText"
                value={normalizedInputText}
                onChange={handleNormalizedInputTextChange}
                className={styles.textArea}
                placeholder="Здесь будет текст в формате, пригодном для разбора задач."
              />

              <div className={styles.issuesSection}>
                <h3 className={styles.issuesTitle}>Проблемы нормализации</h3>
                {normalizationIssues.length === 0 ? (
                  <p className={styles.issuesEmpty}>
                    Проблем не найдено.
                  </p>
                ) : (
                  <ul className={styles.issuesList}>
                    {normalizationIssues.map((normalizationIssue, issueIndex) => (
                      <li
                        key={`${normalizationIssue.lineNumber}-${issueIndex}`}
                        className={styles.issueItem}
                      >
                        <span
                          className={
                            normalizationIssue.severity === 'error'
                              ? styles.issueErrorBadge
                              : styles.issueWarningBadge
                          }
                        >
                          {normalizationIssue.severity}
                        </span>
                        <span className={styles.issueMessage}>
                          Строка {normalizationIssue.lineNumber}: {normalizationIssue.message}
                        </span>
                        <code className={styles.issueRawLine}>
                          {normalizationIssue.rawLine}
                        </code>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </>
          )}
        </>
      )}

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
