/* Этот файл проверяет нормализацию времени из типичных OCR-ошибок. */
import { describe, expect, it } from 'vitest'
import { normalizeTimeFromLineEnd } from './normalizeTime'

function expectNormalizedDurationText(
  sourceText: string,
  expectedDurationText: string,
): void {
  const normalizeTimeResult = normalizeTimeFromLineEnd(sourceText)
  expect(normalizeTimeResult.isValid).toBe(true)

  if (!normalizeTimeResult.isValid) {
    return
  }

  expect(normalizeTimeResult.normalizedDurationText).toBe(expectedDurationText)
}

describe('normalizeTimeFromLineEnd', () => {
  it('normalizes standard format with hour and minute markers', () => {
    expectNormalizedDurationText('Задача 0 ч. 0м.', '0 ч. 0м.')
    expectNormalizedDurationText('Задача 1ч.5м.', '1 ч. 5м.')
    expectNormalizedDurationText('Задача 1 ч 5 м', '1 ч. 5м.')
  })

  it('normalizes minutes-only format', () => {
    expectNormalizedDurationText('Изучение задачи 145m.', '1 ч. 45м.')
    expectNormalizedDurationText('Изучение задачи 14 5m.', '1 ч. 45м.')
  })

  it('normalizes dotted OCR artifacts', () => {
    expectNormalizedDurationText('Задача 04. 0м.', '0 ч. 0м.')
    expectNormalizedDurationText('Задача 04. Ом.', '0 ч. 0м.')
    expectNormalizedDurationText('Задача 34. 5.', '3 ч. 5м.')
    expectNormalizedDurationText('Задача 14.11m,', '1 ч. 11м.')
    expectNormalizedDurationText('Задача 04.48.', '0 ч. 48м.')
  })

  it('returns invalid result when time is not recognized', () => {
    const normalizeTimeResult = normalizeTimeFromLineEnd(
      'Задача без времени в конце',
    )

    expect(normalizeTimeResult.isValid).toBe(false)
  })
})
