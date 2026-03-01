/* Этот файл реализует presenter: управляет состоянием и вызывает use-case функции. */
import { useCallback, useEffect, useMemo, useReducer, useRef } from 'react'
import type { ClipboardImageServicePort } from '../ports/clipboardImageServicePort'
import type { OcrTextNormalizerPort } from '../ports/ocrTextNormalizerPort'
import type { OcrProgressInfo, OcrServicePort } from '../ports/ocrServicePort'
import { defaultTaskLinkTemplate } from '../../domain/constants/defaultTaskLinkTemplate'
import type { NormalizationIssue } from '../../domain/models/normalizationIssue'
import type { TaskRow } from '../../domain/models/taskRow'
import type { InputSourceMode } from '../../domain/types/inputSourceMode'
import { taskStatusValues } from '../../domain/types/taskStatus'
import type { TaskStatus } from '../../domain/types/taskStatus'
import { ClipboardImageService } from '../../infrastructure/clipboard/clipboardImageService'
import { OcrTextNormalizer } from '../../infrastructure/normalization/ocrTextNormalizer'
import { TesseractOcrService } from '../../infrastructure/ocr/tesseractOcrService'
import { TaskRowsTextParser } from '../../infrastructure/parsers/taskRowsTextParser'
import { buildMarkdownTaskList } from '../use-cases/buildMarkdownTaskList'
import { parseTaskRowsFromText } from '../use-cases/parseTaskRowsFromText'
import type { DailyReportPresenterState } from './dailyReportPresenterState'

type DailyReportPresenterAction =
  | { type: 'inputSourceModeChanged'; inputSourceMode: InputSourceMode }
  | { type: 'rawInputTextChanged'; rawInputText: string }
  | { type: 'normalizedInputTextChanged'; normalizedInputText: string }
  | { type: 'shouldNormalizeOcrTextChanged'; shouldNormalizeOcrText: boolean }
  | { type: 'linkTemplateChanged'; linkTemplate: string }
  | { type: 'excludedSymbolsTextChanged'; excludedSymbolsText: string }
  | {
      type: 'shouldNormalizeWhitespaceChanged'
      shouldNormalizeWhitespace: boolean
    }
  | {
      type: 'imageFileSelected'
      selectedImageFileName: string | null
      imagePreviewUrl: string | null
    }
  | { type: 'imageRecognitionStarted' }
  | {
      type: 'imageRecognitionProgressUpdated'
      imageRecognitionProgressRatio: number
      imageRecognitionStatusText: string
    }
  | {
      type: 'imageRecognitionCompleted'
      rawInputText: string
      informationMessage: string
    }
  | { type: 'imageRecognitionFailed'; informationMessage: string }
  | {
      type: 'normalizationPrepared'
      normalizedInputText: string
      normalizationIssues: NormalizationIssue[]
    }
  | {
      type: 'parsingCompleted'
      parsedTaskRows: TaskRow[]
      parsingErrors: DailyReportPresenterState['parsingErrors']
      markdownResultText: string
      informationMessage: string
    }
  | {
      type: 'parsingCompletedWithNormalization'
      normalizedInputText: string
      normalizationIssues: NormalizationIssue[]
      parsedTaskRows: TaskRow[]
      parsingErrors: DailyReportPresenterState['parsingErrors']
      markdownResultText: string
      informationMessage: string
    }
  | {
      type: 'taskStatusChanged'
      parsedTaskRows: TaskRow[]
      markdownResultText: string
    }
  | {
      type: 'allTaskStatusesApplied'
      parsedTaskRows: TaskRow[]
      markdownResultText: string
      informationMessage: string
    }
  | { type: 'informationMessageSet'; informationMessage: string }
  | { type: 'copyResultSucceeded' }
  | { type: 'copyResultFailed'; informationMessage: string }

