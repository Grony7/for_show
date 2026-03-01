/* Этот файл реализует presenter: управляет состоянием и вызывает use-case функции. */
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import type { InputSourceMode } from '../../domain/types/inputSourceMode'
import type { TaskStatus } from '../../domain/types/taskStatus'
import { ClipboardImageService } from '../../infrastructure/clipboard/clipboardImageService'
import { OcrTextNormalizer } from '../../infrastructure/normalization/ocrTextNormalizer'
import { TesseractOcrService } from '../../infrastructure/ocr/tesseractOcrService'
import { TaskRowsTextParser } from '../../infrastructure/parsers/taskRowsTextParser'
import { ReportVariablesBuilder } from '../../infrastructure/report/reportVariablesBuilder'
import { LocalStorageSettingsStorage } from '../../infrastructure/storage/localStorageSettingsStorage'
import type { ClipboardImageServicePort } from '../ports/clipboardImageServicePort'
import type { OcrTextNormalizerPort } from '../ports/ocrTextNormalizerPort'
import type { OcrProgressInfo, OcrServicePort } from '../ports/ocrServicePort'
import type { SettingsStoragePort } from '../ports/settingsStoragePort'
import { TemplateEngine } from '../template-engine/templateEngine'
import { parseTaskRowsFromText } from '../use-cases/parseTaskRowsFromText'
import type { DailyReportPresenterState } from './dailyReportPresenterState'
import {
  appendVariableToken,
  applyStatusToAllTasks,
  applyTextFilters,
  buildOcrCompletedMessage,
  buildParsingMessage,
  buildParsingMessageWithNormalization,
  calculateReportPatch,
  clipboardContainsPlainText,
  createInitialState,
  normalizeOcrProgressRatio,
  updateSingleTaskStatus,
} from './presenterHelpers'

export interface DailyReportPresenter {
  state: DailyReportPresenterState
  onInputSourceModeChanged: (inputSourceMode: InputSourceMode) => void
  onRawInputTextChanged: (rawInputText: string) => void
  onNormalizedInputTextChanged: (normalizedInputText: string) => void
  onShouldNormalizeOcrTextChanged: (shouldNormalizeOcrText: boolean) => void
  onLinkTemplateChanged: (linkTemplate: string) => void
  onExcludedSymbolsTextChanged: (excludedSymbolsText: string) => void
  onShouldNormalizeWhitespaceChanged: (shouldNormalizeWhitespace: boolean) => void
  onLineTemplateChanged: (lineTemplate: string) => void
  onDocumentTemplateChanged: (documentTemplate: string) => void
  onReportDateChanged: (reportDate: string) => void
  onSelectedPreviewTaskIdChanged: (selectedPreviewTaskId: number | null) => void
  onLineTemplateVariableTokenClicked: (variableToken: string) => void
  onDocumentTemplateVariableTokenClicked: (variableToken: string) => void
  onImageFileSelected: (selectedImageFile: File | null) => void
  onClipboardPasteCaptured: (clipboardEvent: ClipboardEvent) => Promise<void>
  onRecognizeImageRequested: () => Promise<void>
  onParseRequested: () => void
  onTaskStatusChanged: (taskId: number, status: TaskStatus) => void
  onApplyStatusToAllRequested: (status: TaskStatus) => void
  onCopyResultRequested: () => Promise<void>
}

