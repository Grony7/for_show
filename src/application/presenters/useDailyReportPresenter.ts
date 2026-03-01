/* Этот файл реализует presenter: управляет состоянием и вызывает use-case функции. */
import { useCallback, useMemo, useReducer } from 'react'
import { defaultTaskLinkTemplate } from '../../domain/constants/defaultTaskLinkTemplate'
import type { TaskRow } from '../../domain/models/taskRow'
import { taskStatusValues } from '../../domain/types/taskStatus'
import type { TaskStatus } from '../../domain/types/taskStatus'
import { TaskRowsTextParser } from '../../infrastructure/parsers/taskRowsTextParser'
import { buildMarkdownTaskList } from '../use-cases/buildMarkdownTaskList'
import { parseTaskRowsFromText } from '../use-cases/parseTaskRowsFromText'
import type { DailyReportPresenterState } from './dailyReportPresenterState'

type DailyReportPresenterAction =
  | { type: 'rawInputTextChanged'; rawInputText: string }
  | { type: 'linkTemplateChanged'; linkTemplate: string }
  | { type: 'excludedSymbolsTextChanged'; excludedSymbolsText: string }
  | {
      type: 'shouldNormalizeWhitespaceChanged'
      shouldNormalizeWhitespace: boolean
    }
  | {
      type: 'parsingCompleted'
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
  | { type: 'copyResultSucceeded' }
  | { type: 'copyResultFailed'; informationMessage: string }

export interface DailyReportPresenter {
  state: DailyReportPresenterState
  onRawInputTextChanged: (rawInputText: string) => void
  onLinkTemplateChanged: (linkTemplate: string) => void
  onExcludedSymbolsTextChanged: (excludedSymbolsText: string) => void
  onShouldNormalizeWhitespaceChanged: (shouldNormalizeWhitespace: boolean) => void
  onParseRequested: () => void
  onTaskStatusChanged: (taskId: number, status: TaskStatus) => void
  onApplyStatusToAllRequested: (status: TaskStatus) => void
  onCopyResultRequested: () => Promise<void>
}

function createInitialState(): DailyReportPresenterState {
  return {
    rawInputText: '',
    linkTemplate: defaultTaskLinkTemplate,
    excludedSymbolsText: '→',
    shouldNormalizeWhitespace: true,
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
    case 'rawInputTextChanged':
      return {
        ...state,
        rawInputText: action.rawInputText,
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
    case 'parsingCompleted':
      return {
        ...state,
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

export function useDailyReportPresenter(): DailyReportPresenter {
  const [state, dispatch] = useReducer(
    dailyReportPresenterReducer,
    undefined,
    createInitialState,
  )
  const taskRowsTextParser = useMemo(() => new TaskRowsTextParser(), [])

  const onRawInputTextChanged = useCallback((rawInputText: string) => {
    dispatch({ type: 'rawInputTextChanged', rawInputText })
  }, [])

  const onLinkTemplateChanged = useCallback((linkTemplate: string) => {
    dispatch({ type: 'linkTemplateChanged', linkTemplate })
  }, [])

  const onExcludedSymbolsTextChanged = useCallback(
    (excludedSymbolsText: string) => {
      dispatch({ type: 'excludedSymbolsTextChanged', excludedSymbolsText })
    },
    [],
  )

  const onShouldNormalizeWhitespaceChanged = useCallback(
    (shouldNormalizeWhitespace: boolean) => {
      dispatch({
        type: 'shouldNormalizeWhitespaceChanged',
        shouldNormalizeWhitespace,
      })
    },
    [],
  )

  const onParseRequested = useCallback(() => {
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
    state.excludedSymbolsText,
    state.linkTemplate,
    state.rawInputText,
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
          type: 'copyResultFailed',
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
    onRawInputTextChanged,
    onLinkTemplateChanged,
    onExcludedSymbolsTextChanged,
    onShouldNormalizeWhitespaceChanged,
    onParseRequested,
    onTaskStatusChanged,
    onApplyStatusToAllRequested,
    onCopyResultRequested,
  }
}