export interface DailyReportPresenter {
  state: DailyReportPresenterState
  onInputSourceModeChanged: (inputSourceMode: InputSourceMode) => void
  onRawInputTextChanged: (rawInputText: string) => void
  onNormalizedInputTextChanged: (normalizedInputText: string) => void
  onShouldNormalizeOcrTextChanged: (shouldNormalizeOcrText: boolean) => void
  onLinkTemplateChanged: (linkTemplate: string) => void
  onExcludedSymbolsTextChanged: (excludedSymbolsText: string) => void
  onShouldNormalizeWhitespaceChanged: (shouldNormalizeWhitespace: boolean) => void
  onImageFileSelected: (selectedImageFile: File | null) => void
  onClipboardPasteCaptured: (clipboardEvent: ClipboardEvent) => Promise<void>
  onRecognizeImageRequested: () => Promise<void>
  onParseRequested: () => void
  onTaskStatusChanged: (taskId: number, status: TaskStatus) => void
  onApplyStatusToAllRequested: (status: TaskStatus) => void
  onCopyResultRequested: () => Promise<void>
}

function createInitialState(): DailyReportPresenterState {
  return {
    inputSourceMode: 'TEXT',
    rawInputText: '',
    normalizedInputText: '',
    shouldNormalizeOcrText: true,
    normalizationIssues: [],
    linkTemplate: defaultTaskLinkTemplate,
    excludedSymbolsText: '→',
    shouldNormalizeWhitespace: true,
    selectedImageFileName: null,
    imagePreviewUrl: null,
    imageProcessingState: 'idle',
    isRecognizingImage: false,
    imageRecognitionProgressRatio: 0,
    imageRecognitionStatusText: null,
    parsedTaskRows: [],
    parsingErrors: [],
    markdownResultText: '',
    informationMessage: null,
    taskStatusOptions: taskStatusValues,
  }
}

function refreshMarkdownResultText(
  parsedTaskRows: TaskRow[],
  linkTemplate: string,
): string {
  return buildMarkdownTaskList(parsedTaskRows, linkTemplate)
}