export function useDailyReportPresenter(): DailyReportPresenter {
  const settingsStorage = useMemo<SettingsStoragePort>(
    () => new LocalStorageSettingsStorage(),
    [],
  )
  const [state, setState] = useState<DailyReportPresenterState>(() =>
    createInitialState(settingsStorage.load()),
  )
  const taskRowsTextParser = useMemo(() => new TaskRowsTextParser(), [])
  const ocrService = useMemo<OcrServicePort>(() => new TesseractOcrService(), [])
  const clipboardImageService = useMemo<ClipboardImageServicePort>(
    () => new ClipboardImageService(),
    [],
  )
  const ocrTextNormalizer = useMemo<OcrTextNormalizerPort>(
    () => new OcrTextNormalizer(),
    [],
  )
  const templateEngine = useMemo(() => new TemplateEngine(), [])
  const reportVariablesBuilder = useMemo(() => new ReportVariablesBuilder(), [])
  const selectedImageFileReference = useRef<File | null>(null)
  const imagePreviewUrlReference = useRef<string | null>(null)

  const setStateWithReport = useCallback(
    (patch: Partial<DailyReportPresenterState>) => {
      setState((previousState) => {
        const mergedState = { ...previousState, ...patch }
        const reportPatch = calculateReportPatch(
          mergedState,
          templateEngine,
          reportVariablesBuilder,
        )
        return { ...mergedState, ...reportPatch }
      })
    },
    [reportVariablesBuilder, templateEngine],
  )

  const replaceImagePreviewUrl = useCallback((selectedImageFile: File | null) => {
    const previousImagePreviewUrl = imagePreviewUrlReference.current
    if (previousImagePreviewUrl) {
      URL.revokeObjectURL(previousImagePreviewUrl)
    }

    if (!selectedImageFile) {
      imagePreviewUrlReference.current = null
      return null
    }

    const nextImagePreviewUrl = URL.createObjectURL(selectedImageFile)
    imagePreviewUrlReference.current = nextImagePreviewUrl
    return nextImagePreviewUrl
  }, [])

  useEffect(() => {
    return () => {
      if (imagePreviewUrlReference.current) {
        URL.revokeObjectURL(imagePreviewUrlReference.current)
      }
    }
  }, [])

  useEffect(() => {
    settingsStorage.save({
      documentTemplate: state.documentTemplate,
      lineTemplate: state.lineTemplate,
      linkTemplate: state.linkTemplate,
      excludedSymbolsText: state.excludedSymbolsText,
      shouldNormalizeWhitespace: state.shouldNormalizeWhitespace,
      shouldNormalizeOcrText: state.shouldNormalizeOcrText,
    })
  }, [
    settingsStorage,
    state.documentTemplate,
    state.lineTemplate,
    state.linkTemplate,
    state.excludedSymbolsText,
    state.shouldNormalizeWhitespace,
    state.shouldNormalizeOcrText,
  ])

  const prepareNormalization = useCallback(
    (
      sourceText: string,
      excludedSymbolsText: string,
      shouldNormalizeWhitespace: boolean,
    ) => {
      const filteredSourceText = applyTextFilters(
        sourceText,
        excludedSymbolsText,
        shouldNormalizeWhitespace,
      )
      const normalizationResult = ocrTextNormalizer.normalize(filteredSourceText)

      return {
        ...normalizationResult,
        normalizedText: applyTextFilters(
          normalizationResult.normalizedText,
          excludedSymbolsText,
          shouldNormalizeWhitespace,
        ),
      }
    },
    [ocrTextNormalizer],
  )

  const onInputSourceModeChanged = useCallback(
    (inputSourceMode: InputSourceMode) => {
      setState((previousState) => ({
        ...previousState,
        inputSourceMode,
        informationMessage: null,
      }))

      if (inputSourceMode === 'IMAGE' && state.shouldNormalizeOcrText) {
        const normalizationResult = prepareNormalization(
          state.rawInputText,
          state.excludedSymbolsText,
          state.shouldNormalizeWhitespace,
        )

        setState((previousState) => ({
          ...previousState,
          normalizedInputText: normalizationResult.normalizedText,
          normalizationIssues: normalizationResult.issues,
        }))
      }
    },
    [
      prepareNormalization,
      state.excludedSymbolsText,
      state.rawInputText,
      state.shouldNormalizeOcrText,
      state.shouldNormalizeWhitespace,
    ],
  )

  const onRawInputTextChanged = useCallback(
    (rawInputText: string) => {
      setState((previousState) => ({
        ...previousState,
        rawInputText,
        informationMessage: null,
      }))

      if (state.inputSourceMode === 'IMAGE' && state.shouldNormalizeOcrText) {
        const normalizationResult = prepareNormalization(
          rawInputText,
          state.excludedSymbolsText,
          state.shouldNormalizeWhitespace,
        )

        setState((previousState) => ({
          ...previousState,
          normalizedInputText: normalizationResult.normalizedText,
          normalizationIssues: normalizationResult.issues,
        }))
      }
    },
    [
      prepareNormalization,
      state.excludedSymbolsText,
      state.inputSourceMode,
      state.shouldNormalizeOcrText,
      state.shouldNormalizeWhitespace,
    ],
  )

  const onNormalizedInputTextChanged = useCallback((normalizedInputText: string) => {
    setState((previousState) => ({
      ...previousState,
      normalizedInputText,
      informationMessage: null,
    }))
  }, [])

  const onShouldNormalizeOcrTextChanged = useCallback(
    (shouldNormalizeOcrText: boolean) => {
      setState((previousState) => ({
        ...previousState,
        shouldNormalizeOcrText,
        normalizationIssues: shouldNormalizeOcrText
          ? previousState.normalizationIssues
          : [],
        informationMessage: null,
      }))

      if (shouldNormalizeOcrText && state.inputSourceMode === 'IMAGE') {
        const normalizationResult = prepareNormalization(
          state.rawInputText,
          state.excludedSymbolsText,
          state.shouldNormalizeWhitespace,
        )

        setState((previousState) => ({
          ...previousState,
          normalizedInputText: normalizationResult.normalizedText,
          normalizationIssues: normalizationResult.issues,
        }))
      }
    },
    [
      prepareNormalization,
      state.excludedSymbolsText,
      state.inputSourceMode,
      state.rawInputText,
      state.shouldNormalizeWhitespace,
    ],
  )

  const onLinkTemplateChanged = useCallback(
    (linkTemplate: string) => {
      setStateWithReport({ linkTemplate, informationMessage: null })
    },
    [setStateWithReport],
  )

  const onExcludedSymbolsTextChanged = useCallback(
    (excludedSymbolsText: string) => {
      setState((previousState) => ({
        ...previousState,
        excludedSymbolsText,
        informationMessage: null,
      }))

      if (state.inputSourceMode === 'IMAGE' && state.shouldNormalizeOcrText) {
        const normalizationResult = prepareNormalization(
          state.rawInputText,
          excludedSymbolsText,
          state.shouldNormalizeWhitespace,
        )

        setState((previousState) => ({
          ...previousState,
          normalizedInputText: normalizationResult.normalizedText,
          normalizationIssues: normalizationResult.issues,
        }))
      }
    },
    [
      prepareNormalization,
      state.inputSourceMode,
      state.rawInputText,
      state.shouldNormalizeOcrText,
      state.shouldNormalizeWhitespace,
    ],
  )

  const onShouldNormalizeWhitespaceChanged = useCallback(
    (shouldNormalizeWhitespace: boolean) => {
      setState((previousState) => ({
        ...previousState,
        shouldNormalizeWhitespace,
        informationMessage: null,
      }))

      if (state.inputSourceMode === 'IMAGE' && state.shouldNormalizeOcrText) {
        const normalizationResult = prepareNormalization(
          state.rawInputText,
          state.excludedSymbolsText,
          shouldNormalizeWhitespace,
        )

        setState((previousState) => ({
          ...previousState,
          normalizedInputText: normalizationResult.normalizedText,
          normalizationIssues: normalizationResult.issues,
        }))
      }
    },
    [
      prepareNormalization,
      state.excludedSymbolsText,
      state.inputSourceMode,
      state.rawInputText,
      state.shouldNormalizeOcrText,
    ],
  )

  const onLineTemplateChanged = useCallback(
    (lineTemplate: string) => {
      setStateWithReport({ lineTemplate, informationMessage: null })
    },
    [setStateWithReport],
  )

  const onDocumentTemplateChanged = useCallback(
    (documentTemplate: string) => {
      setStateWithReport({ documentTemplate, informationMessage: null })
    },
    [setStateWithReport],
  )

  const onReportDateChanged = useCallback(
    (reportDate: string) => {
      setStateWithReport({ reportDate, informationMessage: null })
    },
    [setStateWithReport],
  )

  const onSelectedPreviewTaskIdChanged = useCallback(
    (selectedPreviewTaskId: number | null) => {
      setStateWithReport({ selectedPreviewTaskId, informationMessage: null })
    },
    [setStateWithReport],
  )

  const onLineTemplateVariableTokenClicked = useCallback(
    (variableToken: string) => {
      setStateWithReport({
        lineTemplate: appendVariableToken(state.lineTemplate, variableToken),
        informationMessage: null,
      })
    },
    [setStateWithReport, state.lineTemplate],
  )

  const onDocumentTemplateVariableTokenClicked = useCallback(
    (variableToken: string) => {
      setStateWithReport({
        documentTemplate: appendVariableToken(
          state.documentTemplate,
          variableToken,
        ),
        informationMessage: null,
      })
    },
    [setStateWithReport, state.documentTemplate],
  )

  const recognizeImageFile = useCallback(
    async (
      selectedImageFile: File,
      shouldNormalizeOcrText: boolean,
      excludedSymbolsText: string,
      shouldNormalizeWhitespace: boolean,
    ) => {
      setState((previousState) => ({
        ...previousState,
        isRecognizingImage: true,
        imageProcessingState: 'processing',
        imageRecognitionProgressRatio: 0,
        imageRecognitionStatusText: 'starting',
        informationMessage: null,
      }))

      try {
        const recognizedText = await ocrService.recognizeTextFromImage(
          selectedImageFile,
          (ocrProgressInfo: OcrProgressInfo) => {
            setState((previousState) => ({
              ...previousState,
              imageRecognitionProgressRatio: normalizeOcrProgressRatio(
                ocrProgressInfo.progressRatio,
              ),
              imageRecognitionStatusText: ocrProgressInfo.statusText,
            }))
          },
        )

        setState((previousState) => ({
          ...previousState,
          isRecognizingImage: false,
          imageProcessingState: 'success',
          rawInputText: recognizedText,
          imageRecognitionProgressRatio: 1,
          imageRecognitionStatusText: 'completed',
          informationMessage: buildOcrCompletedMessage(recognizedText.length),
        }))

        if (shouldNormalizeOcrText) {
          const normalizationResult = prepareNormalization(
            recognizedText,
            excludedSymbolsText,
            shouldNormalizeWhitespace,
          )

          setState((previousState) => ({
            ...previousState,
            normalizedInputText: normalizationResult.normalizedText,
            normalizationIssues: normalizationResult.issues,
          }))
        }
      } catch {
        setState((previousState) => ({
          ...previousState,
          isRecognizingImage: false,
          imageProcessingState: 'error',
          imageRecognitionStatusText: 'failed',
          informationMessage: 'Не удалось распознать текст с изображения.',
        }))
      }
    },
    [ocrService, prepareNormalization],
  )

  const onImageFileSelected = useCallback(
    (selectedImageFile: File | null) => {
      selectedImageFileReference.current = selectedImageFile
      const imagePreviewUrl = replaceImagePreviewUrl(selectedImageFile)

      setState((previousState) => ({
        ...previousState,
        inputSourceMode: 'IMAGE',
        selectedImageFileName: selectedImageFile ? selectedImageFile.name : null,
        imagePreviewUrl,
        imageProcessingState: 'idle',
        imageRecognitionProgressRatio: 0,
        imageRecognitionStatusText: null,
        informationMessage: null,
      }))
    },
    [replaceImagePreviewUrl],
  )

  const onClipboardPasteCaptured = useCallback(
    async (clipboardEvent: ClipboardEvent) => {
      const clipboardImageFile =
        clipboardImageService.extractImageFromClipboard(clipboardEvent)

      if (!clipboardImageFile) {
        if (clipboardContainsPlainText(clipboardEvent)) {
          return
        }

        setState((previousState) => ({
          ...previousState,
          informationMessage: 'В буфере обмена нет изображения PNG/JPG.',
        }))
        return
      }

      clipboardEvent.preventDefault()
      selectedImageFileReference.current = clipboardImageFile
      const imagePreviewUrl = replaceImagePreviewUrl(clipboardImageFile)

      setState((previousState) => ({
        ...previousState,
        inputSourceMode: 'IMAGE',
        selectedImageFileName: clipboardImageFile.name,
        imagePreviewUrl,
        imageProcessingState: 'idle',
        imageRecognitionProgressRatio: 0,
        imageRecognitionStatusText: null,
        informationMessage: null,
      }))

      await recognizeImageFile(
        clipboardImageFile,
        state.shouldNormalizeOcrText,
        state.excludedSymbolsText,
        state.shouldNormalizeWhitespace,
      )
    },
    [
      clipboardImageService,
      recognizeImageFile,
      replaceImagePreviewUrl,
      state.excludedSymbolsText,
      state.shouldNormalizeOcrText,
      state.shouldNormalizeWhitespace,
    ],
  )

  const onRecognizeImageRequested = useCallback(async () => {
    const selectedImageFile = selectedImageFileReference.current

    if (!selectedImageFile) {
      setState((previousState) => ({
        ...previousState,
        informationMessage: 'Сначала выберите изображение PNG/JPG.',
      }))
      return
    }

    await recognizeImageFile(
      selectedImageFile,
      state.shouldNormalizeOcrText,
      state.excludedSymbolsText,
      state.shouldNormalizeWhitespace,
    )
  }, [
    recognizeImageFile,
    state.excludedSymbolsText,
    state.shouldNormalizeOcrText,
    state.shouldNormalizeWhitespace,
  ])

  const onParseRequested = useCallback(() => {
    if (state.inputSourceMode === 'IMAGE' && state.shouldNormalizeOcrText) {
      let normalizedInputText =
        state.normalizedInputText.trim().length > 0
          ? state.normalizedInputText
          : state.rawInputText
      let normalizationIssues = state.normalizationIssues

      if (state.normalizedInputText.trim().length === 0) {
        const normalizationResult = prepareNormalization(
          state.rawInputText,
          state.excludedSymbolsText,
          state.shouldNormalizeWhitespace,
        )
        normalizedInputText = normalizationResult.normalizedText
        normalizationIssues = normalizationResult.issues
      } else {
        normalizedInputText = applyTextFilters(
          normalizedInputText,
          state.excludedSymbolsText,
          state.shouldNormalizeWhitespace,
        )
      }

      const parsingResult = taskRowsTextParser.parseRawInput(normalizedInputText)
      const informationMessage = buildParsingMessageWithNormalization(
        parsingResult.parsedTaskRows.length,
        parsingResult.parsingErrors.length,
        normalizationIssues,
      )

      setStateWithReport({
        normalizedInputText,
        normalizationIssues,
        parsedTaskRows: parsingResult.parsedTaskRows,
        parsingErrors: parsingResult.parsingErrors,
        informationMessage,
      })
      return
    }

    const filteredRawInputText = applyTextFilters(
      state.rawInputText,
      state.excludedSymbolsText,
      state.shouldNormalizeWhitespace,
    )
    const parsingResult = parseTaskRowsFromText(filteredRawInputText, taskRowsTextParser)
    const informationMessage = buildParsingMessage(
      parsingResult.parsedTaskRows.length,
      parsingResult.parsingErrors.length,
    )

    setStateWithReport({
      parsedTaskRows: parsingResult.parsedTaskRows,
      parsingErrors: parsingResult.parsingErrors,
      informationMessage,
    })
  }, [prepareNormalization, setStateWithReport, state, taskRowsTextParser])

  const onTaskStatusChanged = useCallback(
    (taskId: number, status: TaskStatus) => {
      const updatedTaskRows = updateSingleTaskStatus(
        state.parsedTaskRows,
        taskId,
        status,
      )
      setStateWithReport({ parsedTaskRows: updatedTaskRows, informationMessage: null })
    },
    [setStateWithReport, state.parsedTaskRows],
  )

  const onApplyStatusToAllRequested = useCallback(
    (status: TaskStatus) => {
      if (state.parsedTaskRows.length === 0) {
        setState((previousState) => ({
          ...previousState,
          informationMessage: 'Нет задач для массовой смены статуса.',
        }))
        return
      }

      const updatedTaskRows = applyStatusToAllTasks(state.parsedTaskRows, status)
      setStateWithReport({
        parsedTaskRows: updatedTaskRows,
        informationMessage: 'Статус применен ко всем задачам.',
      })
    },
    [setStateWithReport, state.parsedTaskRows],
  )

  const onCopyResultRequested = useCallback(async () => {
    if (state.markdownResultText.trim().length === 0) {
      setState((previousState) => ({
        ...previousState,
        informationMessage: 'Нет данных для копирования.',
      }))
      return
    }

    if (
      typeof navigator === 'undefined' ||
      typeof navigator.clipboard?.writeText !== 'function'
    ) {
      setState((previousState) => ({
        ...previousState,
        informationMessage:
          'Буфер обмена недоступен в текущем окружении браузера.',
      }))
      return
    }

    try {
      await navigator.clipboard.writeText(state.markdownResultText)
      setState((previousState) => ({
        ...previousState,
        informationMessage: 'Результат скопирован в буфер обмена.',
      }))
    } catch {
      setState((previousState) => ({
        ...previousState,
        informationMessage: 'Не удалось скопировать результат.',
      }))
    }
  }, [state.markdownResultText])

  return {
    state,
    onInputSourceModeChanged,
    onRawInputTextChanged,
    onNormalizedInputTextChanged,
    onShouldNormalizeOcrTextChanged,
    onLinkTemplateChanged,
    onExcludedSymbolsTextChanged,
    onShouldNormalizeWhitespaceChanged,
    onLineTemplateChanged,
    onDocumentTemplateChanged,
    onReportDateChanged,
    onSelectedPreviewTaskIdChanged,
    onLineTemplateVariableTokenClicked,
    onDocumentTemplateVariableTokenClicked,
    onImageFileSelected,
    onClipboardPasteCaptured,
    onRecognizeImageRequested,
    onParseRequested,
    onTaskStatusChanged,
    onApplyStatusToAllRequested,
    onCopyResultRequested,
  }
}
