/* Этот файл содержит детерминированную нормализацию времени в конце OCR-строки. */
export interface NormalizeTimeSuccess {
  isValid: true
  normalizedDurationText: string
  matchStartIndex: number
  matchEndIndex: number
}

export interface NormalizeTimeFailure {
  isValid: false
  message: string
}

export type NormalizeTimeResult = NormalizeTimeSuccess | NormalizeTimeFailure

interface TimeCandidateMatch {
  matchStartIndex: number
  matchEndIndex: number
  hours: number
  minutes: number
}

const zeroLikeCharactersPattern = /[OoОоДд]/g

function toDigitsOnly(rawToken: string): string {
  return rawToken.replace(zeroLikeCharactersPattern, '0').replace(/[^0-9]/g, '')
}

function buildDurationText(hours: number, minutes: number): string {
  return `${hours} ч. ${minutes}м.`
}

function isTimeValueValid(hours: number, minutes: number): boolean {
  return Number.isInteger(hours) && Number.isInteger(minutes) && minutes >= 0 && minutes <= 59 && hours >= 0
}

function createTimeCandidateMatch(
  matchStartIndex: number,
  matchEndIndex: number,
  hours: number,
  minutes: number,
): TimeCandidateMatch | null {
  if (!isTimeValueValid(hours, minutes)) {
    return null
  }

  return {
    matchStartIndex,
    matchEndIndex,
    hours,
    minutes,
  }
}

function tryNormalizeMarkedHoursAndMinutes(
  sourceText: string,
): TimeCandidateMatch | null {
  const fullMarkedPattern =
    /(?<hours>[0-9OoОо]{1,2})\s*[чh]\.?\s*(?<minutes>[0-9OoОоДд]{1,2})\s*[мm]\.?[,.;:]?\s*$/iu
  const looseMarkedPattern =
    /(?<hours>[0-9OoОо]{1,2})\s*[чh]\.?\s*(?<minutes>[0-9OoОоДд]{1,2})\s*\.?[,.;:]?\s*$/iu

  for (const candidatePattern of [fullMarkedPattern, looseMarkedPattern]) {
    const matchResult = candidatePattern.exec(sourceText)
    if (!matchResult?.groups) {
      continue
    }

    const hoursDigits = toDigitsOnly(matchResult.groups.hours)
    const minutesDigits = toDigitsOnly(matchResult.groups.minutes)
    if (!hoursDigits || !minutesDigits) {
      continue
    }

    const hours = Number(hoursDigits)
    const minutes = Number(minutesDigits)
    const matchedText = matchResult[0]
    const matchStartIndex = sourceText.length - matchedText.length

    const timeCandidateMatch = createTimeCandidateMatch(
      matchStartIndex,
      sourceText.length,
      hours,
      minutes,
    )

    if (timeCandidateMatch) {
      return timeCandidateMatch
    }
  }

  return null
}

function tryNormalizeMinutesOnly(sourceText: string): TimeCandidateMatch | null {
  const minutesOnlyPattern =
    /(?<minutesBlock>[0-9OoОоДд\s]{1,6})\s*[мm]\.?[,.;:]?\s*$/iu
  const matchResult = minutesOnlyPattern.exec(sourceText)

  if (!matchResult?.groups) {
    return null
  }

  const minutesDigits = toDigitsOnly(matchResult.groups.minutesBlock)
  if (!minutesDigits) {
    return null
  }

  let hours = 0
  let minutes = 0

  if (minutesDigits.length <= 2) {
    minutes = Number(minutesDigits)
  } else if (minutesDigits.length === 3) {
    hours = Number(minutesDigits.slice(0, 1))
    minutes = Number(minutesDigits.slice(1))
  } else if (minutesDigits.length === 4) {
    hours = Number(minutesDigits.slice(0, 2))
    minutes = Number(minutesDigits.slice(2))
  } else {
    return null
  }

  const matchedText = matchResult[0]
  const matchStartIndex = sourceText.length - matchedText.length

  return createTimeCandidateMatch(
    matchStartIndex,
    sourceText.length,
    hours,
    minutes,
  )
}

function tryNormalizeDottedPattern(sourceText: string): TimeCandidateMatch | null {
  const dottedPattern =
    /(?<left>[0-9OoОо]{1,3})\s*[.,]\s*(?<right>[0-9OoОоДд]{1,2})\s*(?:[мm])?\.?[,.;:]?\s*$/iu
  const matchResult = dottedPattern.exec(sourceText)

  if (!matchResult?.groups) {
    return null
  }

  const leftDigits = toDigitsOnly(matchResult.groups.left)
  const rightDigits = toDigitsOnly(matchResult.groups.right)
  if (!leftDigits || !rightDigits) {
    return null
  }

  let hours = 0
  if (leftDigits.startsWith('0')) {
    hours = 0
  } else if (leftDigits.length >= 2) {
    hours = Number(leftDigits.slice(0, 1))
  } else {
    hours = Number(leftDigits)
  }

  const minutes = Number(rightDigits)
  const matchedText = matchResult[0]
  const matchStartIndex = sourceText.length - matchedText.length

  return createTimeCandidateMatch(
    matchStartIndex,
    sourceText.length,
    hours,
    minutes,
  )
}

function tryNormalizeSeparatedDigits(sourceText: string): TimeCandidateMatch | null {
  const separatedDigitsPattern =
    /(?<hours>[0-9OoОо])\s+(?<minutes>[0-9OoОоДд]{1,2})\s*[,.;:]?\s*$/u
  const matchResult = separatedDigitsPattern.exec(sourceText)

  if (!matchResult?.groups) {
    return null
  }

  const hoursDigits = toDigitsOnly(matchResult.groups.hours)
  const minutesDigits = toDigitsOnly(matchResult.groups.minutes)
  if (!hoursDigits || !minutesDigits) {
    return null
  }

  const hours = Number(hoursDigits)
  const minutes = Number(minutesDigits)
  const matchedText = matchResult[0]
  const matchStartIndex = sourceText.length - matchedText.length

  return createTimeCandidateMatch(
    matchStartIndex,
    sourceText.length,
    hours,
    minutes,
  )
}

export function normalizeTimeFromLineEnd(sourceText: string): NormalizeTimeResult {
  const trimmedSourceText = sourceText.trimEnd()
  const timeCandidateMatch =
    tryNormalizeMarkedHoursAndMinutes(trimmedSourceText) ??
    tryNormalizeDottedPattern(trimmedSourceText) ??
    tryNormalizeMinutesOnly(trimmedSourceText) ??
    tryNormalizeSeparatedDigits(trimmedSourceText)

  if (!timeCandidateMatch) {
    return {
      isValid: false,
      message: 'Не удалось уверенно распознать время в конце строки.',
    }
  }

  return {
    isValid: true,
    normalizedDurationText: buildDurationText(
      timeCandidateMatch.hours,
      timeCandidateMatch.minutes,
    ),
    matchStartIndex: timeCandidateMatch.matchStartIndex,
    matchEndIndex: timeCandidateMatch.matchEndIndex,
  }
}