function dailyReportPresenterReducer(
  state: DailyReportPresenterState,
  action: DailyReportPresenterAction,
): DailyReportPresenterState {
  switch (action.type) {
    case 'inputSourceModeChanged':
      return {
        ...state,
        inputSourceMode: action.inputSourceMode,
        informationMessage: null,
      }
    case 'rawInputTextChanged':
      return {
        ...state,
        rawInputText: action.rawInputText,
        informationMessage: null,
      }
    case 'normalizedInputTextChanged':
      return {
        ...state,
        normalizedInputText: action.normalizedInputText,
        informationMessage: null,
      }
    case 'shouldNormalizeOcrTextChanged':
      return {
        ...state,
        shouldNormalizeOcrText: action.shouldNormalizeOcrText,
        normalizationIssues: action.shouldNormalizeOcrText
          ? state.normalizationIssues
          : [],
        informationMessage: null,
      }
    case 'linkTemplateChanged':
      return {
        ...state,
        linkTemplate: action.linkTemplate,
        markdownResultText: refreshMarkdownResultText(
          state.parsedTaskRows,
          action.linkTemplate,
        ),
        informationMessage: null,
      }
    case 'excludedSymbolsTextChanged':
      return {
        ...state,
        excludedSymbolsText: action.excludedSymbolsText,
        informationMessage: null,
      }
    case 'shouldNormalizeWhitespaceChanged':
      return {
        ...state,
        shouldNormalizeWhitespace: action.shouldNormalizeWhitespace,
        informationMessage: null,
      }
    case 'imageFileSelected':
      return {
        ...state,
        inputSourceMode: 'IMAGE',
        selectedImageFileName: action.selectedImageFileName,
        imagePreviewUrl: action.imagePreviewUrl,
        imageProcessingState: 'idle',
        imageRecognitionProgressRatio: 0,
        imageRecognitionStatusText: null,
        informationMessage: null,
      }
    case 'imageRecognitionStarted':
      return {
        ...state,
        isRecognizingImage: true,
        imageProcessingState: 'processing',
        imageRecognitionProgressRatio: 0,
        imageRecognitionStatusText: 'starting',
        informationMessage: null,
      }
    case 'imageRecognitionProgressUpdated':
      return {
        ...state,
        imageRecognitionProgressRatio: action.imageRecognitionProgressRatio,
        imageRecognitionStatusText: action.imageRecognitionStatusText,
      }
    case 'imageRecognitionCompleted':
      return {
        ...state,
        isRecognizingImage: false,
        imageProcessingState: 'success',
        rawInputText: action.rawInputText,
        imageRecognitionProgressRatio: 1,
        imageRecognitionStatusText: 'completed',
        informationMessage: action.informationMessage,
      }
    case 'imageRecognitionFailed':
      return {
        ...state,
        isRecognizingImage: false,
        imageProcessingState: 'error',
        imageRecognitionStatusText: 'failed',
        informationMessage: action.informationMessage,
      }
    case 'normalizationPrepared':
      return {
        ...state,
        normalizedInputText: action.normalizedInputText,
        normalizationIssues: action.normalizationIssues,
      }
    case 'parsingCompleted':
      return {
        ...state,
        parsedTaskRows: action.parsedTaskRows,
        parsingErrors: action.parsingErrors,
        markdownResultText: action.markdownResultText,
        informationMessage: action.informationMessage,
      }
    case 'parsingCompletedWithNormalization':
      return {
        ...state,
        normalizedInputText: action.normalizedInputText,
        normalizationIssues: action.normalizationIssues,
        parsedTaskRows: action.parsedTaskRows,
        parsingErrors: action.parsingErrors,
        markdownResultText: action.markdownResultText,
        informationMessage: action.informationMessage,
      }
    case 'taskStatusChanged':
      return {
        ...state,
        parsedTaskRows: action.parsedTaskRows,
        markdownResultText: action.markdownResultText,
        informationMessage: null,
      }
    case 'allTaskStatusesApplied':
      return {
        ...state,
        parsedTaskRows: action.parsedTaskRows,
        markdownResultText: action.markdownResultText,
        informationMessage: action.informationMessage,
      }
    case 'informationMessageSet':
      return {
        ...state,
        informationMessage: action.informationMessage,
      }
    case 'copyResultSucceeded':
      return {
        ...state,
        informationMessage: 'Результат скопирован в буфер обмена.',
      }
    case 'copyResultFailed':
      return {
        ...state,
        informationMessage: action.informationMessage,
      }
    default:
      return state
  }
}

function buildParsingMessage(
  parsedTaskRowsCount: number,
  parsingErrorsCount: number,
): string {
  if (parsedTaskRowsCount === 0 && parsingErrorsCount === 0) {
    return 'Введите строки задач для разбора.'
  }

  if (parsingErrorsCount === 0) {
    return `Распознано задач: ${parsedTaskRowsCount}.`
  }

  return `Распознано задач: ${parsedTaskRowsCount}. Ошибок: ${parsingErrorsCount}.`
}

function buildParsingMessageWithNormalization(
  parsedTaskRowsCount: number,
  parsingErrorsCount: number,
  normalizationIssues: NormalizationIssue[],
): string {
  const normalizationErrorCount = normalizationIssues.filter(
    (normalizationIssue) => normalizationIssue.severity === 'error',
  ).length
  const normalizationWarningCount = normalizationIssues.filter(
    (normalizationIssue) => normalizationIssue.severity === 'warning',
  ).length

  return `Распознано задач: ${parsedTaskRowsCount}. Ошибок парсинга: ${parsingErrorsCount}. Нормализация: ошибок ${normalizationErrorCount}, предупреждений ${normalizationWarningCount}.`
}

function parseFilteredTokens(excludedSymbolsText: string): string[] {
  return excludedSymbolsText
    .split(',')
    .map((token) => token.trim())
    .filter((token) => token.length > 0)
}

