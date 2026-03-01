/* Этот файл проверяет нормализацию одной OCR-строки в формат парсера задач. */
import { describe, expect, it } from 'vitest'
import { normalizeOcrLine } from './normalizeLine'

describe('normalizeOcrLine', () => {
  it('skips header line without identifier and reports warning', () => {
    const normalizeLineResult = normalizeOcrLine('Г] Задача Время', 1)

    expect(normalizeLineResult.includeInNormalizedText).toBe(false)
    expect(normalizeLineResult.normalizedLineText).toBeNull()
    expect(normalizeLineResult.issues).toHaveLength(1)
    expect(normalizeLineResult.issues[0].severity).toBe('warning')
  })

  it('normalizes subtask marker and malformed minutes-only time', () => {
    const normalizeLineResult = normalizeOcrLine(
      '4791 — Изучение задачи 145m.',
      2,
    )

    expect(normalizeLineResult.includeInNormalizedText).toBe(true)
    expect(normalizeLineResult.normalizedLineText).toBe(
      '4791 → Изучение задачи 1 ч. 45м.',
    )
  })

  it('normalizes different subtask marker variants', () => {
    const normalizeLineResult = normalizeOcrLine('4769 -+ Подзадача 14.11m,', 3)

    expect(normalizeLineResult.normalizedLineText).toBe(
      '4769 → Подзадача 1 ч. 11м.',
    )
  })

  it('keeps line with invalid marker and reports error', () => {
    const normalizeLineResult = normalizeOcrLine('4837 — Тестовая строка ???', 4)

    expect(normalizeLineResult.includeInNormalizedText).toBe(true)
    expect(normalizeLineResult.normalizedLineText).toBe(
      '4837 → Тестовая строка ??? <INVALID_TIME>',
    )
    expect(
      normalizeLineResult.issues.some(
        (normalizationIssue) => normalizationIssue.severity === 'error',
      ),
    ).toBe(true)
  })
})
