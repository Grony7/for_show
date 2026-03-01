/* Этот файл рендерит режимы ввода и общие настройки парсинга задач. */
import type { ChangeEvent } from 'react'
import type { ImageProcessingState } from '../../application/presenters/dailyReportPresenterState'
import type { NormalizationIssue } from '../../domain/models/normalizationIssue'
import {
  inputSourceModeLabelByValue,
  inputSourceModeValues,
} from '../../domain/types/inputSourceMode'
import type { InputSourceMode } from '../../domain/types/inputSourceMode'
import styles from './DailyReportForm.module.css'
import { ImageInputSection } from './ImageInputSection'

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
            placeholder='1001   Описание задачи   1 ч. 30м.'
          />
        </>
      ) : (
        <ImageInputSection
          rawInputText={rawInputText}
          normalizedInputText={normalizedInputText}
          shouldNormalizeOcrText={shouldNormalizeOcrText}
          normalizationIssues={normalizationIssues}
          selectedImageFileName={selectedImageFileName}
          imagePreviewUrl={imagePreviewUrl}
          isRecognizingImage={isRecognizingImage}
          imageProcessingState={imageProcessingState}
          imageRecognitionProgressRatio={imageRecognitionProgressRatio}
          imageRecognitionStatusText={imageRecognitionStatusText}
          onRawInputTextChanged={onRawInputTextChanged}
          onNormalizedInputTextChanged={onNormalizedInputTextChanged}
          onShouldNormalizeOcrTextChanged={onShouldNormalizeOcrTextChanged}
          onImageFileSelected={onImageFileSelected}
          onClipboardPasteCaptured={onClipboardPasteCaptured}
          onRecognizeImageRequested={onRecognizeImageRequested}
        />
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