function applyTextFilters(
  rawInputText: string,
  excludedSymbolsText: string,
  shouldNormalizeWhitespace: boolean,
): string {
  const filteredTokens = parseFilteredTokens(excludedSymbolsText)
  const preparedLines = rawInputText.split(/\r?\n/).map((sourceLine) => {
    let preparedLine = sourceLine

    filteredTokens.forEach((filteredToken) => {
      preparedLine = preparedLine.split(filteredToken).join('')
    })

    if (shouldNormalizeWhitespace) {
      preparedLine = preparedLine.replace(/\s+/g, ' ').trim()
    } else {
      preparedLine = preparedLine.trimEnd()
    }

    return preparedLine
  })

  return preparedLines.join('\n')
}

function updateSingleTaskStatus(
  parsedTaskRows: TaskRow[],
  taskId: number,
  status: TaskStatus,
): TaskRow[] {
  return parsedTaskRows.map((taskRow) =>
    taskRow.id === taskId ? { ...taskRow, status } : taskRow,
  )
}

function applyStatusToAllTasks(
  parsedTaskRows: TaskRow[],
  status: TaskStatus,
): TaskRow[] {
  return parsedTaskRows.map((taskRow) => ({ ...taskRow, status }))
}

function normalizeOcrProgressRatio(progressRatio: number): number {
  if (Number.isNaN(progressRatio)) {
    return 0
  }

  return Math.max(0, Math.min(1, progressRatio))
}

function buildOcrCompletedMessage(recognizedTextLength: number): string {
  return `OCR завершен. Распознано символов: ${recognizedTextLength}.`
}

function clipboardContainsPlainText(clipboardEvent: ClipboardEvent): boolean {
  const clipboardData = clipboardEvent.clipboardData
  if (!clipboardData) {
    return false
  }

  return Array.from(clipboardData.types).includes('text/plain')
}

export function useDailyReportPresenter(): DailyReportPresenter {
  const [state, dispatch] = useReducer(
    dailyReportPresenterReducer,
    undefined,
    createInitialState,
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
  const selectedImageFileReference = useRef<File | null>(null)
  const imagePreviewUrlReference = useRef<string | null>(null)

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

  const prepareNormalization = useCallback(
    (sourceText: string, excludedSymbolsText: string, shouldNormalizeWhitespace: boolean) => {
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
      dispatch({ type: 'inputSourceModeChanged', inputSourceMode })

      if (inputSourceMode === 'IMAGE' && state.shouldNormalizeOcrText) {
        const normalizationResult = prepareNormalization(
          state.rawInputText,
          state.excludedSymbolsText,
          state.shouldNormalizeWhitespace,
        )

        dispatch({
          type: 'normalizationPrepared',
          normalizedInputText: normalizationResult.normalizedText,
          normalizationIssues: normalizationResult.issues,
        })
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
      dispatch({ type: 'rawInputTextChanged', rawInputText })

      if (state.inputSourceMode === 'IMAGE' && state.shouldNormalizeOcrText) {
        const normalizationResult = prepareNormalization(
          rawInputText,
          state.excludedSymbolsText,
          state.shouldNormalizeWhitespace,
        )

        dispatch({
          type: 'normalizationPrepared',
          normalizedInputText: normalizationResult.normalizedText,
          normalizationIssues: normalizationResult.issues,
        })
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
    dispatch({ type: 'normalizedInputTextChanged', normalizedInputText })
  }, [])

  const onShouldNormalizeOcrTextChanged = useCallback(
    (shouldNormalizeOcrText: boolean) => {
      dispatch({ type: 'shouldNormalizeOcrTextChanged', shouldNormalizeOcrText })

      if (shouldNormalizeOcrText && state.inputSourceMode === 'IMAGE') {
        const normalizationResult = prepareNormalization(
          state.rawInputText,
          state.excludedSymbolsText,
          state.shouldNormalizeWhitespace,
        )

        dispatch({
          type: 'normalizationPrepared',
          normalizedInputText: normalizationResult.normalizedText,
          normalizationIssues: normalizationResult.issues,
        })
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

  const onLinkTemplateChanged = useCallback((linkTemplate: string) => {
    dispatch({ type: 'linkTemplateChanged', linkTemplate })
  }, [])

  const onExcludedSymbolsTextChanged = useCallback(
    (excludedSymbolsText: string) => {
      dispatch({ type: 'excludedSymbolsTextChanged', excludedSymbolsText })

      if (state.inputSourceMode === 'IMAGE' && state.shouldNormalizeOcrText) {
        const normalizationResult = prepareNormalization(
          state.rawInputText,
          excludedSymbolsText,
          state.shouldNormalizeWhitespace,
        )

        dispatch({
          type: 'normalizationPrepared',
          normalizedInputText: normalizationResult.normalizedText,
          normalizationIssues: normalizationResult.issues,
        })
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
      dispatch({
        type: 'shouldNormalizeWhitespaceChanged',
        shouldNormalizeWhitespace,
      })

      if (state.inputSourceMode === 'IMAGE' && state.shouldNormalizeOcrText) {
        const normalizationResult = prepareNormalization(
          state.rawInputText,
          state.excludedSymbolsText,
          shouldNormalizeWhitespace,
        )

        dispatch({
          type: 'normalizationPrepared',
          normalizedInputText: normalizationResult.normalizedText,
          normalizationIssues: normalizationResult.issues,
        })
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

  const recognizeImageFile = useCallback(
    async (selectedImageFile: File, shouldNormalizeOcrText: boolean) => {
      dispatch({ type: 'imageRecognitionStarted' })

      try {
        const recognizedText = await ocrService.recognizeTextFromImage(
          selectedImageFile,
          (ocrProgressInfo: OcrProgressInfo) => {
            dispatch({
              type: 'imageRecognitionProgressUpdated',
              imageRecognitionProgressRatio: normalizeOcrProgressRatio(
                ocrProgressInfo.progressRatio,
              ),
              imageRecognitionStatusText: ocrProgressInfo.statusText,
            })
          },
        )

        dispatch({
          type: 'imageRecognitionCompleted',
          rawInputText: recognizedText,
          informationMessage: buildOcrCompletedMessage(recognizedText.length),
        })

        if (shouldNormalizeOcrText) {
          const normalizationResult = prepareNormalization(
            recognizedText,
            state.excludedSymbolsText,
            state.shouldNormalizeWhitespace,
          )

          dispatch({
            type: 'normalizationPrepared',
            normalizedInputText: normalizationResult.normalizedText,
            normalizationIssues: normalizationResult.issues,
          })
        }
      } catch {
        dispatch({
          type: 'imageRecognitionFailed',
          informationMessage: 'Не удалось распознать текст с изображения.',
        })
      }
    },
    [
      ocrService,
      prepareNormalization,
      state.excludedSymbolsText,
      state.shouldNormalizeWhitespace,
    ],
  )

  const onImageFileSelected = useCallback(
    (selectedImageFile: File | null) => {
      selectedImageFileReference.current = selectedImageFile
      const imagePreviewUrl = replaceImagePreviewUrl(selectedImageFile)

      dispatch({
        type: 'imageFileSelected',
        selectedImageFileName: selectedImageFile ? selectedImageFile.name : null,
        imagePreviewUrl,
      })
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

        dispatch({
          type: 'informationMessageSet',
          informationMessage: 'В буфере обмена нет изображения PNG/JPG.',
        })
        return
      }

      clipboardEvent.preventDefault()

      selectedImageFileReference.current = clipboardImageFile
      const imagePreviewUrl = replaceImagePreviewUrl(clipboardImageFile)

      dispatch({
        type: 'imageFileSelected',
        selectedImageFileName: clipboardImageFile.name,
        imagePreviewUrl,
      })

      await recognizeImageFile(clipboardImageFile, state.shouldNormalizeOcrText)
    },
    [
      clipboardImageService,
      recognizeImageFile,
      replaceImagePreviewUrl,
      state.shouldNormalizeOcrText,
    ],
  )

  const onRecognizeImageRequested = useCallback(async () => {
    const selectedImageFile = selectedImageFileReference.current

    if (!selectedImageFile) {
      dispatch({
        type: 'informationMessageSet',
        informationMessage: 'Сначала выберите изображение PNG/JPG.',
      })
      return
    }

    await recognizeImageFile(selectedImageFile, state.shouldNormalizeOcrText)
  }, [recognizeImageFile, state.shouldNormalizeOcrText])

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
      const markdownResultText = refreshMarkdownResultText(
        parsingResult.parsedTaskRows,
        state.linkTemplate,
      )
      const informationMessage = buildParsingMessageWithNormalization(
        parsingResult.parsedTaskRows.length,
        parsingResult.parsingErrors.length,
        normalizationIssues,
      )

      dispatch({
        type: 'parsingCompletedWithNormalization',
        normalizedInputText,
        normalizationIssues,
        parsedTaskRows: parsingResult.parsedTaskRows,
        parsingErrors: parsingResult.parsingErrors,
        markdownResultText,
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
    const markdownResultText = refreshMarkdownResultText(
      parsingResult.parsedTaskRows,
      state.linkTemplate,
    )
    const informationMessage = buildParsingMessage(
      parsingResult.parsedTaskRows.length,
      parsingResult.parsingErrors.length,
    )

    dispatch({
      type: 'parsingCompleted',
      parsedTaskRows: parsingResult.parsedTaskRows,
      parsingErrors: parsingResult.parsingErrors,
      markdownResultText,
      informationMessage,
    })
  }, [
    prepareNormalization,
    state.excludedSymbolsText,
    state.inputSourceMode,
    state.linkTemplate,
    state.normalizationIssues,
    state.normalizedInputText,
    state.rawInputText,
    state.shouldNormalizeOcrText,
    state.shouldNormalizeWhitespace,
    taskRowsTextParser,
  ])

  const onTaskStatusChanged = useCallback(
    (taskId: number, status: TaskStatus) => {
      const updatedTaskRows = updateSingleTaskStatus(
        state.parsedTaskRows,
        taskId,
        status,
      )
      const markdownResultText = refreshMarkdownResultText(
        updatedTaskRows,
        state.linkTemplate,
      )

      dispatch({
        type: 'taskStatusChanged',
        parsedTaskRows: updatedTaskRows,
        markdownResultText,
      })
    },
    [state.linkTemplate, state.parsedTaskRows],
  )

  const onApplyStatusToAllRequested = useCallback(
    (status: TaskStatus) => {
      if (state.parsedTaskRows.length === 0) {
        dispatch({
          type: 'informationMessageSet',
          informationMessage: 'Нет задач для массовой смены статуса.',
        })
        return
      }

      const updatedTaskRows = applyStatusToAllTasks(state.parsedTaskRows, status)
      const markdownResultText = refreshMarkdownResultText(
        updatedTaskRows,
        state.linkTemplate,
      )

      dispatch({
        type: 'allTaskStatusesApplied',
        parsedTaskRows: updatedTaskRows,
        markdownResultText,
        informationMessage: 'Статус применен ко всем задачам.',
      })
    },
    [state.linkTemplate, state.parsedTaskRows],
  )

  const onCopyResultRequested = useCallback(async () => {
    if (state.markdownResultText.trim().length === 0) {
      dispatch({
        type: 'copyResultFailed',
        informationMessage: 'Нет данных для копирования.',
      })
      return
    }

    if (
      typeof navigator === 'undefined' ||
      typeof navigator.clipboard?.writeText !== 'function'
    ) {
      dispatch({
        type: 'copyResultFailed',
        informationMessage:
          'Буфер обмена недоступен в текущем окружении браузера.',
      })
      return
    }

    try {
      await navigator.clipboard.writeText(state.markdownResultText)
      dispatch({ type: 'copyResultSucceeded' })
    } catch {
      dispatch({
        type: 'copyResultFailed',
        informationMessage: 'Не удалось скопировать результат.',
      })
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
    onImageFileSelected,
    onClipboardPasteCaptured,
    onRecognizeImageRequested,
    onParseRequested,
    onTaskStatusChanged,
    onApplyStatusToAllRequested,
    onCopyResultRequested,
  }
}
